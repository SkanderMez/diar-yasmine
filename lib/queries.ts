import { prisma } from "./prisma";

/**
 * Server-only read helpers used by admin layouts and Server Components.
 * NOT Server Actions — these are plain functions you call from a Server
 * Component, no `"use server"` directive needed.
 */

/**
 * List the active properties for the Quick Book unit picker and the
 * calendar grid. Sorted: chalets first (alphabetical), then bungalows.
 */
export async function listActiveProperties() {
  const properties = await prisma.property.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      capacity: true,
      basePrice: true,
      cleaningFee: true,
      hasPrivatePool: true,
      seaView: true,
      beachfront: true,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return properties;
}

export type ActiveProperty = Awaited<
  ReturnType<typeof listActiveProperties>
>[number];

/**
 * Fetch every reservation that touches [start, end) for the calendar grid.
 * Excludes cancelled / no-show / soft-deleted rows — those don't render.
 * Each row carries the minimum the grid needs (guest name, source, status,
 * totals).
 */
export async function listReservationsForCalendar(start: Date, end: Date) {
  return prisma.reservation.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      // Overlap with the [start, end) window.
      checkIn: { lt: end },
      checkOut: { gt: start },
    },
    select: {
      id: true,
      code: true,
      propertyId: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      adults: true,
      children: true,
      status: true,
      source: true,
      total: true,
      paidAmount: true,
      guest: {
        select: { id: true, firstName: true, lastName: true, phone: true },
      },
    },
    orderBy: [{ propertyId: "asc" }, { checkIn: "asc" }],
  });
}

export type CalendarReservation = Awaited<
  ReturnType<typeof listReservationsForCalendar>
>[number];

/**
 * Full reservation view used by /admin/reservations/[code].
 *
 * Returns null on miss (caller renders notFound()). Pulls guest, property,
 * the full payment history, and the last 20 audit-log rows so the page
 * stays a single network round-trip.
 */
export async function findReservationByCode(code: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { code },
    include: {
      guest: true,
      property: {
        select: { id: true, name: true, slug: true, type: true },
      },
      createdBy: { select: { id: true, name: true, email: true } },
      payments: {
        orderBy: { receivedAt: "desc" },
        include: {
          receivedBy: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!reservation || reservation.deletedAt) return null;

  const audit = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entity: "Reservation", entityId: reservation.id },
        // Surface payment audits attached to this reservation's payments.
        {
          entity: "Payment",
          entityId: { in: reservation.payments.map((p) => p.id) },
        },
      ],
    },
    orderBy: { timestamp: "desc" },
    take: 20,
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return { reservation, audit };
}

export type ReservationDetail = NonNullable<
  Awaited<ReturnType<typeof findReservationByCode>>
>;
