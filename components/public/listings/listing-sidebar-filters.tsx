"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FilterableAmenity } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface ListingSidebarFiltersProps {
  resultCount: number;
  filterableAmenities: FilterableAmenity[];
  /**
   * Real min/max nightly rate from the catalog (in TND). The price filter
   * defaults to this range and clamps user input within it.
   */
  priceMinTnd: number;
  priceMaxTnd: number;
}

type PositionValue = "" | "beachfront" | "second-line";

const CAPACITY_BUCKETS: {
  value: string;
  label: string;
  min: number;
  max?: number;
}[] = [
  { value: "2", label: "2 voyageurs", min: 2, max: 3 },
  { value: "4", label: "4 voyageurs", min: 4, max: 5 },
  { value: "6", label: "6 voyageurs", min: 6, max: 7 },
  { value: "8", label: "8+ voyageurs", min: 8 },
];

/**
 * Vertical sidebar filter panel for the chalets listing. Sections in order:
 * Équipements (amenities + the curated pool/seaView/beachfront triplet) /
 * Position (radio) / Capacité (checkbox buckets) / Prix par nuit (min/max
 * number inputs) / Reset. No outer card border — each section is divided
 * by a hairline bottom border.
 *
 * URL syncs immediately for checkbox / radio changes; price inputs commit
 * on blur to avoid hammering the router while the user types.
 */
