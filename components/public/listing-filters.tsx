"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Eye, RotateCcw, Users, Waves } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

/**
 * Listing filter bar — sticky just under the hero. Updates URL search
 * params and lets the Server Component re-fetch with the new filters.
 *
 * Filters supported in Phase 6 design pass:
 *   - check-in / check-out (UI-only for now, availability query Phase 2.5)
 *   - guests count → minCapacity
 *   - hasPrivatePool / seaView / beachfront toggles
 *   - price range (minPrice / maxPrice in TND/night)
 */
export function ListingFilters({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");

  const [checkIn, setCheckIn] = useState(sp?.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(sp?.get("checkOut") ?? "");
  const [guests, setGuests] = useState(Number(sp?.get("guests") ?? "2"));
  const [pool, setPool] = useState(sp?.get("pool") === "1");
  const [seaView, setSeaView] = useState(sp?.get("seaView") === "1");
  const [beachfront, setBeachfront] = useState(sp?.get("beachfront") === "1");
  const [minPrice, setMinPrice] = useState(sp?.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(sp?.get("maxPrice") ?? "");

  // Push params on debounce — but for MVP, only on explicit submit.
  function applyFilters() {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests > 1) params.set("guests", String(guests));
    if (pool) params.set("pool", "1");
    if (seaView) params.set("seaView", "1");
    if (beachfront) params.set("beachfront", "1");
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `?${qs}` : "?");
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
    startTransition(() => router.push("?"));
  }

  // Re-apply on any toggle change for instant feedback.
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, seaView, beachfront]);

  return (
    <div className="sticky top-20 z-30 border-b border-border bg-ivory/90 backdrop-blur-md">
      <div className="container-x py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date + Guests pill */}
          <div className="flex items-center divide-x divide-border overflow-hidden rounded-full border border-border bg-card shadow-sm">
            <FilterPill
              label="Arrivée"
              icon={<Calendar className="size-3.5" />}
            >
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                onBlur={applyFilters}
                className="w-32 bg-transparent text-sm font-medium outline-none [color-scheme:light]"
              />
            </FilterPill>
            <FilterPill label="Départ" icon={<Calendar className="size-3.5" />}>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                onBlur={applyFilters}
                className="w-32 bg-transparent text-sm font-medium outline-none [color-scheme:light]"
              />
            </FilterPill>
            <FilterPill label="Voyageurs" icon={<Users className="size-3.5" />}>
              <input
                type="number"
                min={1}
                max={20}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                onBlur={applyFilters}
                className="w-12 bg-transparent text-sm font-medium outline-none"
              />
            </FilterPill>
          </div>

          {/* Quick toggles */}
          <Toggle
            active={beachfront}
            onClick={() => setBeachfront((v) => !v)}
            icon={<Waves className="size-3.5" />}
          >
            Pieds dans l&apos;eau
          </Toggle>
          <Toggle
            active={pool}
            onClick={() => setPool((v) => !v)}
            icon={<Waves className="size-3.5" />}
          >
            Piscine privée
          </Toggle>
          <Toggle
            active={seaView}
            onClick={() => setSeaView((v) => !v)}
            icon={<Eye className="size-3.5" />}
          >
            Vue mer
          </Toggle>

          {/* Price */}
          <div className="hidden items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 lg:flex">
            <span className="text-muted-foreground">TND</span>
            <input
              type="number"
              min={0}
              placeholder="min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={applyFilters}
              className="w-16 bg-transparent outline-none"
            />
            <span>—</span>
            <input
              type="number"
              min={0}
              placeholder="max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={applyFilters}
              className="w-16 bg-transparent outline-none"
            />
          </div>

          <Button
            variant="ghost"
            shape="pill"
            size="sm"
            onClick={reset}
            className="ml-auto gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="size-3" /> Réinitialiser
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {pending
            ? "Mise à jour…"
            : `${resultCount} résultat${resultCount === 1 ? "" : "s"}`}
          {checkIn && checkOut
            ? ` · ${checkIn} → ${checkOut}`
            : " · choisissez vos dates pour vérifier la disponibilité"}
        </p>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="cursor-pointer px-4 py-2.5 transition-colors hover:bg-bone">
      <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

function Toggle({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
        active
          ? "border-foreground bg-foreground text-ivory"
          : "border-border bg-card text-foreground/80 hover:border-foreground/30"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
