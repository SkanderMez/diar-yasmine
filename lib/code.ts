import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { RESERVATION_CODE_PREFIX, RESERVATION_CODE_REGEX } from "./constants";

/**
 * Reservation code generator.
 *
 * Format: `DY-YYYYMMDD-XXXX` where:
 *   - `DY`       — fixed brand prefix.
 *   - `YYYYMMDD` — check-in date in UTC (matches what's printed on the voucher).
 *   - `XXXX`     — 4-char crypto-random base32 suffix (~1M codes per day before
 *                  meaningful collision odds; the DB UNIQUE constraint is the
 *                  final word).
 *
 * `Reservation.code` is UNIQUE in Postgres — if a collision lands, we retry.
 * After 5 retries we bail; in production this should never trigger.
 */

const BASE32_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/1/I/L/O for human legibility
const SUFFIX_LEN = 4;
const MAX_ATTEMPTS = 5;

function randomSuffix(): string {
  const bytes = randomBytes(SUFFIX_LEN);
  let out = "";
  for (let i = 0; i < SUFFIX_LEN; i++) {
    out += BASE32_ALPHABET[bytes[i]! % BASE32_ALPHABET.length];
  }
  return out;
}

function datePart(checkIn: Date): string {
  const y = checkIn.getUTCFullYear().toString().padStart(4, "0");
  const m = (checkIn.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = checkIn.getUTCDate().toString().padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * Build a fresh, unique reservation code that does not exist in the DB.
 * Throws after MAX_ATTEMPTS collisions (essentially never).
 */
export async function generateReservationCode(checkIn: Date): Promise<string> {
  const prefix = `${RESERVATION_CODE_PREFIX}-${datePart(checkIn)}`;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = `${prefix}-${randomSuffix()}`;
    const existing = await prisma.reservation.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error(
    `generateReservationCode: ${MAX_ATTEMPTS} consecutive collisions on prefix ${prefix} — investigate`,
  );
}

/** Validate a code's format (does NOT check DB existence). */
export function isValidReservationCode(code: string): boolean {
  return RESERVATION_CODE_REGEX.test(code);
}
