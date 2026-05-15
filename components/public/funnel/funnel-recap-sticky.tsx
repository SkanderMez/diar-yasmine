"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTND } from "@/lib/money";

interface FunnelRecapStickyProps {
  property: {
    name: string;
    type: "CHALET" | "BUNGALOW";
    photoUrl?: string | null;
    beachfront?: boolean;
    hasPrivatePool?: boolean;
  };
  /** YYYY-MM-DD */
  checkIn: string;
  /** YYYY-MM-DD */
  checkOut: string;
  nights: number;
  adults: number;
  childrenCount: number;
  /** Nightly rate in millimes. */
  basePrice: number;
  /** Cleaning fee in millimes. */
  cleaningFee: number;
  /** Tax rate as a 0-1 decimal. */
  taxRate: number;
  /** Long-stay percent discount (5+ nights = 10% by default). */
  longStayDiscountPct?: number;
  /** Optional rating shown top-right. */
  rating?: { score: number; count: number };
  /** Promo flow — parent owns the applied state. */
  onPromoApply?: (code: string) => void | Promise<void>;
  /** Promo discount currently applied, in millimes. */
  promoDiscount?: number;
  /** Pre-fill the promo input (e.g. from search params). */
  initialPromoCode?: string;
}

/**
 * Maquette `.recap-sticky` — sticky right-column card on the funnel.
 * Shows the unit hero, key dates/guests, a promo code input, the live
 * price breakdown (computed client-side for instant feedback) and the
 * cancellation notice.
 */
export function FunnelRecapSticky({
  property,
  checkIn,
  checkOut,
  nights,
  adults,
  childrenCount,
  basePrice,
  cleaningFee,
  taxRate,
  longStayDiscountPct = 10,
  rating,
  onPromoApply,
  promoDiscount = 0,
  initialPromoCode,
}: FunnelRecapStickyProps) {
  const [promo, setPromo] = useState(initialPromoCode ?? "");

  const breakdown = useMemo(() => {
    const stay = basePrice * nights;
    const longStay =
      nights >= 5 && longStayDiscountPct > 0
        ? Math.round((stay * longStayDiscountPct) / 100)
        : 0;
    const promo = Math.max(0, Math.min(promoDiscount, stay - longStay));
    const subtotal = stay - longStay - promo + cleaningFee;
    const tax = Math.round(subtotal * taxRate);
    return {
      stay,
      longStay,
      promo,
      subtotal,
      tax,
      total: subtotal + tax,
    };
  }, [
    basePrice,
    nights,
    longStayDiscountPct,
    cleaningFee,
    taxRate,
    promoDiscount,
  ]);

  const cancellationDate = useMemo(() => {
    const ci = new Date(`${checkIn}T00:00:00`);
    return format(addDays(ci, -7), "d MMMM yyyy", { locale: fr });
  }, [checkIn]);

  const checkInLabel = useMemo(
    () =>
      format(new Date(`${checkIn}T00:00:00`), "EEE d MMM yyyy", { locale: fr }),
    [checkIn],
  );
  const checkOutLabel = useMemo(
    () =>
      format(new Date(`${checkOut}T00:00:00`), "EEE d MMM yyyy", {
        locale: fr,
      }),
    [checkOut],
  );

  const tndPerNight = basePrice / 1000;
  const tndPerNightLabel = Number.isInteger(tndPerNight)
    ? tndPerNight.toLocaleString("fr-FR")
    : tndPerNight.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

  return (
    <aside className="sticky top-[168px] overflow-hidden rounded-lg border border-line-soft bg-white shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {property.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.photoUrl}
            alt={property.name}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <span className="font-heading text-2xl">{property.name}</span>
          </div>
        )}
        {rating && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs text-charcoal shadow-sm backdrop-blur">
            <Star
              className="size-3.5 text-gold"
              fill="currentColor"
              strokeWidth={0}
            />
            <strong className="font-semibold">{rating.score.toFixed(2)}</strong>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent px-5 py-4 text-ivory">
          <div className="mb-1 flex gap-1.5">
            {property.beachfront && (
              <span className="inline-flex items-center rounded-full bg-bougainvillier px-2.5 py-0.5 text-[0.7rem] font-medium text-ivory">
                Front de mer
              </span>
            )}
            {property.hasPrivatePool && (
              <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[0.7rem] font-medium text-ivory">
                Piscine privée
              </span>
            )}
          </div>
          <p className="font-heading text-xl font-medium">{property.name}</p>
          <p className="text-xs text-ivory/80">
            {property.type === "CHALET" ? "Chalet" : "Bungalow"}
            {property.beachfront ? " · Front de mer" : ""}
          </p>
        </div>
      </div>

      <div className="p-5">
        <dl className="text-sm">
          <Row label="Arrivée" value={`${checkInLabel}`} />
          <Row label="Départ" value={`${checkOutLabel}`} />
          <Row label="Durée" value={`${nights} nuit${nights > 1 ? "s" : ""}`} />
          <Row
            label="Voyageurs"
            value={
              childrenCount > 0
                ? `${adults} adulte${adults > 1 ? "s" : ""}, ${childrenCount} enfant${childrenCount > 1 ? "s" : ""}`
                : `${adults} adulte${adults > 1 ? "s" : ""}`
            }
          />
        </dl>

        <div className="my-4 flex gap-1.5">
          <input
            type="text"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            placeholder="Code promo"
            className="flex-1 rounded-full border border-line bg-white px-3 py-2 text-[0.85rem] text-charcoal outline-none placeholder:text-muted-foreground/70 focus:border-primary"
          />
          <button
            type="button"
            disabled={!promo.trim() || !onPromoApply}
            onClick={() => onPromoApply?.(promo.trim())}
            className="rounded-full px-3 text-xs font-medium text-primary transition-colors hover:bg-sand disabled:opacity-40"
          >
            Appliquer
          </button>
        </div>

        <div className="space-y-1.5 border-t border-line-soft pt-4 text-sm">
          <PriceRow
            label={`${tndPerNightLabel} TND × ${nights} nuit${nights > 1 ? "s" : ""}`}
            value={formatTND(breakdown.stay)}
          />
          {breakdown.longStay > 0 && (
            <PriceRow
              label={`Remise long séjour (−${longStayDiscountPct}%)`}
              value={`−${formatTND(breakdown.longStay)}`}
              tone="success"
            />
          )}
          {breakdown.promo > 0 && (
            <PriceRow
              label="Code promo"
              value={`−${formatTND(breakdown.promo)}`}
              tone="success"
            />
          )}
          {cleaningFee > 0 && (
            <PriceRow label="Frais de ménage" value={formatTND(cleaningFee)} />
          )}
          <PriceRow
            label={`Taxes (${Math.round(taxRate * 100)}%)`}
            value={formatTND(breakdown.tax)}
            muted
          />
          <div className="mt-2 flex items-baseline justify-between border-t border-line-soft pt-3 font-semibold text-charcoal">
            <dt>Total estimé</dt>
            <dd className="font-heading text-[1.5rem] text-primary">
              {formatTND(breakdown.total)}
            </dd>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-md bg-sand p-3 text-xs text-charcoal-soft">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <strong className="block text-charcoal">Annulation flexible</strong>
            Remboursement intégral jusqu&apos;au {cancellationDate}.
          </div>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-charcoal">{value}</dd>
    </div>
  );
}

function PriceRow({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: string;
  tone?: "success";
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-3 py-1.5 text-charcoal-soft",
        muted && "text-muted-foreground",
        tone === "success" && "font-medium text-success",
      )}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
