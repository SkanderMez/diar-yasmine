"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, Search, Users } from "lucide-react";
import { DateRangePicker } from "./date-range-picker";

/**
 * Hero booking widget — pixel match of the maquette `.booking-widget`.
 *
 * Layout: white pill, 4 segments separated by vertical dividers, primary
 * search CTA on the right. The date range picker opens a custom popover.
 * Guests popover holds an adults + children counter pair.
 */
export function BookingSearch() {
  const router = useRouter();
  const [type, setType] = useState<"all" | "chalets" | "bungalows">("all");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [guestsOpen, setGuestsOpen] = useState(false);

  function submit() {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    const total = adults + children;
    if (total > 1) params.set("guests", String(total));
    const qs = params.toString();
    // "all" routes to the unified search page; the per-type routes
    // (chalets/bungalows) keep the same sidebar layout.
    const destination = type === "all" ? "/search" : `/${type}`;
    router.push(`${destination}${qs ? `?${qs}` : ""}`);
  }

  const guestsLabel =
    children > 0
      ? `${adults} adulte${adults > 1 ? "s" : ""}, ${children} enfant${children > 1 ? "s" : ""}`
      : `${adults} adulte${adults > 1 ? "s" : ""}`;

  return (
    <div className="rounded-2xl bg-white p-1.5 shadow-2xl">
      <div className="grid grid-cols-1 items-stretch gap-0.5 sm:grid-cols-[1.4fr_minmax(0,2fr)_1fr_auto]">
        {/* Hébergement */}
        <Field label="Hébergement">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full appearance-none bg-transparent text-[15px] font-medium text-charcoal outline-none"
          >
            <option value="all">Tous les hébergements</option>
            <option value="chalets">Les Chalets</option>
            <option value="bungalows">Les Bungalows</option>
          </select>
        </Field>

        {/* Dates */}
        <div className="px-1">
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(r) => {
              setCheckIn(r.checkIn);
              setCheckOut(r.checkOut);
            }}
          />
        </div>

        {/* Voyageurs */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setGuestsOpen((v) => !v)}
            className="block w-full rounded-xl px-4 py-3 text-left transition-colors hover:bg-sand"
          >
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Users className="mr-1 inline size-3" /> Voyageurs
            </span>
            <span className="mt-0.5 block text-[15px] font-medium text-charcoal">
              {guestsLabel}
            </span>
          </button>
          {guestsOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-72 space-y-3 rounded-2xl border border-line-soft bg-white p-5 shadow-xl">
              <Counter
                label="Adultes"
                hint="13 ans et +"
                value={adults}
                min={1}
                max={20}
                onChange={setAdults}
              />
              <Counter
                label="Enfants"
                hint="2 à 12 ans"
                value={children}
                min={0}
                max={10}
                onChange={setChildren}
              />
              <button
                type="button"
                onClick={() => setGuestsOpen(false)}
                className="ml-auto block text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Fermer
              </button>
            </div>
          )}
        </div>

        {/* Search CTA */}
        <button
          type="button"
          onClick={submit}
          className="my-1 mx-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-medium text-ivory shadow-sm transition-all hover:-translate-y-px hover:bg-bougainvillier hover:shadow-md sm:my-0"
        >
          <Search className="size-4" />
          <span>Rechercher</span>
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block cursor-pointer rounded-xl px-4 py-3 transition-colors hover:bg-sand">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-charcoal">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Moins"
          className="inline-flex size-8 items-center justify-center rounded-full border border-line text-charcoal transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-5 text-center text-sm font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Plus"
          className="inline-flex size-8 items-center justify-center rounded-full border border-line text-charcoal transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
