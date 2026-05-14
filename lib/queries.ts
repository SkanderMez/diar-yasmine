import type { Prisma, ReservationSource } from "@prisma/client";
import { prisma } from "./prisma";
import { findUnavailablePropertyIds } from "./availability";
import { TZ } from "./date";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, startOfDay } from "date-fns";

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

/**
 * Listing query for the public site (/chalets, /bungalows). Returns
 * active properties of the requested type plus their first 3 photos
 * for the card. Sorted by name.
 */
/**
 * Returns the catalog of amenities flagged `filterable=true`, sorted for
 * the public listing sidebar. Light cache-key shape: only the fields the
 * client actually renders.
 */
export async function listFilterableAmenities() {
  return prisma.amenity.findMany({
    where: { filterable: true },
    select: {
      id: true,
      slug: true,
      labelFr: true,
      icon: true,
    },
    orderBy: [{ sortOrder: "asc" }, { labelFr: "asc" }],
  });
}

export type FilterableAmenity = Awaited<
  ReturnType<typeof listFilterableAmenities>
>[number];

export async function listPublicProperties(
  type: "CHALET" | "BUNGALOW",
  options: {
    minCapacity?: number;
    hasPrivatePool?: boolean;
    seaView?: boolean;
    beachfront?: boolean;
    minPriceMillimes?: number;
    maxPriceMillimes?: number;
    /** ISO `yyyy-MM-dd` — both must be set to take effect. */
    checkIn?: string;
    checkOut?: string;
    /** Amenity slugs that must ALL be present on the property. */
    amenitySlugs?: string[];
  } = {},
) {
  const priceFilter: { gte?: number; lte?: number } = {};
  if (options.minPriceMillimes) priceFilter.gte = options.minPriceMillimes;
  if (options.maxPriceMillimes) priceFilter.lte = options.maxPriceMillimes;
  const hasPriceFilter =
    priceFilter.gte !== undefined || priceFilter.lte !== undefined;

  let unavailableIds: Set<string> | null = null;
  if (options.checkIn && options.checkOut) {
    const ci = new Date(`${options.checkIn}T00:00:00`);
    const co = new Date(`${options.checkOut}T00:00:00`);
    if (co > ci) {
      unavailableIds = await findUnavailablePropertyIds(ci, co);
    }
  }

  return prisma.property.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      type,
      ...(options.minCapacity
        ? { capacity: { gte: options.minCapacity } }
        : {}),
      ...(typeof options.hasPrivatePool === "boolean"
        ? { hasPrivatePool: options.hasPrivatePool }
        : {}),
      ...(typeof options.seaView === "boolean"
        ? { seaView: options.seaView }
        : {}),
      ...(typeof options.beachfront === "boolean"
        ? { beachfront: options.beachfront }
        : {}),
      ...(hasPriceFilter ? { basePrice: priceFilter } : {}),
      ...(unavailableIds && unavailableIds.size > 0
        ? { id: { notIn: Array.from(unavailableIds) } }
        : {}),
      ...(options.amenitySlugs && options.amenitySlugs.length > 0
        ? {
            AND: options.amenitySlugs.map((slug) => ({
              amenities: { some: { amenity: { slug } } },
            })),
          }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      capacity: true,
      bedrooms: true,
      bathrooms: true,
      basePrice: true,
      cleaningFee: true,
      hasPrivatePool: true,
      seaView: true,
      beachfront: true,
      descriptionFr: true,
      photos: {
        orderBy: { order: "asc" },
        take: 3,
        select: { url: true, alt: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export type PublicPropertyCard = Awaited<
  ReturnType<typeof listPublicProperties>
>[number];

/**
 * Full property profile for the public detail page. Returns null if the
 * property is missing, soft-deleted, or inactive.
 */
export async function findPublicProperty(slug: string) {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { order: "asc" } },
      amenities: {
        include: {
          amenity: {
            select: {
              slug: true,
              labelFr: true,
              labelEn: true,
              labelAr: true,
              icon: true,
              category: true,
            },
          },
        },
      },
    },
  });
  if (!property || property.deletedAt || property.status !== "ACTIVE") {
    return null;
  }
  return property;
}

export type PublicPropertyDetail = NonNullable<
  Awaited<ReturnType<typeof findPublicProperty>>
>;

/**
 * Payments listing for /admin/payments — paginated, filtered by date
 * range and optional method/status. Returns the rows + per-method totals
 * for the same window.
 */
