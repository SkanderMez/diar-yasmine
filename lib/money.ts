import { MILLIMES_PER_TND } from "./constants";

/**
 * Money helpers.
 *
 * The database stores every monetary value as an Int in millimes
 * (1 TND = 1000 millimes). This avoids the precision pitfalls of Float
 * arithmetic. Components and server actions must use these helpers
 * everywhere — never multiply/divide raw amounts with a Number, and
 * never store TND directly.
 *
 * Semantic alias:
 *   type Millimes = number;   // an integer count of millimes
 */
export type Millimes = number;

export function tndToMillimes(tnd: number): Millimes {
  if (!Number.isFinite(tnd)) {
    throw new RangeError(`tndToMillimes: not a finite number: ${tnd}`);
  }
  return Math.round(tnd * MILLIMES_PER_TND);
}

export function millimesToTnd(millimes: Millimes): number {
  assertMillimes(millimes);
  return millimes / MILLIMES_PER_TND;
}

export function assertMillimes(value: number): asserts value is Millimes {
  if (!Number.isInteger(value)) {
    throw new TypeError(`assertMillimes: ${value} is not an integer`);
  }
}

/**
 * Apply a percentage discount to a millimes amount.
 * `percent` is the human number (e.g. 20 for 20%), in [0, 100].
 * The result is rounded to the nearest millime.
 */
export function applyPercentDiscount(
  amount: Millimes,
  percent: number,
): Millimes {
  assertMillimes(amount);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new RangeError(`applyPercentDiscount: percent ${percent} out of [0,100]`);
  }
  return Math.round((amount * percent) / 100);
}

/**
 * Clamp a discount to [0, amount] so it never goes negative or exceeds
 * the base amount. Returns an integer.
 */
export function clampDiscountToAmount(
  discount: Millimes,
  amount: Millimes,
): Millimes {
  assertMillimes(discount);
  assertMillimes(amount);
  return Math.min(Math.max(discount, 0), amount);
}

/** Sum a list of millimes integers, validating each. */
export function sumMillimes(values: Millimes[]): Millimes {
  return values.reduce<Millimes>((acc, v) => {
    assertMillimes(v);
    return acc + v;
  }, 0);
}

const tndFormatterFr = new Intl.NumberFormat("fr-TN", {
  style: "currency",
  currency: "TND",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const tndFormatterEn = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "TND",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

/**
 * Format a millimes amount as a localized TND string.
 * Example: 350_000 → "350,000 TND" (fr-TN) / "TND 350.000" (en).
 */
export function formatTND(
  millimes: Millimes,
  opts: { locale?: "fr" | "en" | "ar" } = {},
): string {
  assertMillimes(millimes);
  const formatter = opts.locale === "en" ? tndFormatterEn : tndFormatterFr;
  return formatter.format(millimes / MILLIMES_PER_TND);
}
