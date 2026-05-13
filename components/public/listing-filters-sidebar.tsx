"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as LucideIcons from "lucide-react";
import {
  Check,
  Eye,
  Minus,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Users,
  Waves,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterableAmenity } from "@/lib/queries";
import { DateRangePicker } from "./date-range-picker";

interface ListingFiltersSidebarProps {
  resultCount: number;
  filterableAmenities: FilterableAmenity[];
}

/**
 * Vertical filter panel for the listing pages.
 *
 * Desktop: sticky in a 280-px sidebar.
 * Mobile: hidden until the floating "Filtres" button opens a bottom drawer.
 *
 * Visual goals: looks like a section of the page, not a busy form. Each
 * filter row uses a single visual rhythm (line under each block) instead
 * of multiple stacked cards.
 */
export function ListingFiltersSidebar({
  resultCount,
  filterableAmenities,
}: ListingFiltersSidebarProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [checkIn, setCheckIn] = useState(sp?.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(sp?.get("checkOut") ?? "");
  const [guests, setGuests] = useState(Number(sp?.get("guests") ?? "2"));
  const [pool, setPool] = useState(sp?.get("pool") === "1");
  const [seaView, setSeaView] = useState(sp?.get("seaView") === "1");
  const [beachfront, setBeachfront] = useState(sp?.get("beachfront") === "1");
  const [minPrice, setMinPrice] = useState(sp?.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(sp?.get("maxPrice") ?? "");
  const initialAmenities = (sp?.get("amenities") ?? "")
    .split(",")
    .filter(Boolean);
  const [activeAmenities, setActiveAmenities] =
    useState<string[]>(initialAmenities);

  function apply() {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests > 1) params.set("guests", String(guests));
    if (pool) params.set("pool", "1");
    if (seaView) params.set("seaView", "1");
    if (beachfront) params.set("beachfront", "1");
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (activeAmenities.length > 0)
      params.set("amenities", activeAmenities.join(","));
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `?${qs}` : "?", { scroll: false });
    });
  }

  function reset() {
    setCheckIn("");
    setCheckOut("");
    setGuests(2);
    setPool(false);
    setSeaView(false);
    setBeachfront(false);
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

  useEffect(() => {
    apply();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [pool, seaView, beachfront, guests, checkIn, checkOut, activeAmenities]);

  const activeCount =
    (pool ? 1 : 0) +
    (seaView ? 1 : 0) +
    (beachfront ? 1 : 0) +
    (guests > 2 ? 1 : 0) +
    (checkIn ? 1 : 0) +
    (checkOut ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    activeAmenities.length;

  const Body = (
    <div className="divide-y divide-border">
      <Row label="Dates">
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={(r) => {
            setCheckIn(r.checkIn);
            setCheckOut(r.checkOut);
          }}
        />
      </Row>

      <Row label="Voyageurs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 text-sm text-foreground">
            <Users className="size-4 text-muted-foreground" />
            <span>
              {guests} voyageur{guests > 1 ? "s" : ""}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <Counter
              dir="dec"
              disabled={guests <= 1}
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
            />
            <Counter
              dir="inc"
              disabled={guests >= 20}
              onClick={() => setGuests((g) => Math.min(20, g + 1))}
            />
          </div>
        </div>
      </Row>

      <Row label="Caractéristiques">
        <div className="space-y-2">
          <Amenity
            active={beachfront}
            onClick={() => setBeachfront((v) => !v)}
            icon={<Waves className="size-4" />}
            label="Pieds dans l'eau"
          />
          <Amenity
            active={pool}
            onClick={() => setPool((v) => !v)}
            icon={<Waves className="size-4" />}
            label="Piscine privée"
          />
          <Amenity
            active={seaView}
            onClick={() => setSeaView((v) => !v)}
            icon={<Eye className="size-4" />}
            label="Vue mer"
          />
        </div>
      </Row>

      {filterableAmenities.length > 0 && (
        <Row label="Équipements">
          <div className="space-y-2">
            {filterableAmenities.map((a) => (
              <Amenity
                key={a.slug}
                active={activeAmenities.includes(a.slug)}
                onClick={() => toggleAmenity(a.slug)}
                icon={<AmenityIcon name={a.icon} />}
                label={a.labelFr}
              />
            ))}
          </div>
        </Row>
      )}

      <Row label="Prix par nuit">
        <div className="grid grid-cols-2 gap-2">
          <PriceInput
            placeholder="Min"
            value={minPrice}
            onChange={setMinPrice}
            onBlur={apply}
          />
          <PriceInput
            placeholder="Max"
            value={maxPrice}
            onChange={setMaxPrice}
            onBlur={apply}
          />
        </div>
      </Row>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="sticky top-20 z-30 mb-4 inline-flex items-center gap-2 self-start rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-md lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filtres
        {activeCount > 0 && (
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {/* Desktop */}
      <aside className="sticky top-24 hidden h-fit max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-card lg:block">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-lg text-foreground">Filtres</h2>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                Effacer ({activeCount})
              </button>
            )}
          </div>
        </div>
        <div className="px-6">{Body}</div>
        <div className="border-t border-border px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {pending
              ? "Mise à jour…"
              : `${resultCount} résultat${resultCount === 1 ? "" : "s"}`}
          </p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-heading text-xl text-foreground">Filtres</h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-bone hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="px-6 pb-6">{Body}</div>
            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-card px-6 py-4">
              <button
                type="button"
                onClick={reset}
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Tout effacer
              </button>
              <Button
                shape="pill"
                onClick={() => setMobileOpen(false)}
                className="px-6"
              >
                Voir {resultCount} résultat{resultCount === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-5">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </h3>
      {children}
    </div>
  );
}

function Counter({
  dir,
  disabled,
  onClick,
}: {
  dir: "inc" | "dec";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-foreground hover:bg-bone disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-card"
      aria-label={dir === "inc" ? "Plus" : "Moins"}
    >
      {dir === "inc" ? (
        <Plus className="size-3.5" />
      ) : (
        <Minus className="size-3.5" />
      )}
    </button>
  );
}

function Amenity({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground/85 hover:border-foreground/30 hover:bg-bone/50",
      )}
    >
      <span
        className={cn(
          "transition-colors",
          active ? "text-primary-foreground" : "text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function AmenityIcon({ name }: { name: string | null }) {
  if (!name) return <Check className="size-4" />;
  const Icon =
    name in LucideIcons
      ? (
          LucideIcons as unknown as Record<
            string,
            React.ComponentType<{ className?: string }>
          >
        )[name]
      : null;
  return Icon ? <Icon className="size-4" /> : <Check className="size-4" />;
}

function PriceInput({
  placeholder,
  value,
  onChange,
  onBlur,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <label className="block rounded-xl border border-border bg-card px-3 py-2 text-xs transition-colors focus-within:border-primary">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {placeholder} · TND
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="0"
        className="mt-0.5 w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/40"
      />
    </label>
  );
}
