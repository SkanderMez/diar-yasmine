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
    throw new RangeError(
      `applyPercentDiscount: percent ${percent} out of [0,100]`,
    );
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

/**
 * Display-side formatters.
 *
 * The maquette specifies prices like `5 531,68 TND` — French thousands
 * separator (narrow no-break space), comma decimal, 2 decimal places,
 * trailing TND symbol. We render this consistently across the app via
 * `fr-FR` (which uses space + comma) with `style: "decimal"` plus a
 * manual " TND" suffix, so we don't get the locale-specific currency
 * placement quirks of `fr-TN`.
 */
const tndFormatterFr = new Intl.NumberFormat("fr-FR", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const tndFormatterEn = new Intl.NumberFormat("en-US", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a millimes amount as a localized TND string for display.
 *
 * Examples:
 *   formatTND(5_531_680) → "5 531,68 TND"
 *   formatTND(350_000)   → "350 TND"        (trailing ,00 stripped)
 *   formatTND(2_330)     → "2,33 TND"
 *
 * Trailing-zero stripping: when the decimal portion would render as
 * `,00` (fr) or `.00` (en), we drop it for visual cleanliness. The
 * underlying DB value stays an Int in millimes; this is purely a
 * display concern. For audit-grade output (vouchers, invoices), use
 * `formatTNDPrecise`.
 */
export function formatTND(
  millimes: Millimes,
  opts: { locale?: "fr" | "en" | "ar" } = {},
): string {
  assertMillimes(millimes);
  const formatter = opts.locale === "en" ? tndFormatterEn : tndFormatterFr;
  let formatted = formatter.format(millimes / MILLIMES_PER_TND);
  // Strip trailing ",00" or ".00" — keep "350" instead of "350,00".
  formatted = formatted.replace(/[.,]00$/, "");
  return `${formatted} TND`;
}

const tndPreciseFormatterFr = new Intl.NumberFormat("fr-FR", {
  style: "decimal",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

/**
 * Full-precision millimes-aware formatter (3 decimal digits). Use on
 * the voucher PDF and the admin reservation detail where the exact
 * stored value must be visible.
 */
export function formatTNDPrecise(millimes: Millimes): string {
  assertMillimes(millimes);
  return `${tndPreciseFormatterFr.format(millimes / MILLIMES_PER_TND)} TND`;
}
