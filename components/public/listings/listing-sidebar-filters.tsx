"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FilterableAmenity } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface ListingSidebarFiltersProps {
  resultCount: number;
  filterableAmenities: FilterableAmenity[];
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
  const [minPrice, setMinPrice] = useState(sp?.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(sp?.get("maxPrice") ?? "");
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
    // Prices
    setOrDelete(params, "minPrice", minPrice || null);
    setOrDelete(params, "maxPrice", maxPrice || null);
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
    setMinPrice("");
    setMaxPrice("");
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
        <div className="relative h-[30px]">
          <div className="absolute left-0 right-0 top-[13px] h-1 rounded-full bg-line-soft" />
          <div className="absolute left-[20%] right-[5%] top-[13px] h-1 rounded-full bg-primary" />
          <div className="absolute left-[20%] top-[8px] size-3.5 -translate-x-1/2 rounded-full border-2 border-primary bg-card" />
          <div className="absolute left-[95%] top-[8px] size-3.5 -translate-x-1/2 rounded-full border-2 border-primary bg-card" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={apply}
            className="flex-1 rounded-md border border-line bg-card px-3 py-2.5 text-[0.85rem] outline-none transition-colors focus:border-primary"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={apply}
            className="flex-1 rounded-md border border-line bg-card px-3 py-2.5 text-[0.85rem] outline-none transition-colors focus:border-primary"
          />
        </div>
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
