import {
  applyPercentDiscount,
  clampDiscountToAmount,
  sumMillimes,
  type Millimes,
} from "../money";

/**
 * Reservation pricing engine — pure function, fully testable, no I/O.
 *
 * All inputs and outputs are integers in millimes (1 TND = 1000 millimes).
 * Float arithmetic is forbidden anywhere downstream — see /lib/money.ts.
 *
 * Discount semantics (per brief):
 *   - PERCENT: `value` is a percent (0-100), discount = round(base * value / 100).
 *   - FIXED:   `value` is in millimes, discount = min(value, base).
 *   - The discount is always clamped to [0, basePrice] — it never reduces
 *     cleaning fee, extras, or pushes the total negative.
 *
 * Season multiplier is in basis points (1000 = 1.000x, 1500 = 1.5x) to keep
 * the math in Int. The multiplier applies to the nightly price only.
 */

export type PricingDiscountType = "NONE" | "PERCENT" | "FIXED";

export interface PricingDiscount {
  type: PricingDiscountType;
  /** Percent 0-100 for PERCENT, millimes for FIXED, ignored for NONE. */
  value: number;
}

export interface PricingExtra {
  label: string;
  amount: Millimes;
  category?: string;
}

export interface PricingInput {
  property: {
    basePrice: Millimes;
    cleaningFee: Millimes;
  };
  nights: number;
  extras?: PricingExtra[];
  discount?: PricingDiscount;
  /** Basis points. 1000 = 1.000x (default), 1500 = 1.500x, etc. */
  seasonMultiplierBp?: number;
  /** Tax rate as a decimal in [0, 1]. Read from Setting "tax.rate". */
  taxRate: number;
}

export interface PricingBreakdown {
  nights: number;
  nightlyPrice: Millimes;
  basePrice: Millimes;
  cleaningFee: Millimes;
  extrasTotal: Millimes;
  discountAmount: Millimes;
  subtotal: Millimes;
  tax: Millimes;
  total: Millimes;
}

export function calculateReservationTotal(
  input: PricingInput,
): PricingBreakdown {
  const {
    property,
    nights,
    extras = [],
    discount = { type: "NONE", value: 0 },
    seasonMultiplierBp = 1000,
    taxRate,
  } = input;

  if (!Number.isInteger(nights) || nights <= 0) {
    throw new RangeError(`calculateReservationTotal: invalid nights ${nights}`);
  }
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) {
    throw new RangeError(
      `calculateReservationTotal: taxRate ${taxRate} out of [0, 1]`,
    );
  }
  if (!Number.isInteger(seasonMultiplierBp) || seasonMultiplierBp < 0) {
    throw new RangeError(
      `calculateReservationTotal: invalid seasonMultiplierBp ${seasonMultiplierBp}`,
    );
  }

  const nightlyPrice = Math.round(
    (property.basePrice * seasonMultiplierBp) / 1000,
  );
  const basePrice = nightlyPrice * nights;
  const cleaningFee = property.cleaningFee;
  const extrasTotal = sumMillimes(extras.map((e) => e.amount));

  let discountAmount: Millimes = 0;
  if (discount.type === "PERCENT") {
    discountAmount = applyPercentDiscount(basePrice, discount.value);
  } else if (discount.type === "FIXED") {
    if (!Number.isInteger(discount.value) || discount.value < 0) {
      throw new RangeError(
        `Fixed discount must be a non-negative integer millime`,
      );
    }
    discountAmount = discount.value;
  }
  discountAmount = clampDiscountToAmount(discountAmount, basePrice);

  const subtotal = basePrice + cleaningFee + extrasTotal - discountAmount;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  return {
    nights,
    nightlyPrice,
    basePrice,
    cleaningFee,
    extrasTotal,
    discountAmount,
    subtotal,
    tax,
    total,
  };
}
