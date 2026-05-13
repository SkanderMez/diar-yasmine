"use client";

import { formatTND } from "@/lib/money";
import {
  calculateReservationTotal,
  type PricingDiscount,
  type PricingExtra,
} from "@/lib/pricing";
import type { ActiveProperty } from "@/lib/queries";

interface PriceSummaryProps {
  property: ActiveProperty | undefined;
  nights: number | null;
  extras: PricingExtra[];
  discount: PricingDiscount;
  taxRate: number;
  seasonMultiplierBp: number;
}

/**
 * Live tariff card displayed alongside the Quick Book form.
 *
 * Pure rendering of `calculateReservationTotal`. The seed currently has
 * one Season (high summer × 1.5) so seasonMultiplierBp will be 1500 for
 * July/August stays, 1000 otherwise. Phase 2.5 wires real-time season
 * lookup via a Server Action; for Phase 2 the parent passes the value
 * computed at form load.
 */
export function PriceSummary({
  property,
  nights,
  extras,
  discount,
  taxRate,
  seasonMultiplierBp,
}: PriceSummaryProps) {
  if (!property || !nights || nights <= 0) {
    return (
      <aside className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Sélectionnez une unité et des dates pour voir le tarif.
      </aside>
    );
  }

  let breakdown;
  try {
    breakdown = calculateReservationTotal({
      property: {
        basePrice: property.basePrice,
        cleaningFee: property.cleaningFee,
      },
      nights,
      extras,
      discount,
      seasonMultiplierBp,
      taxRate,
    });
  } catch (err) {
    return (
      <aside className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Tarif invalide : {(err as Error).message}
      </aside>
    );
  }

  const balance = breakdown.total;

  return (
    <aside className="space-y-4 rounded-lg border border-border bg-card p-6">
      <header>
        <h3 className="font-medium text-foreground">{property.name}</h3>
        <p className="text-xs text-muted-foreground">
          {nights} nuit{nights > 1 ? "s" : ""} ·{" "}
          {seasonMultiplierBp !== 1000
            ? `Saison ×${(seasonMultiplierBp / 1000).toFixed(2)}`
            : "Saison standard"}
        </p>
      </header>

      <dl className="space-y-2 text-sm">
        <Row
          label={`${nights} × ${formatTND(breakdown.nightlyPrice)}`}
          value={formatTND(breakdown.basePrice)}
        />
        {breakdown.discountAmount > 0 && (
          <Row
            label="Remise"
            value={`- ${formatTND(breakdown.discountAmount)}`}
            tone="success"
          />
        )}
        {breakdown.cleaningFee > 0 && (
          <Row
            label="Frais de ménage"
            value={formatTND(breakdown.cleaningFee)}
          />
        )}
        {breakdown.extrasTotal > 0 && (
          <Row label="Extras" value={formatTND(breakdown.extrasTotal)} />
        )}
        <Row
          label="Sous-total"
          value={formatTND(breakdown.subtotal)}
          tone="muted"
        />
        {breakdown.tax > 0 && (
          <Row
            label={`TVA (${(taxRate * 100).toFixed(0)}%)`}
            value={formatTND(breakdown.tax)}
            tone="muted"
          />
        )}
      </dl>

      <div className="flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm font-medium text-foreground">Total</span>
        <span className="text-2xl font-medium text-primary">
          {formatTND(breakdown.total)}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Solde à percevoir : <strong>{formatTND(balance)}</strong>
      </p>
    </aside>
  );
}

function Row({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "success";
}) {
  const toneClass =
    tone === "muted"
      ? "text-muted-foreground"
      : tone === "success"
        ? "text-success"
        : "text-foreground";
  return (
    <div className="flex items-baseline justify-between">
      <dt className={toneClass}>{label}</dt>
      <dd className={toneClass}>{value}</dd>
    </div>
  );
}
