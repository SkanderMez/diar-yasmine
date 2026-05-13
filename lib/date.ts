import {
  addDays,
  differenceInCalendarDays,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { APP_TIMEZONE, type SupportedLocale } from "./constants";

/**
 * Date helpers — Africa/Tunis.
 *
 * The DB stores timestamptz in UTC. Business logic (calendar, nights,
 * pricing per day) runs in Africa/Tunis. These helpers convert between
 * the two consistently. Never call new Date() with a wall-clock string
 * outside of these helpers, or you'll silently use the host timezone.
 *
 * Africa/Tunis is UTC+1, no DST since 2009 (good for us — no spring/
 * fall edge cases on stay boundaries).
 */
export const TZ = APP_TIMEZONE;

/** Current time as a UTC Date instant. */
export function now(): Date {
  return new Date();
}

/**
 * Parse a wall-clock date string (YYYY-MM-DD, no time, no offset) as
 * midnight on that day in Africa/Tunis, returning the corresponding
 * UTC Date for storage.
 */
export function parseLocalDate(ymd: string): Date {
  const local = parseISO(`${ymd}T00:00:00`);
  return fromZonedTime(local, TZ);
}

/**
 * Format a UTC Date in the Africa/Tunis timezone with a date-fns
 * pattern. Default pattern is the locale's long date.
 */
export function formatLocalized(
  date: Date,
  pattern = "PPP",
  _locale: SupportedLocale = "fr",
): string {
  return formatInTimeZone(date, TZ, pattern);
}

/**
 * Whole nights between a check-in and a check-out. Both arguments must
 * be UTC instants representing midnight in Africa/Tunis (typically via
 * `parseLocalDate`). Throws if checkOut <= checkIn.
 */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const inTz = toZonedTime(checkIn, TZ);
  const outTz = toZonedTime(checkOut, TZ);
  const diff = differenceInCalendarDays(outTz, inTz);
  if (diff <= 0) {
    throw new RangeError(
      `nightsBetween: checkOut (${checkOut.toISOString()}) must be after checkIn (${checkIn.toISOString()})`,
    );
  }
  return diff;
}

/**
 * [aStart, aEnd) overlaps [bStart, bEnd) ?
 * Half-open intervals so a checkout on day X doesn't overlap a check-in
 * on day X — matches the DB EXCLUDE constraint with tstzrange('[)').
 */
export function rangeOverlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export { addDays, isAfter, isBefore, startOfDay };