export function ListingSidebarFilters({
  resultCount,
  filterableAmenities,
  priceMinTnd,
  priceMaxTnd,
}: ListingSidebarFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [pool, setPool] = useState(sp?.get("pool") === "1");
  const [seaView, setSeaView] = useState(sp?.get("seaView") === "1");
  const [beachfrontAmenity, setBeachfrontAmenity] = useState(false);
  const initialPosition: PositionValue =
    sp?.get("beachfront") === "1"
      ? "beachfront"
      : sp?.get("beachfront") === "0"
        ? "second-line"
        : "";
  const [position, setPosition] = useState<PositionValue>(initialPosition);
  const initialCapacityBuckets = (sp?.get("capacityBuckets") ?? "")
    .split(",")
    .filter(Boolean);
  const [capacityBuckets, setCapacityBuckets] = useState<string[]>(
    initialCapacityBuckets,
  );
  /* Price filter — default to the actual catalog bounds when the URL
   * carries no value. The numeric inputs commit on blur; meanwhile the
   * track + thumb visuals update in real time as the user types. */
  const [minPrice, setMinPrice] = useState(
    sp?.get("minPrice") ?? String(priceMinTnd),
  );
  const [maxPrice, setMaxPrice] = useState(
    sp?.get("maxPrice") ?? String(priceMaxTnd),
  );
  const initialAmenities = (sp?.get("amenities") ?? "")
    .split(",")
    .filter(Boolean);
  const [activeAmenities, setActiveAmenities] =
    useState<string[]>(initialAmenities);

  function apply() {
    const params = new URLSearchParams(sp?.toString() ?? "");
    // Pool / sea view
    setOrDelete(params, "pool", pool ? "1" : null);
    setOrDelete(params, "seaView", seaView ? "1" : null);
    // Position
    if (position === "beachfront") params.set("beachfront", "1");
    else if (position === "second-line") params.set("beachfront", "0");
    else params.delete("beachfront");
    // Capacity buckets → translate to minCapacity for the server query.
    if (capacityBuckets.length > 0) {
      params.set("capacityBuckets", capacityBuckets.join(","));
      const minCapacity = Math.min(
        ...capacityBuckets
          .map((v) => CAPACITY_BUCKETS.find((b) => b.value === v)?.min)
          .filter((n): n is number => typeof n === "number"),
      );
      if (Number.isFinite(minCapacity)) {
        params.set("guests", String(minCapacity));
      }
    } else {
      params.delete("capacityBuckets");
      params.delete("guests");
    }
    /* Prices — only set them when they actually narrow the catalog range.
     * If the input equals the catalog bound we don't want the URL to carry
     * "minPrice=350&maxPrice=900" since that's equivalent to "no filter". */
    const minN = Number(minPrice);
    const maxN = Number(maxPrice);
    if (Number.isFinite(minN) && minN > priceMinTnd) {
      params.set("minPrice", String(minN));
    } else {
      params.delete("minPrice");
    }
    if (Number.isFinite(maxN) && maxN < priceMaxTnd) {
      params.set("maxPrice", String(maxN));
    } else {
      params.delete("maxPrice");
    }
    // Amenities
    if (activeAmenities.length > 0) {
      params.set("amenities", activeAmenities.join(","));
    } else {
      params.delete("amenities");
    }

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `?${qs}` : "?", { scroll: false });
    });
  }

  function reset() {
    setPool(false);
    setSeaView(false);
    setBeachfrontAmenity(false);
    setPosition("");
    setCapacityBuckets([]);
    setMinPrice(String(priceMinTnd));
    setMaxPrice(String(priceMaxTnd));
    setActiveAmenities([]);
    startTransition(() => router.push("?", { scroll: false }));
  }

  function toggleAmenity(slug: string) {
    setActiveAmenities((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function toggleCapacity(value: string) {
    setCapacityBuckets((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  useEffect(() => {
    apply();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [pool, seaView, position, activeAmenities, capacityBuckets]);

  return (
    <aside className="sticky top-24 hidden h-fit max-h-[calc(100vh-7rem)] overflow-y-auto lg:block">
      <FilterSection title="Équipements" isFirst>
        <CheckOption
          label="Piscine privée"
          count={filterableAmenities.length > 0 ? undefined : undefined}
          checked={pool}
          onChange={setPool}
        />
        <CheckOption label="Vue mer" checked={seaView} onChange={setSeaView} />
        <CheckOption
          label="Pieds dans l'eau"
          checked={beachfrontAmenity}
          onChange={(v) => {
            setBeachfrontAmenity(v);
            setPosition(v ? "beachfront" : "");
          }}
        />
        {filterableAmenities.map((a) => (
          <CheckOption
            key={a.slug}
            label={a.labelFr}
            checked={activeAmenities.includes(a.slug)}
            onChange={() => toggleAmenity(a.slug)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Position">
        <RadioOption
          name="position"
          label="Tous"
          checked={position === ""}
          onChange={() => setPosition("")}
        />
        <RadioOption
          name="position"
          label="Front de mer"
          checked={position === "beachfront"}
          onChange={() => setPosition("beachfront")}
        />
        <RadioOption
          name="position"
          label="Deuxième ligne"
          checked={position === "second-line"}
          onChange={() => setPosition("second-line")}
        />
      </FilterSection>

      <FilterSection title="Capacité">
        {CAPACITY_BUCKETS.map((b) => (
          <CheckOption
            key={b.value}
            label={b.label}
            checked={capacityBuckets.includes(b.value)}
            onChange={() => toggleCapacity(b.value)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Prix par nuit">
        <PriceRangeSlider
          min={priceMinTnd}
          max={priceMaxTnd}
          minValue={minPrice}
          maxValue={maxPrice}
          onMinChange={setMinPrice}
          onMaxChange={setMaxPrice}
          onCommit={apply}
        />
      </FilterSection>

      <div className="pt-5">
        <button
          type="button"
          onClick={reset}
          className="inline-flex w-full items-center justify-center rounded-full bg-transparent px-6 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-sand"
        >
          Réinitialiser les filtres
        </button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {pending
            ? "Mise à jour…"
            : `${resultCount} résultat${resultCount === 1 ? "" : "s"}`}
        </p>
      </div>
    </aside>
  );
}

function setOrDelete(
  params: URLSearchParams,
  key: string,
  value: string | null,
) {
  if (value === null || value === "") params.delete(key);
  else params.set(key, value);
}

function FilterSection({
  title,
  isFirst,
  children,
}: {
  title: string;
  isFirst?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("border-b border-line-soft py-5", isFirst && "pt-0")}>
      <h4 className="mb-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-charcoal">
        {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function CheckOption({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5">
      <span className="relative inline-flex size-[18px] shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 appearance-none rounded-[4px] border-[1.5px] border-line bg-card transition-colors checked:border-primary checked:bg-primary"
        />
        {checked && (
          <svg
            className="pointer-events-none relative z-10"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className="text-[0.9rem] text-charcoal">{label}</span>
      {typeof count === "number" && (
        <span className="ml-auto text-[0.8rem] text-muted-foreground">
          {count}
        </span>
      )}
    </label>
  );
}

/**
 * Dual-thumb price range slider. The numeric inputs commit on blur (no
 * router thrash while typing); the visual track + thumbs stay reactive
 * by reading the current min/max values directly. Inputs are clamped to
 * the catalog bounds on blur so a user can't ask for less than the
 * cheapest or more than the most expensive nightly rate.
 */
function PriceRangeSlider({
  min,
  max,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  onCommit,
}: {
  min: number;
  max: number;
  minValue: string;
  maxValue: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  onCommit: () => void;
}) {
  const span = Math.max(1, max - min);
  const minNum = Number(minValue);
  const maxNum = Number(maxValue);
  const minSafe = Number.isFinite(minNum) ? minNum : min;
  const maxSafe = Number.isFinite(maxNum) ? maxNum : max;
  const minPct = Math.max(0, Math.min(100, ((minSafe - min) / span) * 100));
  const maxPct = Math.max(0, Math.min(100, ((maxSafe - min) / span) * 100));

  function commitMin() {
    const n = Number(minValue);
    if (!Number.isFinite(n) || n < min) onMinChange(String(min));
    else if (n > maxSafe) onMinChange(String(maxSafe));
    else onMinChange(String(Math.round(n)));
    onCommit();
  }

  function commitMax() {
    const n = Number(maxValue);
    if (!Number.isFinite(n) || n > max) onMaxChange(String(max));
    else if (n < minSafe) onMaxChange(String(minSafe));
    else onMaxChange(String(Math.round(n)));
    onCommit();
  }

  return (
    <div>
      {/* Interactive dual-range slider. Two native range inputs stacked on
       *  top of the same track, only the thumb of each is interactive
       *  (the rest is hidden via .pointer-events-none). The visual track
       *  + tinted range underneath are CSS-only, driven by the same min
       *  /max state. Padding-x keeps thumbs visually inside the track. */}
      <div className="relative h-[34px] px-3">
        <div className="absolute inset-x-3 top-[15px] h-[5px] rounded-full bg-line-soft" />
        <div
          className="absolute top-[15px] h-[5px] rounded-full bg-primary"
          style={{
            left: `calc(${minPct}% * (100% - 24px) / 100% + 12px)`,
            right: `calc(${100 - maxPct}% * (100% - 24px) / 100% + 12px)`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={10}
          value={minSafe}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), maxSafe);
            onMinChange(String(v));
          }}
          onMouseUp={onCommit}
          onTouchEnd={onCommit}
          onKeyUp={onCommit}
          aria-label="Prix minimum"
          className="price-range-thumb pointer-events-none absolute inset-x-3 top-0 h-[34px] w-[calc(100%-24px)] appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={10}
          value={maxSafe}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), minSafe);
            onMaxChange(String(v));
          }}
          onMouseUp={onCommit}
          onTouchEnd={onCommit}
          onKeyUp={onCommit}
          aria-label="Prix maximum"
          className="price-range-thumb pointer-events-none absolute inset-x-3 top-0 h-[34px] w-[calc(100%-24px)] appearance-none bg-transparent"
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <input
          type="number"
          min={min}
          max={max}
          step={10}
          value={minValue}
          onChange={(e) => onMinChange(e.target.value)}
          onBlur={commitMin}
          aria-label="Prix minimum par nuit (TND)"
          className="flex-1 rounded-md border border-line bg-card px-3 py-2.5 text-[0.85rem] outline-none transition-colors focus:border-primary"
        />
        <span className="text-muted-foreground">—</span>
        <input
          type="number"
          min={min}
          max={max}
          step={10}
          value={maxValue}
          onChange={(e) => onMaxChange(e.target.value)}
          onBlur={commitMax}
          aria-label="Prix maximum par nuit (TND)"
          className="flex-1 rounded-md border border-line bg-card px-3 py-2.5 text-[0.85rem] outline-none transition-colors focus:border-primary"
        />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Entre {min} TND et {max} TND / nuit.
      </p>
    </div>
  );
}

function RadioOption({
  name,
  label,
  count,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5">
      <span className="relative inline-flex size-[18px] shrink-0 items-center justify-center">
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer absolute inset-0 appearance-none rounded-full border-[1.5px] border-line bg-card transition-colors checked:border-primary checked:bg-primary"
        />
        {checked && (
          <span className="pointer-events-none relative z-10 size-2 rounded-full bg-white" />
        )}
      </span>
      <span className="text-[0.9rem] text-charcoal">{label}</span>
      {typeof count === "number" && (
        <span className="ml-auto text-[0.8rem] text-muted-foreground">
          {count}
        </span>
      )}
    </label>
  );
}
