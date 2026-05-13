import { prisma } from "../prisma";

/**
 * Availability check — application-level guard.
 *
 * The DB EXCLUDE GIST constraint is the ultimate authority and will roll
 * back any conflicting INSERT/UPDATE inside a transaction. This function
 * provides an earlier, friendlier signal so the form can validate before
 * committing.
 *
 * Both functions exclude cancelled / no-show / soft-deleted rows from
 * conflict detection, matching the DB constraint's WHERE clause.
 */

export interface AvailabilityRange {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  /** When editing an existing reservation, exclude its row from the check. */
  excludeReservationId?: string;
}

/**
 * Returns true if `[checkIn, checkOut)` does not overlap any active
 * reservation on the property. Intervals are half-open, matching the
 * DB tstzrange '[)' semantics: a checkout on day X does not conflict
 * with a check-in on day X.
 */
export async function isAvailable(range: AvailabilityRange): Promise<boolean> {
  const conflicts = await findConflicts(range);
  return conflicts.length === 0;
}

/**
 * Returns the conflicting reservations for the requested range. Useful
 * to surface a precise error message in the UI.
 */
export async function findConflicts(range: AvailabilityRange) {
  if (range.checkOut <= range.checkIn) {
    throw new RangeError("findConflicts: checkOut must be after checkIn");
  }
  return prisma.reservation.findMany({
    where: {
      propertyId: range.propertyId,
      id: range.excludeReservationId
        ? { not: range.excludeReservationId }
        : undefined,
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      // Half-open overlap: existing.checkIn < new.checkOut && existing.checkOut > new.checkIn
      checkIn: { lt: range.checkOut },
      checkOut: { gt: range.checkIn },
    },
    select: {
      id: true,
      code: true,
      checkIn: true,
      checkOut: true,
      status: true,
      source: true,
      guest: { select: { firstName: true, lastName: true } },
    },
    orderBy: { checkIn: "asc" },
  });
}

/**
 * Lookup the unique seasonal multiplier covering a given date range, if any.
 * Returns the multiplier in basis points (1000 = 1.0x). When the range
 * straddles seasons or no season matches, defaults to 1000.
 *
 * Phase 2.5 will refine: per-day multiplier for cross-season stays.
 */
export async function seasonMultiplierForRange(
  checkIn: Date,
  checkOut: Date,
): Promise<number> {
  // Find the first season that contains checkIn. If checkOut still falls
  // inside it, that's the multiplier. Otherwise return 1000 (no boost).
  const season = await prisma.season.findFirst({
    where: {
      startDate: { lte: checkIn },
      endDate: { gte: checkOut },
    },
    orderBy: { startDate: "desc" },
  });
  return season?.priceMultiplier ?? 1000;
}
