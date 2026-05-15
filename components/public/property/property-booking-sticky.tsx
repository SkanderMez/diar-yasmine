"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import {
  AlertCircle,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTND } from "@/lib/money";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "../date-range-picker";

interface PropertyBookingStickyProps {
  propertyId: string;
  propertySlug: string;
  /** Nightly rate in millimes. */
  basePrice: number;
  /** Cleaning fee in millimes (added once to the total). */
  cleaningFee: number;
  /** Maximum capacity (adults + children) for this property. */
  capacity: number;
  /** Tax rate as a 0-1 decimal (e.g. 0.19). */
  taxRate: number;
  /** Published-review aggregate shown beside the price. Null until the
   *  property has at least one moderated review. */
  rating?: { score: number; count: number } | null;
  /** Booked half-open windows fetched server-side. The DateRangePicker
   *  strikes these through and blocks selection across them. */
  unavailableRanges?: { checkIn: string; checkOut: string }[];
}

/**
 * Maquette `.booking-sticky` — sticky widget on the right column of the
 * property detail page. Date range + guests popover + promo code + a
 * client-side price breakdown, then a primary CTA that pushes to /book.
 *
 * The breakdown is an *estimate* — server pricing (seasons, promos) is
 * applied during the funnel step.
 */
export function PropertyBookingSticky({
  propertyId,
  propertySlug,
  basePrice,
  cleaningFee,
  capacity,
  taxRate,
  rating,
  unavailableRanges,
}: PropertyBookingStickyProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [promo, setPromo] = useState("");
  const [fetchedAvailability, setFetchedAvailability] = useState<
    "checking" | "available" | "unavailable" | "error"
  >("checking");

  /* Re-check availability whenever the date range changes. */
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
        if ((e as { name?: string })?.name !== "AbortError")
          setFetchedAvailability("error");
      });
    return () => controller.abort();
  }, [checkIn, checkOut, propertyId]);

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

  /* Long-stay discount = 10 % for stays of 5 nights or more (matches the
   * maquette callout). */
  const totals = useMemo(() => {
    if (!nights) return null;
    const stay = basePrice * nights;
    const longStayDiscount = nights >= 5 ? Math.round(stay * 0.1) : 0;
    const stayNet = stay - longStayDiscount;
    const subtotal = stayNet + cleaningFee;
    const tax = Math.round(subtotal * taxRate);
    return {
      stay,
      longStayDiscount,
      tax,
      total: subtotal + tax,
    };
  }, [nights, basePrice, cleaningFee, taxRate]);

  const guestsTotal = adults + children;
  const tooMany = guestsTotal > capacity;

  /* TND label without trailing decimals when the price is a round TND. */
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
    if (promo.trim()) params.set("promo", promo.trim());
    router.push(`/book?${params.toString()}`);
  }

  return (
    <aside className="sticky top-24 rounded-2xl border border-line-soft bg-white p-6 shadow-xl">
      {/* Header — price + rating */}
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-muted-foreground">à partir de</span>
          <span className="font-heading text-[2rem] leading-none text-primary">
            {priceLabel}
          </span>
          <span className="text-sm font-medium text-charcoal">TND</span>
          <span className="text-sm text-muted-foreground">/ nuit</span>
        </div>
        {rating && (
          <span className="flex items-center gap-1 text-sm">
            <Star
              className="size-3.5 text-gold"
              fill="currentColor"
              strokeWidth={0}
            />
            <strong className="font-semibold text-charcoal">
              {rating.score.toFixed(2)}
            </strong>
            <span className="text-muted-foreground">· {rating.count}</span>
          </span>
        )}
      </div>

      {/* Dates + guests group */}
      <div className="overflow-hidden rounded-md border border-line">
        <div className="border-b border-line">
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            unavailableRanges={unavailableRanges}
            onChange={(r) => {
              setCheckIn(r.checkIn);
              setCheckOut(r.checkOut);
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setGuestsOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left transition-colors hover:bg-sand"
        >
          <div className="flex flex-col">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Users className="mr-1 inline size-3" />
              Voyageurs
            </span>
            <span className="text-sm font-medium text-charcoal">
              {guestsTotal} voyageur{guestsTotal > 1 ? "s" : ""}
              {children > 0 &&
                `, dont ${children} enfant${children > 1 ? "s" : ""}`}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {guestsOpen ? "Fermer" : "Modifier"}
          </span>
        </button>
        {guestsOpen && (
          <div className="space-y-3 border-t border-line bg-sand/30 px-5 py-4">
            <CounterRow
              label="Adultes"
              hint="13 ans et plus"
              value={adults}
              min={1}
              max={capacity}
              onChange={setAdults}
            />
            <CounterRow
              label="Enfants"
              hint="2 à 12 ans"
              value={children}
              min={0}
              max={capacity}
              onChange={setChildren}
            />
          </div>
        )}
      </div>

      {/* Promo code row */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          placeholder="Code promo"
          className="flex-1 rounded-full border border-line bg-white px-4 py-2 text-sm text-charcoal placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          className="rounded-full px-3 text-xs font-medium text-primary transition-colors hover:bg-sand disabled:opacity-40"
          disabled={!promo.trim()}
        >
          Appliquer
        </button>
      </div>

      {tooMany && (
        <p className="mt-3 text-xs text-destructive">
          Capacité maximum : {capacity} personnes.
        </p>
      )}

      {availability === "unavailable" && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
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
        className="mt-4 w-full bg-primary text-primary-foreground hover:bg-bougainvillier"
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

      <p className="mt-3 text-center text-[0.78rem] text-muted-foreground">
        Vous ne serez pas débité maintenant
      </p>

      {totals && nights && (
        <dl className="mt-4 space-y-2 border-t border-line-soft pt-4 text-sm">
          <Row
            label={`${priceLabel} TND × ${nights} nuit${nights > 1 ? "s" : ""}`}
            value={formatTND(totals.stay)}
          />
          {totals.longStayDiscount > 0 && (
            <Row
              label="Remise long séjour (−10 %)"
              value={`−${formatTND(totals.longStayDiscount)}`}
              tone="success"
            />
          )}
          {cleaningFee > 0 && (
            <Row label="Frais de ménage" value={formatTND(cleaningFee)} />
          )}
          <Row
            label={`Taxes (${Math.round(taxRate * 100)} %)`}
            value={formatTND(totals.tax)}
            muted
          />
          <div className="flex items-baseline justify-between border-t border-line-soft pt-3 font-semibold">
            <dt>Total estimé</dt>
            <dd className="font-heading text-lg text-primary">
              {formatTND(totals.total)}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-4 flex items-start gap-3 rounded-md bg-sand p-3 text-xs text-charcoal-soft">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          Annulation gratuite jusqu&apos;à 7 jours avant l&apos;arrivée.
        </span>
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  muted,
  tone,
}: {
  label: string;
  value: string;
  muted?: boolean;
  tone?: "success";
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between",
        muted ? "text-muted-foreground" : "text-charcoal-soft",
        tone === "success" && "text-success",
      )}
    >
      <dt>{label}</dt>
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
        <p className="text-sm font-medium text-charcoal">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="inline-flex size-8 items-center justify-center rounded-full border border-line bg-card text-charcoal hover:border-charcoal disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Moins"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-5 text-center text-sm font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="inline-flex size-8 items-center justify-center rounded-full border border-line bg-card text-charcoal hover:border-charcoal disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Plus"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
