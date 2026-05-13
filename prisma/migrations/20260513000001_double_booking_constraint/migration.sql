-- Prevent double-booking at the database level.
--
-- This complements (and overrides) any application-level checks. Even
-- with concurrent transactions, two reservations on the same property
-- with overlapping date ranges cannot both commit.
--
-- The btree_gist extension is required to use a btree-equality operator
-- (`propertyId WITH =`) inside a GIST EXCLUDE constraint.
--
-- The interval `[checkIn, checkOut)` is half-open: a reservation that
-- ends on the same day another one starts does NOT overlap, matching
-- standard hotel checkin/checkout semantics.
--
-- The constraint is skipped for cancelled, no-show, and soft-deleted
-- rows so that they cannot block future reservations.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_no_overlap"
EXCLUDE USING gist (
  "propertyId" WITH =,
  tstzrange("checkIn", "checkOut", '[)') WITH &&
) WHERE (
  "status" NOT IN ('CANCELLED', 'NO_SHOW')
  AND "deletedAt" IS NULL
);

-- Customers can have only one Guest row per email when an email is set.
-- Multiple NULL emails are allowed (Postgres default NULLS DISTINCT
-- behaviour). The existing Prisma-generated unique index covers this,
-- but we keep this comment as documentation: do NOT remove the @unique
-- annotation on `Guest.email` in schema.prisma.

-- AuditLog retention: a follow-up migration may add a partitioning
-- strategy or a TTL job. Not in scope for Phase 1.
