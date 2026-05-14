import type { ComputedPricing, PriceLine } from "./types";

/**
 * Pure pricing helper for the admin wizard.
 *
 * Mirrors the high-level shape of `lib/pricing.calculateReservationTotal`
 * but works off the editable line model so the receptionist sees every
 * change reflected instantly. The Server Action still recomputes
 * authoritative totals from the submitted base/discount/extras.
 *
 * Conventions:
 *  - All monetary values in millimes (1 TND = 1000 millimes).
 *  - `tourist tax` is built from a hard-coded 2 330 millimes / guest /
 *    night (matches the public funnel recap).
 *  - The discount line stores its value in either percent or millimes
 *    based on `mode`; everything else is read-only by construction.
 */

export const TOURIST_TAX_PER_GUEST_PER_NIGHT_MILLIMES = 2_330;

export interface PricingArgs {
  basePriceMillimes: number;
  nights: number;
  guests: number;
  lines: PriceLine[];
}

export function computePricing({
  basePriceMillimes,
  nights,
  guests,
  lines,
}: PricingArgs): ComputedPricing {
  const safeNights = nights > 0 ? nights : 0;
  const nightlyPrice = basePriceMillimes;
  const basePrice = nightlyPrice * safeNights;

  const discountLine = lines.find((l) => l.kind === "discount");
  let discountAmount = 0;
  if (discountLine && basePrice > 0) {
    if (discountLine.mode === "%") {
      const pct = Math.max(0, Math.min(100, discountLine.value));
      discountAmount = Math.round((basePrice * pct) / 100);
    } else {
      // TND mode — value is in millimes already.
      discountAmount = Math.max(0, Math.round(discountLine.value));
    }
    discountAmount = Math.min(discountAmount, basePrice);
  }

  const extrasTotal = lines
    .filter((l) => l.kind === "extra")
    .reduce((acc, l) => acc + Math.max(0, Math.round(l.value)), 0);

  const subtotal = Math.max(0, basePrice - discountAmount + extrasTotal);

  const taxLine = lines.find((l) => l.kind === "tax");
  const taxRate = taxLine ? Math.max(0, Math.min(100, taxLine.value)) / 100 : 0;
  const tax = Math.round(subtotal * taxRate);

  const touristTax =
    guests > 0 && safeNights > 0
      ? guests * safeNights * TOURIST_TAX_PER_GUEST_PER_NIGHT_MILLIMES
      : 0;

  const total = subtotal + tax + touristTax;

  return {
    nightlyPrice,
    basePrice,
    discountAmount,
    extrasTotal,
    subtotal,
    tax,
    taxRate,
    touristTax,
    total,
  };
}

/**
 * Build the initial line set for a fresh wizard run.
 *
 * - discount: 10% long-stay when nights ≥ 5, else 0% (still rendered).
 * - tax: defaults to the registry tax rate (passed in).
 * - extras: none — receptionist adds them on demand.
 */
export function buildInitialLines(opts: {
  nights: number;
  defaultTaxRate: number;
}): PriceLine[] {
  const longStayPct = opts.nights >= 5 ? 10 : 0;
  return [
    {
      id: "discount",
      kind: "discount",
      label: opts.nights >= 5 ? "Remise long séjour" : "Remise",
      value: longStayPct,
      mode: "%",
    },
    {
      id: "tax",
      kind: "tax",
      label: `TVA`,
      value: Math.round(opts.defaultTaxRate * 100),
    },
  ];
}
