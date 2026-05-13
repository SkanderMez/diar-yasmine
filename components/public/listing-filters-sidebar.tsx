"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  RotateCcw,
  SlidersHorizontal,
  Users,
  Waves,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "./date-range-picker";

/**
 * Vertical left-sidebar filter panel for the listing pages. On desktop it
 * sticks below the hero; on mobile it lives inside a drawer toggled by a
 * floating button.
 */
export function ListingFiltersSidebar({
  resultCount,
}: {
  resultCount: number;
}) {
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
    startTransition(() => router.push("?", { scroll: false }));
  }

  /* Re-apply when toggles, dates, or guests change. Numeric inputs apply on
   * blur to avoid spamming the router on every keystroke. */
  useEffect(() => {
    apply();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [pool, seaView, beachfront, guests, checkIn, checkOut]);

  const activeCount =
    (pool ? 1 : 0) +
    (seaView ? 1 : 0) +
    (beachfront ? 1 : 0) +
    (guests > 2 ? 1 : 0) +
    (checkIn ? 1 : 0) +
    (checkOut ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const Body = (
    <div className="space-y-7">
      <Section title="Dates">
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={(r) => {
            setCheckIn(r.checkIn);
            setCheckOut(r.checkOut);
          }}
          labels={{
            checkIn: "Arrivée",
            checkOut: "Départ",
            pickDates: "Choisir les dates",
            clear: "Effacer",
            nights: (n) => `${n} nuit${n > 1 ? "s" : ""}`,
          }}
        />
      </Section>

      <Section title="Voyageurs">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Users className="size-4 text-muted-foreground" />
            <span>
              {guests} voyageur{guests > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              className="inline-flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-bone disabled:opacity-30"
              disabled={guests <= 1}
              aria-label="Moins"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(20, g + 1))}
              className="inline-flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-bone disabled:opacity-30"
              disabled={guests >= 20}
              aria-label="Plus"
            >
              +
            </button>
          </div>
        </div>
      </Section>

      <Section title="Caractéristiques">
        <div className="grid gap-2">
          <Toggle
            active={beachfront}
            onClick={() => setBeachfront((v) => !v)}
            icon={<Waves className="size-4" />}
            label="Pieds dans l'eau"
          />
          <Toggle
            active={pool}
            onClick={() => setPool((v) => !v)}
            icon={<Waves className="size-4" />}
            label="Piscine privée"
          />
          <Toggle
            active={seaView}
            onClick={() => setSeaView((v) => !v)}
            icon={<Eye className="size-4" />}
            label="Vue mer"
          />
        </div>
      </Section>

      <Section title="Prix par nuit">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={apply}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={apply}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <span className="text-xs text-muted-foreground">TND</span>
        </div>
      </Section>

      <div className="flex items-center justify-between border-t border-border pt-5">
        <p className="text-xs text-muted-foreground">
          {pending
            ? "Mise à jour…"
            : `${resultCount} résultat${resultCount === 1 ? "" : "s"}`}
        </p>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            shape="pill"
            size="sm"
            onClick={reset}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="size-3" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger — floating button just below the hero */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="sticky top-20 z-30 mx-4 -mb-4 inline-flex items-center gap-2 self-start rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-md lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filtres
        {activeCount > 0 && (
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {/* Desktop sidebar */}
      <aside className="sticky top-24 hidden h-fit max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-sm lg:block">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-xl text-foreground">Filtres</h2>
          {activeCount > 0 && (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </div>
        {Body}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
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
            {Body}
            <div className="mt-6">
              <Button
                shape="pill"
                size="lg"
                className="w-full"
                onClick={() => setMobileOpen(false)}
              >
                Voir les {resultCount} résultat{resultCount === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Toggle({
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
        "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-all",
        active
          ? "border-primary bg-primary/5 text-foreground"
          : "border-border bg-card text-foreground/80 hover:border-foreground/30",
      )}
    >
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            "transition-colors",
            active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {icon}
        </span>
        {label}
      </span>
      <span
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-full border transition-all",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card",
        )}
      >
        {active && (
          <svg
            viewBox="0 0 12 12"
            className="size-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
