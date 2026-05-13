"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { AlertCircle, Minus, Plus, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTND } from "@/lib/money";
import { DateRangePicker } from "./date-range-picker";

interface BookingWidgetProps {
  propertyId: string;
  propertySlug: string;
  basePrice: number;
  cleaningFee: number;
  capacity: number;
  taxRate: number;
}

/**
 * Sticky booking widget on the property detail page. Airbnb-style:
 * compact pricing header, custom date range picker, guests popover,
 * itemised price breakdown, single primary CTA.
 *
 * Tax + cleaning fee shown here are an *estimate* — the real total is
 * computed at the funnel step (seasonal multipliers, promo codes).
 */
export function BookingWidget({
  propertyId,
  propertySlug,
  basePrice,
  cleaningFee,
  capacity,
  taxRate,
}: BookingWidgetProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [fetchedAvailability, setFetchedAvailability] = useState<
    "checking" | "available" | "unavailable" | "error"
  >("checking");

  /** Hit the public availability endpoint whenever both dates are set so
   *  the UI tells the user before they jump into the funnel. The
   *  "checking" reset on each date change is intentional state init,
   *  not a derived render — keep it. */
  useEffect(() => {
    if (!checkIn || !checkOut) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetchedAvailability("checking");
    fetch(
      `/api/properties/${propertyId}/availability?checkIn=${checkIn}&checkOut=${checkOut}`,
      { signal: controller.signal },
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: { available: boolean }) =>
        setFetchedAvailability(data.available ? "available" : "unavailable"),
      )
      .catch((e) => {
        if (e?.name !== "AbortError") setFetchedAvailability("error");
      });
    return () => controller.abort();
  }, [checkIn, checkOut, propertyId]);

  /** Derived: when no dates are picked, availability is "unknown" — we
   *  never run the fetch, so the persisted internal state is irrelevant. */
  const availability: "unknown" | "checking" | "available" | "unavailable" =
    !checkIn || !checkOut
      ? "unknown"
      : fetchedAvailability === "error"
        ? "unknown"
        : fetchedAvailability;

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    const n = differenceInCalendarDays(
      new Date(`${checkOut}T00:00:00`),
      new Date(`${checkIn}T00:00:00`),
    );
    return n > 0 ? n : null;
  }, [checkIn, checkOut]);

  const totals = useMemo(() => {
    if (!nights) return null;
    const stay = basePrice * nights;
    const subtotal = stay + cleaningFee;
    const tax = Math.round(subtotal * taxRate);
    return { stay, subtotal, tax, total: subtotal + tax };
  }, [nights, basePrice, cleaningFee, taxRate]);

  const guestsTotal = adults + children;
  const tooMany = guestsTotal > capacity;

  /** Cards-style TND display (no millimes decimals if integer). */
  const tnd = basePrice / 1000;
  const priceLabel = Number.isInteger(tnd)
    ? tnd.toLocaleString("fr-FR")
    : tnd.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

  function submit() {
    if (!checkIn || !checkOut || !nights || tooMany) return;
    if (availability === "unavailable") return;
    const params = new URLSearchParams({
      propertyId,
      propertySlug,
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
    });
    router.push(`/book?${params.toString()}`);
  }

  return (
    <aside className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-xl">
      <div className="mb-5 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-2xl text-foreground">
            {priceLabel} TND
          </span>
          <span className="text-sm text-muted-foreground">/ nuit</span>
        </div>
      </div>

      {/* Date + guests stacked inside a single bordered group, Airbnb style */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="border-b border-border">
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(r) => {
              setCheckIn(r.checkIn);
              setCheckOut(r.checkOut);
            }}
          />
        </div>

        {/* Guests trigger */}
        <button
          type="button"
          onClick={() => setGuestsOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left transition-colors hover:bg-bone"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Users className="mr-1 inline size-3" /> Voyageurs
            </span>
            <span className="text-sm font-medium text-foreground">
              {adults + children} voyageur{adults + children > 1 ? "s" : ""}
              {children > 0 &&
                `, dont ${children} enfant${children > 1 ? "s" : ""}`}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {guestsOpen ? "Fermer" : "Modifier"}
          </span>
        </button>
        {guestsOpen && (
          <div className="space-y-3 border-t border-border bg-bone/30 px-5 py-4">
            <CounterRow
              label="Adultes"
              hint="13 ans et plus"
              value={adults}
              min={1}
              onChange={setAdults}
              max={capacity}
            />
            <CounterRow
              label="Enfants"
              hint="2 à 12 ans"
              value={children}
              min={0}
              onChange={setChildren}
              max={capacity}
            />
          </div>
        )}
      </div>

      {tooMany && (
        <p className="mt-3 text-xs text-destructive">
          Capacité maximum : {capacity} personnes.
        </p>
      )}

      {availability === "unavailable" && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            Ces dates ne sont plus disponibles pour cet hébergement. Essayez
            d&apos;autres dates ou consultez les autres logements.
          </span>
        </div>
      )}

      <Button
        type="button"
        size="lg"
        shape="pill"
        className="mt-4 w-full bg-primary text-primary-foreground hover:bg-deep"
        onClick={submit}
        disabled={
          !nights ||
          tooMany ||
          availability === "checking" ||
          availability === "unavailable"
        }
      >
        {!nights
          ? "Choisir des dates"
          : availability === "checking"
            ? "Vérification…"
            : availability === "unavailable"
              ? "Indisponible"
              : "Réserver"}
      </Button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Vous ne serez pas débité maintenant
      </p>

      {totals && (
        <dl className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
          <Row
            label={`${priceLabel} TND × ${nights} nuit${nights! > 1 ? "s" : ""}`}
            value={formatTND(totals.stay)}
          />
          {cleaningFee > 0 && (
            <Row label="Frais de ménage" value={formatTND(cleaningFee)} />
          )}
          <Row
            label={`Taxes (${Math.round(taxRate * 100)}%)`}
            value={formatTND(totals.tax)}
            muted
          />
          <div className="flex items-baseline justify-between border-t border-border pt-3 font-medium">
            <dt>Total estimé</dt>
            <dd className="font-heading text-lg text-foreground">
              {formatTND(totals.total)}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-bone/60 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          Réservation directe — pas d&apos;intermédiaire ni de commission
          cachée. Annulation gratuite jusqu&apos;à 14 jours avant
          l&apos;arrivée.
        </span>
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between ${muted ? "text-muted-foreground" : "text-foreground"}`}
    >
      <dt className="underline-offset-4 decoration-dotted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function CounterRow({
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
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Moins"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-5 text-center text-sm font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Plus"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