export async function listPaymentsForRange(opts: {
  start: Date;
  end: Date;
  method?: import("@prisma/client").PaymentMethod;
  status?: import("@prisma/client").PaymentStatus;
  query?: string;
}) {
  const where: import("@prisma/client").Prisma.PaymentWhereInput = {
    receivedAt: { gte: opts.start, lt: opts.end },
    ...(opts.method ? { method: opts.method } : {}),
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.query
      ? {
          OR: [
            {
              reservation: {
                code: { contains: opts.query, mode: "insensitive" },
              },
            },
            { reservation: { guest: { phone: { contains: opts.query } } } },
            {
              reservation: {
                guest: {
                  lastName: { contains: opts.query, mode: "insensitive" },
                },
              },
            },
            {
              reservation: {
                guest: {
                  firstName: { contains: opts.query, mode: "insensitive" },
                },
              },
            },
            { reference: { contains: opts.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [payments, totalsRaw] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      take: 200,
      include: {
        receivedBy: { select: { id: true, name: true } },
        reservation: {
          select: {
            id: true,
            code: true,
            property: { select: { name: true } },
            guest: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    }),
    prisma.payment.groupBy({
      by: ["method", "status"],
      where: { receivedAt: { gte: opts.start, lt: opts.end } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  return { payments, totals: totalsRaw };
}

export type PaymentRow = Awaited<
  ReturnType<typeof listPaymentsForRange>
>["payments"][number];

/**
 * Last N audit-log rows for a single reservation, newest first. Used by
 * the calendar drawer's "Activité" timeline.
 */
export async function listReservationAuditLog(
  reservationId: string,
  limit = 10,
) {
  return prisma.auditLog.findMany({
    where: { entity: "Reservation", entityId: reservationId },
    orderBy: { timestamp: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });
}

export type ReservationAuditEntry = Awaited<
  ReturnType<typeof listReservationAuditLog>
>[number];

/**
 * Drawer payload for the calendar timeline. Returns the reservation with
 * its guest, property, photos (for the drawer header), and recent audit
 * trail. Returns null if missing or soft-deleted.
 */
export async function findReservationForDrawer(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      guest: true,
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          capacity: true,
          beachfront: true,
          seaView: true,
          hasPrivatePool: true,
          photos: {
            orderBy: { order: "asc" },
            take: 1,
            select: { url: true, alt: true },
          },
        },
      },
    },
  });
  if (!reservation || reservation.deletedAt) return null;
  const audit = await listReservationAuditLog(reservation.id, 10);
  return { reservation, audit };
}

export type DrawerReservation = NonNullable<
  Awaited<ReturnType<typeof findReservationForDrawer>>
>;

// =============================================================================
// ADMIN — /admin/reservations listing
// =============================================================================

/**
 * Filters available on the /admin/reservations chip row. Maps 1:1 with
 * the `?filter=` query parameter.
 */
export type ReservationListFilter =
  | "all"
  | "confirmed"
  | "option"
  | "checkin_today"
  | "checkout_today"
  | "upcoming"
  | "completed"
  | "cancelled"
  | "unpaid"
  | "deposit";

export interface ListReservationsOptions {
  filter?: ReservationListFilter;
  /** Substring match across code, guest name and phone. */
  search?: string;
  source?: ReservationSource;
  page?: number;
  /** Defaults to 25. */
  perPage?: number;
}

/**
 * Returns the [start, end) interval in UTC corresponding to "today" in the
 * Africa/Tunis timezone. Used by the chip filters that key on the wall
 * calendar (e.g. arrivals today).
 */
function todayBoundsUtc(): { start: Date; end: Date } {
  const nowZoned = toZonedTime(new Date(), TZ);
  const wallStart = startOfDay(nowZoned);
  const start = fromZonedTime(wallStart, TZ);
  const end = addDays(start, 1);
  return { start, end };
}

function whereForFilter(
  filter: ReservationListFilter,
): Prisma.ReservationWhereInput {
  const base: Prisma.ReservationWhereInput = { deletedAt: null };
  const { start: todayStart, end: todayEnd } = todayBoundsUtc();

  switch (filter) {
    case "confirmed":
      return { ...base, status: "CONFIRMED" };
    case "option":
      return { ...base, status: "PENDING" };
    case "checkin_today":
      return {
        ...base,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkIn: { gte: todayStart, lt: todayEnd },
      };
    case "checkout_today":
      return {
        ...base,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkOut: { gte: todayStart, lt: todayEnd },
      };
    case "upcoming":
      return {
        ...base,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkIn: { gte: todayEnd },
      };
    case "completed":
      return { ...base, status: "CHECKED_OUT" };
    case "cancelled":
      return { ...base, status: { in: ["CANCELLED", "NO_SHOW"] } };
    case "unpaid":
      return {
        ...base,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        paidAmount: { lte: 0 },
      };
    case "deposit":
      // Acompte = something paid, but strictly less than total.
      return {
        ...base,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        AND: [
          { paidAmount: { gt: 0 } },
          // Using a raw column reference for paidAmount < total — Prisma
          // doesn't expose `lt` against another column, so we leave the
          // strict-less check to a final in-memory filter on the page; here
          // we just narrow the candidate set.
        ],
      };
    case "all":
    default:
      return base;
  }
}

/**
 * Paginated listing for the /admin/reservations table. Returns the rows
 * plus the total count for the filtered set so the pagination component
 * can render N pages.
 */
export async function listReservations(opts: ListReservationsOptions = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.max(1, Math.min(100, opts.perPage ?? 25));
  const filter = opts.filter ?? "all";

  const filterWhere = whereForFilter(filter);
  const searchTerm = opts.search?.trim();

  const where: Prisma.ReservationWhereInput = {
    ...filterWhere,
    ...(opts.source ? { source: opts.source } : {}),
    ...(searchTerm
      ? {
          OR: [
            { code: { contains: searchTerm, mode: "insensitive" } },
            {
              guest: {
                firstName: { contains: searchTerm, mode: "insensitive" },
              },
            },
            {
              guest: {
                lastName: { contains: searchTerm, mode: "insensitive" },
              },
            },
            { guest: { phone: { contains: searchTerm } } },
            { guest: { email: { contains: searchTerm, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        code: true,
        checkIn: true,
        checkOut: true,
        nights: true,
        adults: true,
        children: true,
        total: true,
        paidAmount: true,
        status: true,
        source: true,
        property: { select: { id: true, name: true } },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            country: true,
          },
        },
      },
    }),
  ]);

  // For the "deposit" filter we need paidAmount < total — Prisma can't
  // express column-vs-column directly. We over-fetch candidates (paid > 0)
  // and filter the final page in memory; for our 21-unit volume this is
  // perfectly fine.
  const filteredRows =
    filter === "deposit" ? rows.filter((r) => r.paidAmount < r.total) : rows;

  return { rows: filteredRows, total, page, perPage };
}

export type ReservationRow = Awaited<
  ReturnType<typeof listReservations>
>["rows"][number];

/**
 * KPI tuple shown in the /admin/reservations page-head subtitle:
 *   - total:    every non-deleted reservation
 *   - active:   not cancelled and currently within or ahead of check-out
 *   - newToday: created in the last 24h
 */
export async function getReservationsKpis() {
  const { start: todayStart, end: todayEnd } = todayBoundsUtc();
  const [total, active, newToday] = await Promise.all([
    prisma.reservation.count({ where: { deletedAt: null } }),
    prisma.reservation.count({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "NO_SHOW", "CHECKED_OUT"] },
        checkOut: { gte: todayStart },
      },
    }),
    prisma.reservation.count({
      where: {
        deletedAt: null,
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    }),
  ]);
  return { total, active, newToday };
}

/**
 * Per-filter counts for the chip row at the top of /admin/reservations.
 * One round-trip per chip — the table is on the same page so the small
 * fan-out is acceptable given Postgres can satisfy each `count(*)` from
 * the existing indexes.
 */
export async function getReservationsFilterCounts() {
  const filters: ReservationListFilter[] = [
    "all",
    "confirmed",
    "option",
    "checkin_today",
    "checkout_today",
    "upcoming",
    "completed",
    "cancelled",
    "unpaid",
    "deposit",
  ];

  const counts = await Promise.all(
    filters.map(async (f) => {
      const where = whereForFilter(f);
      // The deposit candidate set over-counts because we can't express
      // paidAmount < total in Prisma; the page-list query filters in
      // memory but for the chip count we accept the over-estimate.
      const c = await prisma.reservation.count({ where });
      return [f, c] as const;
    }),
  );

  return Object.fromEntries(counts) as Record<ReservationListFilter, number>;
}
