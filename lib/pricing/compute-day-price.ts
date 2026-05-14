import { toZonedTime } from "date-fns-tz";
import { TZ } from "../date";

/**
 * Per-night price computation for the admin pricing calendar.
 *
 * All percentages are in basis points (10000 = 100%) so the math stays in Int.
 * Season multiplier is also in basis points (1000 = 1.000x, 1800 = 1.800x).
 *
 * Day classification (weekend, holidays...) is done in Africa/Tunis local time
 * — never in UTC — to keep the calendar consistent with the local wall clock.
 */

export interface ComputeDayPriceOpts {
  /** Base nightly price in millimes. */
  basePrice: number;
  /** UTC instant representing midnight on the target day in Africa/Tunis. */
  date: Date;
  /** Season multiplier in basis points. 1000 = ×1.0, 1800 = ×1.8. */
  seasonMultiplier: number;
  /** Weekend supplement, basis points. 1500 = +15%. */
  weekendPct: number;
  /** TN school holidays supplement, basis points. */
  tnHolidaysPct: number;
  /** Ramadan supplement, basis points (negative = discount). */
  ramadanPct: number;
  /** Aïd supplement, basis points. */
  aidPct: number;
  /** Whether the day falls in TN school holidays. */
  isTnHolidays?: boolean;
  /** Whether the day falls during Ramadan. */
  isRamadan?: boolean;
  /** Whether the day is Aïd. */
  isAid?: boolean;
}

/**
 * Returns true when the given UTC instant lands on a Friday, Saturday, or
 * Sunday in Africa/Tunis local time. Matches the maquette legend: "Ven-Dim".
 */
export function isWeekendLocal(date: Date): boolean {
  const zoned = toZonedTime(date, TZ);
  const day = zoned.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  return day === 5 || day === 6 || day === 0;
}

/**
 * Pure, deterministic per-night price.
 *
 *   price = round(base × seasonMultiplier / 1000)
 *   then apply weekend / vac / ramadan / aid supplements multiplicatively.
 */
export function computeDayPrice(opts: ComputeDayPriceOpts): number {
  const {
    basePrice,
    date,
    seasonMultiplier,
    weekendPct,
    tnHolidaysPct,
    ramadanPct,
    aidPct,
    isTnHolidays = false,
    isRamadan = false,
    isAid = false,
  } = opts;

  if (!Number.isInteger(basePrice) || basePrice < 0) {
    throw new RangeError(`computeDayPrice: invalid basePrice ${basePrice}`);
  }
  if (!Number.isInteger(seasonMultiplier) || seasonMultiplier < 0) {
    throw new RangeError(
      `computeDayPrice: invalid seasonMultiplier ${seasonMultiplier}`,
    );
  }

  // Base × season multiplier (basis points / 1000).
  let price = Math.round((basePrice * seasonMultiplier) / 1000);

  // Multiplicative supplements (each compounds on the previous).
  if (isWeekendLocal(date)) {
    price = Math.round((price * (10000 + weekendPct)) / 10000);
  }
  if (isTnHolidays) {
    price = Math.round((price * (10000 + tnHolidaysPct)) / 10000);
  }
  if (isRamadan) {
    price = Math.round((price * (10000 + ramadanPct)) / 10000);
  }
  if (isAid) {
    price = Math.round((price * (10000 + aidPct)) / 10000);
  }

  return Math.max(price, 0);
}
