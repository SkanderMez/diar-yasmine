import type {
  AuditLog as AuditLogModel,
  ChannelSyncStatus,
  ChannelType,
  Prisma,
  PropertyStatus,
  PropertyType,
  ReservationSource,
  ReservationStatus,
} from "@prisma/client";
import { prisma } from "./prisma";
import { findUnavailablePropertyIds } from "./availability";
import { TZ } from "./date";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfYear,
  getISOWeek,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfDay,
  startOfYear,
} from "date-fns";

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
 * PromoCode catalog — admin CRUD page.
 */
export async function listPromoCodes() {
  return prisma.promoCode.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { redemptions: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export type PromoCodeRow = Awaited<ReturnType<typeof listPromoCodes>>[number];

/**
 * Active supplements — fetched server-side and surfaced as preset chips
 * in the admin new-booking wizard + the public funnel.
 */
export async function listActiveSupplements() {
  return prisma.pricingSupplement.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { labelFr: "asc" }],
  });
}

export async function listAllSupplements() {
  return prisma.pricingSupplement.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { labelFr: "asc" }],
  });
}

export type SupplementRow = Awaited<
  ReturnType<typeof listAllSupplements>
>[number];

/**
 * GuestDocument list — used by the admin client detail. The actual file
 * bytes live in Supabase Storage; the UI mints a signed URL on click via
 * `getGuestDocumentSignedUrl`.
 */
export async function listGuestDocuments(guestId: string) {
  return prisma.guestDocument.findMany({
    where: { guestId },
    select: {
      id: true,
      kind: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
      docNumber: true,
      expiresAt: true,
      notes: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type GuestDocumentRow = Awaited<
  ReturnType<typeof listGuestDocuments>
>[number];

/**
 * InternalNote thread for a reservation OR a guest. Returns oldest-first
 * so the UI can render a normal top-down log.
 */
export async function listInternalNotesForReservation(reservationId: string) {
  return prisma.internalNote.findMany({
    where: { reservationId },
    select: {
      id: true,
      body: true,
      category: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type InternalNoteEntry = Awaited<
  ReturnType<typeof listInternalNotesForReservation>
>[number];

export async function listInternalNotesForGuest(guestId: string) {
  return prisma.internalNote.findMany({
    where: { guestId },
    select: {
      id: true,
      body: true,
      category: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Reviews queries — used by the admin moderation queue and the public
 * property fiche. Published reviews surface on /chalets/[slug] and
 * /bungalows/[slug]; PENDING land in /admin/reviews.
 */
export async function listReviewsForModeration(
  status: "PENDING" | "PUBLISHED" | "REJECTED" | "ALL" = "PENDING",
) {
  return prisma.review.findMany({
    where: status === "ALL" ? {} : { status },
    select: {
      id: true,
      rating: true,
      comment: true,
      locale: true,
      source: true,
      status: true,
      hostReply: true,
      hostReplyAt: true,
      publishedAt: true,
      createdAt: true,
      property: { select: { id: true, name: true, type: true, slug: true } },
      guest: { select: { firstName: true, lastName: true, country: true } },
      reservation: { select: { code: true, checkIn: true, checkOut: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export type ReviewModerationRow = Awaited<
  ReturnType<typeof listReviewsForModeration>
>[number];

export async function listPublishedReviewsForProperty(
  propertyId: string,
  limit = 6,
) {
  return prisma.review.findMany({
    where: { propertyId, status: "PUBLISHED" },
    select: {
      id: true,
      rating: true,
      comment: true,
      locale: true,
      source: true,
      publishedAt: true,
      hostReply: true,
      hostReplyAt: true,
      guest: { select: { firstName: true, country: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export type PublishedReview = Awaited<
  ReturnType<typeof listPublishedReviewsForProperty>
>[number];

export async function getPropertyRatingSummary(propertyId: string) {
  const result = await prisma.review.aggregate({
    where: { propertyId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  if (!result._count._all) return null;
  return {
    avg: Number(result._avg.rating ?? 0),
    count: result._count._all,
  };
}

/**
 * Listing query for the public site (/chalets, /bungalows). Returns
 * active properties of the requested type plus their first 3 photos
 * for the card. Sorted by name.
 */
/**
 * Returns the cheapest + most expensive nightly rate (in millimes) across
 * the active catalog. Pass `type` to scope to chalets or bungalows; omit
 * it for the unified ("Tous les hébergements") search page. Returns null
 * when no properties exist yet.
 */
export async function getPropertyPriceRange(
  type?: "CHALET" | "BUNGALOW",
): Promise<{ min: number; max: number } | null> {
  const result = await prisma.property.aggregate({
    where: { deletedAt: null, status: "ACTIVE", ...(type ? { type } : {}) },
    _min: { basePrice: true },
    _max: { basePrice: true },
  });
  if (result._min.basePrice === null || result._max.basePrice === null) {
    return null;
  }
  return {
    min: result._min.basePrice,
    max: result._max.basePrice,
  };
}

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

export type PublicPropertySort =
  | "recommended"
  | "price-asc"
  | "price-desc"
  | "capacity";

export async function listPublicProperties(
  /** Property type to filter on, or omit/`null` for the unified search. */
  type: "CHALET" | "BUNGALOW" | null,
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
    /** Sort order — default `recommended` (chalets first, then name). */
    sort?: PublicPropertySort;
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

  const orderBy: Prisma.PropertyOrderByWithRelationInput[] = (() => {
    switch (options.sort) {
      case "price-asc":
        return [{ basePrice: "asc" }, { name: "asc" }];
      case "price-desc":
        return [{ basePrice: "desc" }, { name: "asc" }];
      case "capacity":
        return [{ capacity: "desc" }, { name: "asc" }];
      default:
        // "recommended": chalets before bungalows when type is null,
        // then alphabetical.
        return type ? [{ name: "asc" }] : [{ type: "asc" }, { name: "asc" }];
    }
  })();

  return prisma.property.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      ...(type ? { type } : {}),
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
    orderBy,
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

// =============================================================================
// ADMIN — /admin/properties (Unités) inventory grid
// =============================================================================

export type AdminUnitCardEvent =
  | { kind: "available" }
  | { kind: "checkin"; guestName: string; date: Date }
  | { kind: "checkout"; guestName: string; date: Date }
  | { kind: "maintenance" };

export interface AdminUnitCard {
  id: string;
  slug: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  capacity: number;
  bedrooms: number;
  sizeM2: number | null;
  hasPrivatePool: boolean;
  seaView: boolean;
  beachfront: boolean;
  basePrice: number;
  photo: { url: string; alt: string | null } | null;
  nextEvent: AdminUnitCardEvent;
  occupancyPct: number;
  demoRating: { value: number; count: number };
}

/**
 * Deterministic demo rating derived from the property id. Real reviews land
 * in Phase D — until then this gives every card a stable, plausible value
 * so the inventory grid isn't visually empty.
 */
function demoRatingFor(id: string): { value: number; count: number } {
  let charCodeSum = 0;
  for (let i = 0; i < id.length; i++) {
    charCodeSum += id.charCodeAt(i);
  }
  // 4.7 .. 5.1 → clamp to 4.7..4.9 effective range (4.7 + 0..0.4 / step 0.1).
  const value = Number((4.7 + (charCodeSum % 5) / 10).toFixed(1));
  // 18..117 stable count.
  const count = 18 + (charCodeSum % 100);
  return { value, count };
}

/**
 * Inventory grid feed for /admin/properties. Returns one record per active
 * (non-deleted) property, sorted chalets-first then alphabetical, with the
 * data the unit card needs:
 *   - first photo for the cover (order asc, take 1)
 *   - "next event" derived from current/next reservation OR maintenance
 *   - last-30-days occupancy (nights booked / 30, rounded)
 *   - deterministic demo rating until Phase D wires real reviews
 */
export async function listAdminPropertyCards(): Promise<AdminUnitCard[]> {
  const now = new Date();
  const thirtyDaysAgo = addDays(now, -30);

  const properties = await prisma.property.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      status: true,
      capacity: true,
      bedrooms: true,
      sizeM2: true,
      hasPrivatePool: true,
      seaView: true,
      beachfront: true,
      basePrice: true,
      photos: {
        orderBy: { order: "asc" },
        take: 1,
        select: { url: true, alt: true },
      },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  // Fetch in parallel per property: current reservation, next reservation,
  // and last-30-days reservations (for occupancy). The 21-unit volume keeps
  // the fan-out cheap.
  const enriched = await Promise.all(
    properties.map(async (p) => {
      const [current, upcoming, last30] = await Promise.all([
        prisma.reservation.findFirst({
          where: {
            propertyId: p.id,
            deletedAt: null,
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            checkIn: { lte: now },
            checkOut: { gt: now },
          },
          select: {
            checkOut: true,
            guest: { select: { firstName: true, lastName: true } },
          },
          orderBy: { checkIn: "desc" },
        }),
        prisma.reservation.findFirst({
          where: {
            propertyId: p.id,
            deletedAt: null,
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            checkIn: { gt: now },
          },
          select: {
            checkIn: true,
            guest: { select: { firstName: true, lastName: true } },
          },
          orderBy: { checkIn: "asc" },
        }),
        prisma.reservation.findMany({
          where: {
            propertyId: p.id,
            deletedAt: null,
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            checkIn: { lt: now },
            checkOut: { gt: thirtyDaysAgo },
          },
          select: { checkIn: true, checkOut: true },
        }),
      ]);

      const nextEvent: AdminUnitCardEvent =
        p.status === "MAINTENANCE"
          ? { kind: "maintenance" }
          : current
            ? {
                kind: "checkout",
                guestName: `${current.guest.firstName} ${current.guest.lastName.charAt(0)}.`,
                date: current.checkOut,
              }
            : upcoming
              ? {
                  kind: "checkin",
                  guestName: `${upcoming.guest.firstName} ${upcoming.guest.lastName.charAt(0)}.`,
                  date: upcoming.checkIn,
                }
              : { kind: "available" };

      // Clamp each reservation to the [thirtyDaysAgo, now] window before
      // summing nights so a long stay overlapping the boundary doesn't
      // overcount.
      let nights = 0;
      for (const r of last30) {
        const start = r.checkIn < thirtyDaysAgo ? thirtyDaysAgo : r.checkIn;
        const end = r.checkOut > now ? now : r.checkOut;
        if (end > start) {
          nights += Math.round(
            (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
          );
        }
      }
      const occupancyPct = Math.max(
        0,
        Math.min(100, Math.round((nights / 30) * 100)),
      );

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        type: p.type,
        status: p.status,
        capacity: p.capacity,
        bedrooms: p.bedrooms,
        sizeM2: p.sizeM2,
        hasPrivatePool: p.hasPrivatePool,
        seaView: p.seaView,
        beachfront: p.beachfront,
        basePrice: p.basePrice,
        photo: p.photos[0] ?? null,
        nextEvent,
        occupancyPct,
        demoRating: demoRatingFor(p.id),
      } satisfies AdminUnitCard;
    }),
  );

  return enriched;
}

// =============================================================================
// ADMIN — /admin/clients CRM (Guest master-detail)
// =============================================================================

export type ClientSegment = "all" | "vip" | "recurrent" | "recent";

export interface ClientListItem {
  id: string;
  firstName: string;
  lastName: string;
  country: string | null;
  isVip: boolean;
  tags: string[];
  staysCount: number;
  /**
   * Free-form short subtitle line shown in the master list. Computed from
   * the guest's last stay (or fallback: created date for brand-new guests).
   */
  lastActivity: string;
}

export interface ClientListKpis {
  total: number;
  newCount: number;
  recurrentPct: number;
}

interface ListAdminClientsOpts {
  search?: string;
  segment?: ClientSegment;
}

function thirtyDaysAgoUtc(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 30);
  return d;
}

/**
 * Master-list query for /admin/clients. Returns up to 200 guests filtered
 * by `segment` and a free-form `search` term, plus the KPI tuple displayed
 * in the page-head subtitle.
 */
export async function listAdminClients(
  opts: ListAdminClientsOpts = {},
): Promise<{
  list: ClientListItem[];
  kpis: ClientListKpis;
}> {
  const search = opts.search?.trim();
  const segment: ClientSegment = opts.segment ?? "all";
  const since = thirtyDaysAgoUtc();

  const baseWhere: Prisma.GuestWhereInput = { deletedAt: null };
  const searchClause: Prisma.GuestWhereInput | undefined = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      }
    : undefined;

  const segmentClause: Prisma.GuestWhereInput =
    segment === "recent"
      ? { createdAt: { gte: since } }
      : segment === "recurrent"
        ? { reservations: { some: {} } } // narrowed in memory below
        : {};

  const where: Prisma.GuestWhereInput = {
    AND: [baseWhere, searchClause ?? {}, segmentClause],
  };

  const [guests, total, newCount, recurrentCount] = await Promise.all([
    prisma.guest.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { lastName: "asc" }],
      take: 200,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        country: true,
        createdAt: true,
        isVip: true,
        tags: true,
        reservations: {
          where: { deletedAt: null },
          orderBy: { checkIn: "desc" },
          take: 1,
          select: {
            checkIn: true,
            checkOut: true,
            property: { select: { name: true } },
          },
        },
        _count: {
          select: { reservations: { where: { deletedAt: null } } },
        },
      },
    }),
    prisma.guest.count({ where: baseWhere }),
    prisma.guest.count({
      where: { ...baseWhere, createdAt: { gte: since } },
    }),
    // Guests with 2+ reservations (recurrent).
    prisma.guest
      .findMany({
        where: baseWhere,
        select: {
          id: true,
          _count: {
            select: { reservations: { where: { deletedAt: null } } },
          },
        },
      })
      .then((rows) => rows.filter((r) => r._count.reservations >= 2).length),
  ]);

  const tunisFmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
  const dayFmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });
  const todayMs = startOfDay(toZonedTime(new Date(), TZ)).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  let enriched: ClientListItem[] = guests.map((g) => {
    const last = g.reservations[0];
    let lastActivity: string;
    if (last) {
      const checkOutZ = toZonedTime(last.checkOut, TZ);
      const checkInZ = toZonedTime(last.checkIn, TZ);
      const checkOutDay = startOfDay(checkOutZ).getTime();
      const checkInDay = startOfDay(checkInZ).getTime();
      if (checkInDay > todayMs) {
        lastActivity = `À venir · ${dayFmt.format(last.checkIn)}`;
      } else if (checkOutDay >= todayMs && checkInDay <= todayMs) {
        lastActivity = `En séjour · ${last.property.name}`;
      } else {
        lastActivity = `Dernier séjour : ${last.property.name} · ${tunisFmt.format(last.checkOut)}`;
      }
    } else {
      const daysSince = Math.floor(
        (Date.now() - g.createdAt.getTime()) / oneDayMs,
      );
      lastActivity =
        daysSince <= 1
          ? "Nouveau · inscrit hier"
          : "Nouveau · pas encore de séjour";
    }
    return {
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      country: g.country,
      isVip: g.isVip,
      tags: g.tags,
      staysCount: g._count.reservations,
      lastActivity,
    };
  });

  if (segment === "recurrent") {
    enriched = enriched.filter((c) => c.staysCount >= 2);
  } else if (segment === "vip") {
    enriched = enriched.filter((c) => c.isVip);
  }

  const recurrentPct =
    total === 0 ? 0 : Math.round((recurrentCount / total) * 100);

  return {
    list: enriched,
    kpis: { total, newCount, recurrentPct },
  };
}

/**
 * Static demo preferences for the right-hand "Préférences" tile. Derived
 * deterministically from the guest id so each guest gets a stable set
 * until Phase D introduces the real `Guest.tags` column.
 */
function demoPreferencesFor(guestId: string): {
  icon: "home" | "eye" | "alert" | "baby" | "user" | "check";
  label: string;
}[] {
  const POOL: {
    icon: "home" | "eye" | "alert" | "baby" | "user" | "check";
    label: string;
  }[] = [
    { icon: "home", label: "Préfère les chalets pieds dans l'eau" },
    { icon: "eye", label: "Vue mer obligatoire" },
    { icon: "alert", label: "Allergie aux noisettes" },
    { icon: "baby", label: "Lit bébé disponible" },
    { icon: "user", label: "Voyage en couple ou famille" },
    { icon: "check", label: "Newsletter activée · Français" },
  ];
  // Cheap, stable shuffle keyed on the guest id.
  let h = 0;
  for (const c of guestId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const count = 4 + (h % 3); // 4, 5 or 6
  return POOL.slice(0, count);
}

export type ClientPreference = ReturnType<typeof demoPreferencesFor>[number];

export interface ClientStayHistory {
  id: string;
  code: string;
  propertyName: string;
  propertyType: PropertyType;
  photoUrl: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  total: number;
  status: import("@prisma/client").ReservationStatus;
  source: ReservationSource;
}

export interface ClientDocuments {
  hasIdDocument: boolean;
  invoicesCount: number;
  vouchersCount: number;
}

export interface ClientStats {
  staysCount: number;
  upcomingCount: number;
  totalSpent: number;
  avgBasket: number;
  avgRating: number;
  reviewsCount: number;
  isVip: boolean;
}

/**
 * Full client profile for the right-hand detail card. Returns `null` if
 * the guest is missing or soft-deleted.
 */
export async function findAdminClient(id: string) {
  const guest = await prisma.guest.findUnique({
    where: { id },
    include: {
      reservations: {
        where: { deletedAt: null },
        orderBy: { checkIn: "desc" },
        take: 6,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              photos: {
                orderBy: { order: "asc" },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
    },
  });
  if (!guest || guest.deletedAt) return null;

  // Aggregate stats across ALL reservations (not just the 6 we surface).
  const allRes = await prisma.reservation.findMany({
    where: { guestId: id, deletedAt: null },
    select: {
      id: true,
      paidAmount: true,
      total: true,
      checkIn: true,
      status: true,
    },
  });

  const now = new Date();
  const staysCount = allRes.length;
  const upcomingCount = allRes.filter(
    (r) =>
      r.checkIn > now && r.status !== "CANCELLED" && r.status !== "NO_SHOW",
  ).length;
  const totalSpent = allRes
    .filter((r) => r.status !== "CANCELLED" && r.status !== "NO_SHOW")
    .reduce((acc, r) => acc + r.paidAmount, 0);
  const avgBasket = staysCount > 0 ? Math.round(totalSpent / staysCount) : 0;

  const reservations: ClientStayHistory[] = guest.reservations.map((r) => ({
    id: r.id,
    code: r.code,
    propertyName: r.property.name,
    propertyType: r.property.type,
    photoUrl: r.property.photos[0]?.url ?? null,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    nights: r.nights,
    adults: r.adults,
    children: r.children,
    total: r.total,
    status: r.status,
    source: r.source,
  }));

  const stats: ClientStats = {
    staysCount,
    upcomingCount,
    totalSpent,
    avgBasket,
    avgRating: 4.8,
    reviewsCount: Math.max(0, staysCount - upcomingCount),
    isVip: guest.isVip,
  };

  const preferences = demoPreferencesFor(guest.id);

  const documents: ClientDocuments = {
    hasIdDocument: Boolean(guest.idDocument),
    invoicesCount: staysCount,
    vouchersCount: staysCount,
  };

  return { guest, reservations, stats, preferences, documents };
}

export type AdminClientDetail = NonNullable<
  Awaited<ReturnType<typeof findAdminClient>>
>;

// =============================================================================
// ADMIN — /admin/channels channel-manager page
// =============================================================================

/**
 * Synthetic channel key used by the admin Channels page. Includes a
 * pseudo "DIRECT" entry that aggregates every in-house reservation
 * source (DIRECT_WEB, WALK_IN, PHONE, PARTNER, OTHER) so the channel
 * grid can show the direct funnel as a peer of Booking/Airbnb/Expedia.
 */
export type AdminChannelKey = "DIRECT" | "BOOKING" | "AIRBNB" | "EXPEDIA";

export interface AdminChannelChip {
  unitName: string;
  state: "synced" | "conflict" | "revision";
}

export interface AdminChannelCard {
  key: AdminChannelKey;
  /** ChannelType-aligned value when the channel maps to a real ChannelSync row. */
  channelType: ChannelType | null;
  name: string;
  url: string;
  syncedCount: number;
  conflictCount: number;
  revisionCount: number;
  totalListings: number;
  reservations30d: number;
  revenue30dMillimes: number;
  /** Highest-priority sync status across this channel's listings. */
  status: ChannelSyncStatus | null;
  /** Most recent successful sync across this channel's listings. */
  lastSyncAt: Date | null;
  /** Per-listing chips for the channel card row. */
  chips: AdminChannelChip[];
}

/**
 * One row per source × source conflict on a given property/window. Used by
 * the conflicts banner at the top of /admin/channels.
 */
export interface AdminChannelConflict {
  id: string;
  propertyName: string;
  rangeLabel: string;
  primary: { guestLabel: string; source: ReservationSource; status: string };
  secondary: { guestLabel: string; source: ReservationSource; status: string };
  /** Bucket the UI uses to colour-code the row. */
  severity: "past" | "current" | "imminent" | "future";
  /** Negative for past, 0 for today, positive otherwise. */
  daysUntilStart: number;
}

export interface AdminChannelSyncLogEntry {
  id: string;
  timestamp: Date;
  /** Compact channel tag key — "direct" | "booking" | "airbnb" | "expedia" | "conflict". */
  channelKey: "direct" | "booking" | "airbnb" | "expedia" | "conflict";
  description: string;
  isDanger: boolean;
}

const DIRECT_SOURCES: ReservationSource[] = [
  "DIRECT_WEB",
  "WALK_IN",
  "PHONE",
  "PARTNER",
  "OTHER",
];

const CHANNEL_TO_SOURCE: Record<
  Exclude<AdminChannelKey, "DIRECT">,
  ReservationSource
> = {
  BOOKING: "BOOKING",
  AIRBNB: "AIRBNB",
  EXPEDIA: "EXPEDIA",
};

const CHANNEL_META: Record<
  AdminChannelKey,
  { name: string; url: string; channelType: ChannelType | null }
> = {
  DIRECT: {
    name: "Site direct",
    url: "diaryasmine.tn",
    channelType: null,
  },
  BOOKING: {
    name: "Booking.com",
    url: "diaryasmine-tazarka.booking.com",
    channelType: "BOOKING",
  },
  AIRBNB: {
    name: "Airbnb",
    url: "airbnb.com/h/diar-yasmine",
    channelType: "AIRBNB",
  },
  EXPEDIA: {
    name: "Expedia",
    url: "expedia.com/Diar-Yasmine-Tazarka",
    channelType: "EXPEDIA",
  },
};

/**
 * Returns one card payload per channel (Direct + the three configured OTAs).
 * Stats are computed in-process from the existing ChannelSync rows and the
 * last 30 days of reservations — kept here so the page is a single
 * round-trip.
 */
export async function listAdminChannels(): Promise<AdminChannelCard[]> {
  const now = new Date();
  const thirtyDaysAgo = addDays(now, -30);

  const [properties, syncs, recentReservations] = await Promise.all([
    prisma.property.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true, type: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.channelSync.findMany({
      select: {
        id: true,
        channel: true,
        propertyId: true,
        url: true,
        lastSyncAt: true,
        status: true,
      },
    }),
    prisma.reservation.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkIn: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        source: true,
        total: true,
      },
    }),
  ]);

  const totalProperties = properties.length;
  const propertyName = new Map(properties.map((p) => [p.id, p.name] as const));

  // Map: channel → propertyId → ChannelSync row
  const syncByChannel = new Map<
    ChannelType,
    Map<string, (typeof syncs)[number]>
  >();
  for (const s of syncs) {
    let inner = syncByChannel.get(s.channel);
    if (!inner) {
      inner = new Map();
      syncByChannel.set(s.channel, inner);
    }
    inner.set(s.propertyId, s);
  }

  // 30-day reservation/revenue per source
  const resCountBySource = new Map<ReservationSource, number>();
  const revenueBySource = new Map<ReservationSource, number>();
  for (const r of recentReservations) {
    resCountBySource.set(r.source, (resCountBySource.get(r.source) ?? 0) + 1);
    revenueBySource.set(
      r.source,
      (revenueBySource.get(r.source) ?? 0) + r.total,
    );
  }

  const directRes = DIRECT_SOURCES.reduce(
    (acc, s) => acc + (resCountBySource.get(s) ?? 0),
    0,
  );
  const directRevenue = DIRECT_SOURCES.reduce(
    (acc, s) => acc + (revenueBySource.get(s) ?? 0),
    0,
  );

  const cards: AdminChannelCard[] = (
    ["DIRECT", "BOOKING", "AIRBNB", "EXPEDIA"] as AdminChannelKey[]
  ).map((key) => {
    const meta = CHANNEL_META[key];

    if (key === "DIRECT") {
      // Direct is always on; every active property is "exposed" on the public
      // site, so there is no per-listing sync to inspect.
      const chips: AdminChannelChip[] = properties.map((p) => ({
        unitName: p.name,
        state: "synced",
      }));
      return {
        key,
        channelType: null,
        name: meta.name,
        url: meta.url,
        syncedCount: totalProperties,
        conflictCount: 0,
        revisionCount: 0,
        totalListings: totalProperties,
        reservations30d: directRes,
        revenue30dMillimes: directRevenue,
        status: null,
        lastSyncAt: null,
        chips,
      };
    }

    const channelType = meta.channelType as ChannelType;
    const inner = syncByChannel.get(channelType) ?? new Map();
    let synced = 0;
    let revision = 0;
    let conflict = 0;
    let worst: ChannelSyncStatus | null = null;
    let lastSyncAt: Date | null = null;
    const chips: AdminChannelChip[] = [];

    for (const property of properties) {
      const row = inner.get(property.id);
      let state: AdminChannelChip["state"] = "synced";
      if (!row || !row.url) {
        state = "revision";
        revision++;
      } else if (row.status === "ERROR") {
        state = "conflict";
        conflict++;
      } else {
        state = "synced";
        synced++;
      }
      if (row?.status === "ERROR") {
        worst = "ERROR";
      } else if (row?.status === "SYNCING" && worst !== "ERROR") {
        worst = "SYNCING";
      } else if (row?.status === "IDLE" && worst === null) {
        worst = "IDLE";
      }
      if (row?.lastSyncAt && (!lastSyncAt || row.lastSyncAt > lastSyncAt)) {
        lastSyncAt = row.lastSyncAt;
      }
      chips.push({ unitName: property.name, state });
    }

    const sourceKey = CHANNEL_TO_SOURCE[key];

    return {
      key,
      channelType,
      name: meta.name,
      url: meta.url,
      syncedCount: synced,
      conflictCount: conflict,
      revisionCount: revision,
      totalListings: totalProperties,
      reservations30d: resCountBySource.get(sourceKey) ?? 0,
      revenue30dMillimes: revenueBySource.get(sourceKey) ?? 0,
      status: worst,
      lastSyncAt,
      chips,
    };
  });

  // Mark units that hit a true double-booking conflict (overlap with another
  // source) as `conflict` regardless of their sync status.
  const conflicts = await detectChannelConflicts({ lookbackDays: 90 });
  if (conflicts.length > 0) {
    const conflictPropertyNames = new Set(conflicts.map((c) => c.propertyName));
    for (const card of cards) {
      for (const chip of card.chips) {
        if (
          conflictPropertyNames.has(chip.unitName) &&
          chip.state === "synced"
        ) {
          chip.state = "conflict";
          card.syncedCount = Math.max(0, card.syncedCount - 1);
          card.conflictCount += 1;
        }
      }
    }
  }

  // Suppress unused-var lints for the property-name map (kept for future
  // per-conflict labelling).
  void propertyName;

  return cards;
}

/**
 * Detect overlapping reservations from different sources on the same
 * property in the last `lookbackDays`. This is the canonical "double
 * booking" check the channel manager surfaces in the danger banner.
 *
 * Implementation: we scan reservations created since `lookbackDays` ago
 * and bucket them per property. Within each bucket we look for any pair
 * of rows whose `[checkIn, checkOut)` ranges overlap AND whose `source`
 * differs. The 21-unit volume keeps this comfortably linear.
 */
export async function detectChannelConflicts(
  opts: {
    /** How many days in the PAST to include. Future conflicts are always
     *  included (we don't want to miss a far-future double-booking). */
    lookbackDays?: number;
  } = {},
): Promise<AdminChannelConflict[]> {
  const lookback = opts.lookbackDays ?? 90;
  const now = new Date();
  const since = addDays(now, -lookback);

  // Pull every reservation whose stay window touches [since, +∞).
  // The previous OR clause was inclusive enough to catch most cases but
  // missed conflicts where neither bound landed inside the past window,
  // e.g. two distant-future Dec 2026 bookings on the same unit. The new
  // single bound on `checkOut >= since` is sufficient: a reservation can
  // only collide with another if it ends after `since`.
  const rows = await prisma.reservation.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      checkOut: { gte: since },
    },
    select: {
      id: true,
      propertyId: true,
      source: true,
      status: true,
      checkIn: true,
      checkOut: true,
      property: { select: { name: true } },
      guest: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ propertyId: "asc" }, { checkIn: "asc" }],
  });

  const byProperty = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byProperty.get(r.propertyId) ?? [];
    list.push(r);
    byProperty.set(r.propertyId, list);
  }

  const dayFmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });

  const conflicts: AdminChannelConflict[] = [];
  const seen = new Set<string>();

  // Sweep-line per property: rows are sorted by checkIn, so once a row's
  // checkOut < candidate.checkIn we can stop comparing it. Drops the
  // worst-case from O(n²) per property to O(n) when bookings are mostly
  // non-overlapping (the common case).
  for (const list of byProperty.values()) {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (!b) continue;
        if (b.checkIn >= a.checkOut) break;
        if (a.source === b.source) continue;
        const pairKey = [a.id, b.id].sort().join(":");
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);

        const start = a.checkIn < b.checkIn ? a.checkIn : b.checkIn;
        const end = a.checkOut > b.checkOut ? a.checkOut : b.checkOut;
        const daysUntilStart = Math.round(
          (start.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        const severity: AdminChannelConflict["severity"] =
          end < now
            ? "past"
            : start < now
              ? "current"
              : daysUntilStart <= 7
                ? "imminent"
                : "future";

        conflicts.push({
          id: pairKey,
          propertyName: a.property.name,
          rangeLabel: `${dayFmt.format(start)} → ${dayFmt.format(end)}`,
          severity,
          daysUntilStart,
          primary: {
            guestLabel: `${a.guest.firstName} ${a.guest.lastName}`,
            source: a.source,
            status: a.status,
          },
          secondary: {
            guestLabel: `${b.guest.firstName} ${b.guest.lastName}`,
            source: b.source,
            status: b.status,
          },
        });
      }
    }
  }

  // Sort: imminent first, then current, future, past. Within each tier
  // by daysUntilStart ascending — the most urgent issue lands at the top
  // of the admin banner.
  const order: Record<AdminChannelConflict["severity"], number> = {
    imminent: 0,
    current: 1,
    future: 2,
    past: 3,
  };
  conflicts.sort((a, b) => {
    const so = order[a.severity] - order[b.severity];
    if (so !== 0) return so;
    return a.daysUntilStart - b.daysUntilStart;
  });

  return conflicts;
}

/**
 * Returns the most recent channel-related audit log entries. Pulls rows
 * tagged on `ChannelSync` plus any `channel.*` reservation events
 * (imports, conflict detections, sync errors) so the log surfaces both
 * sync runs and their downstream side effects.
 */
export async function listChannelSyncLog(
  limit = 30,
): Promise<AdminChannelSyncLogEntry[]> {
  const rows = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entity: "ChannelSync" },
        { action: { startsWith: "channel." } },
        { action: { contains: "channel_sync" } },
        { action: "reservation.imported_from_channel" },
        { action: "reservation.cancelled_via_channel_sync" },
      ],
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return rows.map((r) => {
    const diff =
      r.diff && typeof r.diff === "object" && !Array.isArray(r.diff)
        ? (r.diff as Record<string, unknown>)
        : {};
    const rawChannel =
      typeof diff.channel === "string" ? diff.channel.toUpperCase() : undefined;

    let channelKey: AdminChannelSyncLogEntry["channelKey"] = "direct";
    if (rawChannel === "BOOKING") channelKey = "booking";
    else if (rawChannel === "AIRBNB") channelKey = "airbnb";
    else if (rawChannel === "EXPEDIA") channelKey = "expedia";

    let description = r.action;
    let isDanger = false;
    switch (r.action) {
      case "reservation.imported_from_channel": {
        const code =
          typeof diff.code === "string" ? diff.code : String(r.entityId);
        description = `Nouvelle réservation ${code} importée`;
        break;
      }
      case "reservation.cancelled_via_channel_sync": {
        const ext = typeof diff.externalId === "string" ? diff.externalId : "";
        description = `Réservation annulée (vanished upstream${ext ? ` · ${ext}` : ""})`;
        break;
      }
      case "channel.updated":
        description = "Configuration de canal mise à jour";
        break;
      case "channel.toggled":
        description =
          diff.enabled === true
            ? "Canal activé"
            : diff.enabled === false
              ? "Canal désactivé"
              : "Canal basculé";
        break;
      case "channel.sync_started":
        description = "Synchronisation manuelle déclenchée";
        break;
      case "channel.sync_completed": {
        const created = typeof diff.created === "number" ? diff.created : null;
        const updated = typeof diff.updated === "number" ? diff.updated : null;
        const cancelled =
          typeof diff.cancelled === "number" ? diff.cancelled : null;
        if (created != null && updated != null && cancelled != null) {
          description = `Calendrier synchronisé · ${created} créées, ${updated} mises à jour, ${cancelled} annulées`;
        } else {
          description = "Calendrier synchronisé";
        }
        break;
      }
      case "channel.sync_failed": {
        description =
          typeof diff.error === "string"
            ? `Erreur de synchronisation · ${diff.error}`
            : "Erreur de synchronisation";
        isDanger = true;
        break;
      }
      case "channel.conflict_detected": {
        const name =
          typeof diff.propertyName === "string" ? diff.propertyName : "";
        description = name
          ? `Conflit détecté · ${name}`
          : "Conflit de double réservation détecté";
        channelKey = "conflict";
        isDanger = true;
        break;
      }
      default:
        // Generic fallback for unknown channel.* actions.
        if (r.action.startsWith("channel.")) {
          description = r.action.replace(/^channel\./, "").replace(/_/g, " ");
        }
    }

    return {
      id: r.id,
      timestamp: r.timestamp,
      channelKey,
      description,
      isDanger,
    };
  });
}

// =============================================================================
// ADMIN — /admin/reports analytics dashboard
// =============================================================================

/**
 * Parse a `YYYY-MM` string into the UTC [start, end) range covering that
 * calendar month. Throws on malformed input so the page can fall back to
 * the current month deterministically.
 */
function parseMonthIso(monthIso: string): { start: Date; end: Date } {
  const match = /^([0-9]{4})-([0-9]{2})$/.exec(monthIso);
  if (!match) {
    throw new RangeError(`parseMonthIso: invalid month-iso "${monthIso}"`);
  }
  const yearStr = match[1];
  const monthStr = match[2];
  if (!yearStr || !monthStr) {
    throw new RangeError(`parseMonthIso: invalid month-iso "${monthIso}"`);
  }
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new RangeError(`parseMonthIso: invalid month-iso "${monthIso}"`);
  }
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

async function countActiveProperties(): Promise<number> {
  return prisma.property.count({
    where: { deletedAt: null, status: "ACTIVE" },
  });
}

interface MonthMetrics {
  revenue: number;
  occupiedNights: number;
  availableNights: number;
  adr: number;
  revpar: number;
}

/**
 * Compute revenue/occupancy/ADR/RevPAR for the `[start, end)` window.
 *
 * Stay revenue is attributed pro-rata to the days the stay falls in the
 * window (same definition as `lib/reports.ts`). Available nights = active
 * portfolio × days in the window.
 */
async function computeMonthMetrics(
  start: Date,
  end: Date,
  totalProperties: number,
): Promise<MonthMetrics> {
  const reservations = await prisma.reservation.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      checkIn: { lt: end },
      checkOut: { gt: start },
    },
    select: {
      checkIn: true,
      checkOut: true,
      total: true,
    },
  });

  let revenue = 0;
  let occupiedNights = 0;
  for (const r of reservations) {
    const totalStayDays = differenceInCalendarDays(r.checkOut, r.checkIn);
    if (totalStayDays <= 0) continue;
    const overlapStart = maxDate([r.checkIn, start]);
    const overlapEnd = minDate([r.checkOut, end]);
    const nights = Math.max(
      0,
      differenceInCalendarDays(overlapEnd, overlapStart),
    );
    if (nights <= 0) continue;
    const ratio = nights / totalStayDays;
    revenue += Math.round(r.total * ratio);
    occupiedNights += nights;
  }

  const windowDays = Math.max(0, differenceInCalendarDays(end, start));
  const availableNights = windowDays * totalProperties;
  const adr = occupiedNights > 0 ? Math.round(revenue / occupiedNights) : 0;
  const revpar =
    availableNights > 0 ? Math.round(revenue / availableNights) : 0;
  return { revenue, occupiedNights, availableNights, adr, revpar };
}

export interface AnalyticsKpiNumber {
  value: number;
  prevValue: number;
  deltaPct: number;
}

export interface AnalyticsKpiPct {
  pct: number;
  prevPct: number;
  deltaPts: number;
}

export interface AnalyticsKpis {
  revenue: AnalyticsKpiNumber;
  occupancy: AnalyticsKpiPct;
  adr: AnalyticsKpiNumber;
  revpar: AnalyticsKpiNumber;
}

function deltaPct(current: number, prev: number): number {
  if (prev <= 0) return 0;
  return ((current - prev) / prev) * 100;
}

export async function getAnalyticsKpis(
  monthIso: string,
): Promise<AnalyticsKpis> {
  const { start, end } = parseMonthIso(monthIso);
  const prevStart = addMonths(start, -1);
  const prevEnd = start;

  const [totalProperties, current, previous] = await Promise.all([
    countActiveProperties(),
    countActiveProperties().then((tp) => computeMonthMetrics(start, end, tp)),
    countActiveProperties().then((tp) =>
      computeMonthMetrics(prevStart, prevEnd, tp),
    ),
  ]);
  void totalProperties;

  const occPct =
    current.availableNights > 0
      ? (current.occupiedNights / current.availableNights) * 100
      : 0;
  const prevOccPct =
    previous.availableNights > 0
      ? (previous.occupiedNights / previous.availableNights) * 100
      : 0;

  return {
    revenue: {
      value: current.revenue,
      prevValue: previous.revenue,
      deltaPct: deltaPct(current.revenue, previous.revenue),
    },
    occupancy: {
      pct: occPct,
      prevPct: prevOccPct,
      deltaPts: occPct - prevOccPct,
    },
    adr: {
      value: current.adr,
      prevValue: previous.adr,
      deltaPct: deltaPct(current.adr, previous.adr),
    },
    revpar: {
      value: current.revpar,
      prevValue: previous.revpar,
      deltaPct: deltaPct(current.revpar, previous.revpar),
    },
  };
}

export interface RevenueMonthlyData {
  current: number[];
  previous: number[];
  currentYear: number;
  previousYear: number;
}

/**
 * Monthly revenue (millimes) for the given year and the year before, both
 * as 12-slot arrays Jan..Dec. Stays touching multiple months are split
 * pro-rata via the same logic as `computeMonthMetrics`.
 */
export async function getRevenueMonthly(
  year: number,
): Promise<RevenueMonthlyData> {
  const endCur = new Date(Date.UTC(year + 1, 0, 1));
  const startPrev = new Date(Date.UTC(year - 1, 0, 1));

  const reservations = await prisma.reservation.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      checkIn: { lt: endCur },
      checkOut: { gt: startPrev },
    },
    select: { checkIn: true, checkOut: true, total: true },
  });

  const current = new Array<number>(12).fill(0);
  const previous = new Array<number>(12).fill(0);

  for (const r of reservations) {
    const totalStayDays = differenceInCalendarDays(r.checkOut, r.checkIn);
    if (totalStayDays <= 0) continue;
    let cursor = new Date(
      Date.UTC(r.checkIn.getUTCFullYear(), r.checkIn.getUTCMonth(), 1),
    );
    while (cursor < r.checkOut) {
      const monthStart = cursor;
      const monthEnd = addMonths(monthStart, 1);
      const overlapStart = maxDate([monthStart, r.checkIn]);
      const overlapEnd = minDate([monthEnd, r.checkOut]);
      const nights = Math.max(
        0,
        differenceInCalendarDays(overlapEnd, overlapStart),
      );
      if (nights > 0) {
        const ratio = nights / totalStayDays;
        const share = Math.round(r.total * ratio);
        const y = monthStart.getUTCFullYear();
        const m = monthStart.getUTCMonth();
        if (y === year) {
          const cell = current[m];
          if (cell !== undefined) current[m] = cell + share;
        } else if (y === year - 1) {
          const cell = previous[m];
          if (cell !== undefined) previous[m] = cell + share;
        }
      }
      cursor = monthEnd;
    }
  }

  return { current, previous, currentYear: year, previousYear: year - 1 };
}

export type SourceSplitKey = "direct" | "booking" | "airbnb" | "expedia";

export interface SourceSplitRow {
  key: SourceSplitKey;
  label: string;
  count: number;
  pct: number;
}

const DIRECT_LIKE: ReservationSource[] = [
  "DIRECT_WEB",
  "WALK_IN",
  "PHONE",
  "PARTNER",
  "OTHER",
];

const SOURCE_LABEL: Record<SourceSplitKey, string> = {
  direct: "Direct",
  booking: "Booking",
  airbnb: "Airbnb",
  expedia: "Expedia",
};

export async function getSourceSplit(
  monthIso: string,
): Promise<{ rows: SourceSplitRow[]; totalCount: number }> {
  const { start, end } = parseMonthIso(monthIso);
  const reservations = await prisma.reservation.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      checkIn: { gte: start, lt: end },
    },
    select: { source: true },
  });

  const counts: Record<SourceSplitKey, number> = {
    direct: 0,
    booking: 0,
    airbnb: 0,
    expedia: 0,
  };
  for (const r of reservations) {
    if (r.source === "BOOKING") counts.booking += 1;
    else if (r.source === "AIRBNB") counts.airbnb += 1;
    else if (r.source === "EXPEDIA") counts.expedia += 1;
    else if (DIRECT_LIKE.includes(r.source)) counts.direct += 1;
  }

  const totalCount =
    counts.direct + counts.booking + counts.airbnb + counts.expedia;
  const order: SourceSplitKey[] = ["direct", "booking", "airbnb", "expedia"];
  const rows: SourceSplitRow[] = order.map((key) => ({
    key,
    label: SOURCE_LABEL[key],
    count: counts[key],
    pct: totalCount > 0 ? (counts[key] / totalCount) * 100 : 0,
  }));

  return { rows, totalCount };
}

export type HeatmapIntensity = 0 | 1 | 2 | 3 | 4 | 5 | "peak";

export interface HeatmapCell {
  /** ISO date YYYY-MM-DD (UTC). */
  date: string;
  /** 0..6 — 0=Mon..6=Sun. */
  weekday: number;
  /** 0..11 calendar month. */
  month: number;
  /** Number of properties occupied that day (0..21). */
  occupied: number;
  /** Bucketed intensity for the heatmap colour. */
  intensity: HeatmapIntensity;
}

function bucketIntensity(occupied: number): HeatmapIntensity {
  if (occupied <= 0) return 0;
  if (occupied <= 3) return 1;
  if (occupied <= 7) return 2;
  if (occupied <= 12) return 3;
  if (occupied <= 17) return 4;
  if (occupied <= 19) return 5;
  return "peak";
}

/**
 * Heatmap of daily occupied-property counts across the full year. Each
 * cell is a (UTC) day. Stays are counted via overlap with [day, day+1).
 */
export async function getYearHeatmap(year: number): Promise<HeatmapCell[]> {
  const start = startOfYear(new Date(Date.UTC(year, 0, 1)));
  const end = endOfYear(start);
  const lastDay = new Date(Date.UTC(year, 11, 31));

  const reservations = await prisma.reservation.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      checkIn: { lt: addDays(end, 1) },
      checkOut: { gt: start },
    },
    select: { checkIn: true, checkOut: true },
  });

  // Tally occupied-property nights per UTC day.
  const counts = new Map<string, number>();
  const oneDayMs = 24 * 60 * 60 * 1000;
  for (const r of reservations) {
    const cursorStart = r.checkIn < start ? start : r.checkIn;
    const cursorEnd =
      r.checkOut > addDays(lastDay, 1) ? addDays(lastDay, 1) : r.checkOut;
    let t = cursorStart.getTime();
    while (t < cursorEnd.getTime()) {
      const d = new Date(t);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      t += oneDayMs;
    }
  }

  const cells: HeatmapCell[] = [];
  let cursor = start;
  while (cursor <= lastDay) {
    const yy = cursor.getUTCFullYear();
    const mm = cursor.getUTCMonth();
    const dd = cursor.getUTCDate();
    const date = `${yy}-${String(mm + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    const jsWeekday = cursor.getUTCDay(); // 0=Sun..6=Sat
    const weekday = (jsWeekday + 6) % 7; // 0=Mon..6=Sun
    const occupied = counts.get(date) ?? 0;
    cells.push({
      date,
      weekday,
      month: mm,
      occupied,
      intensity: bucketIntensity(occupied),
    });
    cursor = addDays(cursor, 1);
  }
  return cells;
}

export interface TopUnitRow {
  id: string;
  slug: string;
  name: string;
  type: PropertyType;
  photoUrl: string | null;
  revenue: number;
  occupiedNights: number;
  availableNights: number;
}

export async function getTopUnits(
  monthIso: string,
  limit = 5,
): Promise<TopUnitRow[]> {
  const { start, end } = parseMonthIso(monthIso);
  const monthDays = differenceInCalendarDays(end, start);

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      photos: {
        orderBy: { order: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });

  const reservations = await prisma.reservation.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      checkIn: { lt: end },
      checkOut: { gt: start },
    },
    select: {
      checkIn: true,
      checkOut: true,
      total: true,
      propertyId: true,
    },
  });

  const stats = new Map<string, { revenue: number; occupiedNights: number }>();
  for (const r of reservations) {
    const totalStayDays = differenceInCalendarDays(r.checkOut, r.checkIn);
    if (totalStayDays <= 0) continue;
    const overlapStart = maxDate([r.checkIn, start]);
    const overlapEnd = minDate([r.checkOut, end]);
    const nights = Math.max(
      0,
      differenceInCalendarDays(overlapEnd, overlapStart),
    );
    if (nights <= 0) continue;
    const ratio = nights / totalStayDays;
    const share = Math.round(r.total * ratio);
    const cur = stats.get(r.propertyId) ?? { revenue: 0, occupiedNights: 0 };
    cur.revenue += share;
    cur.occupiedNights += nights;
    stats.set(r.propertyId, cur);
  }

  const rows: TopUnitRow[] = properties.map((p) => {
    const s = stats.get(p.id) ?? { revenue: 0, occupiedNights: 0 };
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      type: p.type,
      photoUrl: p.photos[0]?.url ?? null,
      revenue: s.revenue,
      occupiedNights: s.occupiedNights,
      availableNights: monthDays,
    };
  });

  rows.sort((a, b) => b.revenue - a.revenue);
  return rows.slice(0, limit);
}

export type StayBucket = "1" | "2" | "3" | "4" | "5" | "6" | "7+";

export interface LengthOfStayDistributionRow {
  bucket: StayBucket;
  count: number;
  pct: number;
}

export interface LengthOfStayResult {
  avgNights: number;
  distribution: LengthOfStayDistributionRow[];
}

export async function getLengthOfStayDistribution(
  monthIso: string,
): Promise<LengthOfStayResult> {
  const { start, end } = parseMonthIso(monthIso);
  const reservations = await prisma.reservation.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      checkIn: { gte: start, lt: end },
    },
    select: { nights: true },
  });

  const buckets: Record<StayBucket, number> = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    "6": 0,
    "7+": 0,
  };
  let sumNights = 0;
  for (const r of reservations) {
    sumNights += r.nights;
    if (r.nights <= 1) buckets["1"] += 1;
    else if (r.nights === 2) buckets["2"] += 1;
    else if (r.nights === 3) buckets["3"] += 1;
    else if (r.nights === 4) buckets["4"] += 1;
    else if (r.nights === 5) buckets["5"] += 1;
    else if (r.nights === 6) buckets["6"] += 1;
    else buckets["7+"] += 1;
  }

  const total = reservations.length;
  const order: StayBucket[] = ["1", "2", "3", "4", "5", "6", "7+"];
  const distribution: LengthOfStayDistributionRow[] = order.map((bucket) => ({
    bucket,
    count: buckets[bucket],
    pct: total > 0 ? (buckets[bucket] / total) * 100 : 0,
  }));

  const avgNights = total > 0 ? sumNights / total : 0;
  return { avgNights, distribution };
}

export interface GuestOriginRow {
  code: string;
  label: string;
  pct: number;
  count: number;
}

const COUNTRY_LABEL_FR: Record<string, string> = {
  TN: "Tunisie",
  FR: "France",
  DE: "Allemagne",
  GB: "Royaume-Uni",
  IT: "Italie",
  ES: "Espagne",
  BE: "Belgique",
  NL: "Pays-Bas",
  CH: "Suisse",
  US: "États-Unis",
  CA: "Canada",
  MA: "Maroc",
  DZ: "Algérie",
  LY: "Libye",
  EG: "Égypte",
};

function labelForCountry(code: string | null): string {
  if (!code) return "Inconnu";
  const upper = code.toUpperCase();
  return COUNTRY_LABEL_FR[upper] ?? upper;
}

export async function getGuestOriginSplit(
  monthIso: string,
): Promise<GuestOriginRow[]> {
  const { start, end } = parseMonthIso(monthIso);
  const reservations = await prisma.reservation.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      checkIn: { gte: start, lt: end },
    },
    select: { guest: { select: { country: true } } },
  });

  const counts = new Map<string, number>();
  for (const r of reservations) {
    const raw = r.guest.country?.trim().toUpperCase() ?? "";
    const code = raw.length > 0 ? raw : "OTHER";
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  const total = reservations.length;
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 5);
  const otherCount = sorted.slice(5).reduce((acc, [, n]) => acc + n, 0);

  const rows: GuestOriginRow[] = top.map(([code, count]) => ({
    code,
    label: code === "OTHER" ? "Autres" : labelForCountry(code),
    count,
    pct: total > 0 ? (count / total) * 100 : 0,
  }));

  if (otherCount > 0) {
    rows.push({
      code: "OTHER",
      label: "Autres",
      count: otherCount,
      pct: total > 0 ? (otherCount / total) * 100 : 0,
    });
  }

  return rows;
}

export interface NextMonthForecast {
  monthIso: string;
  monthLabel: string;
  projectedRevenue: number;
  projectedOccupancyPct: number;
  peakWeeks: number[];
  recommendation: string;
}

const FR_MONTHS_FULL = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export async function getNextMonthForecast(
  monthIso: string,
): Promise<NextMonthForecast> {
  const { start } = parseMonthIso(monthIso);
  const nextStart = addMonths(start, 1);
  const nextEnd = endOfMonth(nextStart);
  const exclusiveEnd = addDays(nextEnd, 1);

  const totalProperties = await countActiveProperties();
  const metrics = await computeMonthMetrics(
    nextStart,
    exclusiveEnd,
    totalProperties,
  );

  // Find peak ISO weeks (occupied >= 18 days across portfolio per day, i.e.
  // intensity 5 or peak in the heatmap bucketing).
  const reservations = await prisma.reservation.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      checkIn: { lt: exclusiveEnd },
      checkOut: { gt: nextStart },
    },
    select: { checkIn: true, checkOut: true },
  });

  const perDay = new Map<string, number>();
  const oneDayMs = 24 * 60 * 60 * 1000;
  for (const r of reservations) {
    const s = r.checkIn < nextStart ? nextStart : r.checkIn;
    const e = r.checkOut > exclusiveEnd ? exclusiveEnd : r.checkOut;
    for (let t = s.getTime(); t < e.getTime(); t += oneDayMs) {
      const d = new Date(t);
      const key = d.toISOString().slice(0, 10);
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }
  }

  const peakWeekSet = new Set<number>();
  for (const [iso, count] of perDay.entries()) {
    if (count >= 18) {
      const d = parseISO(`${iso}T00:00:00Z`);
      peakWeekSet.add(getISOWeek(d));
    }
  }
  const peakWeeks = Array.from(peakWeekSet).sort((a, b) => a - b);

  const nextMonthIso = `${nextStart.getUTCFullYear()}-${String(nextStart.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthLabel = `${FR_MONTHS_FULL[nextStart.getUTCMonth()] ?? ""} ${nextStart.getUTCFullYear()}`;

  // Pick the top-3 most-booked properties for the recommendation copy.
  const topNames = await prisma.reservation.groupBy({
    by: ["propertyId"],
    where: {
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      checkIn: { lt: exclusiveEnd },
      checkOut: { gt: nextStart },
    },
    _count: { _all: true },
    orderBy: { _count: { propertyId: "desc" } },
    take: 3,
  });
  const propIds = topNames.map((t) => t.propertyId);
  const props =
    propIds.length > 0
      ? await prisma.property.findMany({
          where: { id: { in: propIds } },
          select: { id: true, name: true },
        })
      : [];
  const orderedNames = propIds
    .map((id) => props.find((p) => p.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  const recommendation =
    orderedNames.length > 0
      ? `Augmenter les tarifs de +8% sur ${orderedNames.join(", ")} (déjà très bookés).`
      : "Activer une promotion ciblée pour stimuler la demande.";

  const projectedOccupancyPct =
    metrics.availableNights > 0
      ? (metrics.occupiedNights / metrics.availableNights) * 100
      : 0;

  return {
    monthIso: nextMonthIso,
    monthLabel,
    projectedRevenue: metrics.revenue,
    projectedOccupancyPct,
    peakWeeks,
    recommendation,
  };
}

export interface KpiSparklines {
  revenue: number[];
  occupancy: number[];
  adr: number[];
  revpar: number[];
}

/**
 * Trailing 12 months ending on the given month (inclusive). Each array is
 * 12 numbers, oldest → newest. Used for the sparkline under each KPI card.
 */
export async function getKpiSparklines(
  monthIso: string,
): Promise<KpiSparklines> {
  const { start } = parseMonthIso(monthIso);
  const totalProperties = await countActiveProperties();

  const months: { start: Date; end: Date }[] = [];
  for (let i = 11; i >= 0; i--) {
    const s = addMonths(start, -i);
    const e = addMonths(s, 1);
    months.push({ start: s, end: e });
  }

  const all = await Promise.all(
    months.map((m) => computeMonthMetrics(m.start, m.end, totalProperties)),
  );

  return {
    revenue: all.map((m) => m.revenue),
    occupancy: all.map((m) =>
      m.availableNights > 0 ? (m.occupiedNights / m.availableNights) * 100 : 0,
    ),
    adr: all.map((m) => m.adr),
    revpar: all.map((m) => m.revpar),
  };
}

// =============================================================================
// ADMIN — /admin/dashboard (Vue d'ensemble)
// =============================================================================

export interface DashboardArrival {
  id: string;
  code: string;
  guestFirstName: string;
  guestLastName: string;
  guestPhone: string;
  propertyId: string;
  propertyName: string;
  propertyType: PropertyType;
  propertyPhotoUrl: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  total: number;
  paidAmount: number;
  status: ReservationStatus;
  source: ReservationSource;
}

export type DashboardDeparture = DashboardArrival;

export interface DashboardKpis {
  /** Stays whose checkIn falls today (Africa/Tunis wall day). */
  checkinsToday: number;
  /** Stays whose checkOut falls today. */
  checkoutsToday: number;
  /**
   * Current occupancy at midnight today as `occupied / totalActiveProperties`.
   * 0..100, rounded to nearest integer.
   */
  occupancyPct: number;
  /**
   * Reservations that still owe a balance to the property (paidAmount < total)
   * and are not cancelled/no-show/checked-out.
   */
  pendingPayments: number;
}

export interface DashboardWeekDay {
  /** UTC instant for the day's midnight in Africa/Tunis. */
  date: Date;
  /** 0..100 — share of active properties occupied that night. */
  occupancyPct: number;
  /** Raw reservation count overlapping that night. */
  occupied: number;
}

export interface DashboardActivityEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: Date;
  userName: string | null;
  /** Pre-formatted, human-friendly label for the row. */
  label: string;
  /** Optional second line (e.g. reservation code or guest). */
  sublabel: string | null;
  /** Optional deep-link href (e.g. /admin/reservations/[code]). */
  href: string | null;
}

export interface DashboardData {
  todayStart: Date;
  todayEnd: Date;
  kpis: DashboardKpis;
  arrivals: DashboardArrival[];
  departures: DashboardDeparture[];
  week: DashboardWeekDay[];
  activity: DashboardActivityEntry[];
}

type AuditLogWithUser = Pick<
  AuditLogModel,
  "id" | "action" | "entity" | "entityId" | "timestamp"
> & {
  user: { name: string | null; email: string | null } | null;
};

const ACTION_LABELS: Record<string, string> = {
  "reservation.created": "Nouvelle réservation",
  "reservation.cancelled": "Réservation annulée",
  "reservation.status_changed": "Statut modifié",
  "payment.received": "Paiement encaissé",
  "payment.refunded": "Paiement remboursé",
  "guest.created": "Nouveau client",
  "guest.merged": "Clients fusionnés",
  "property.created": "Unité ajoutée",
  "property.updated": "Unité mise à jour",
  "property.soft_deleted": "Unité retirée",
  "property.photo_deleted": "Photo supprimée",
  "amenity.created": "Équipement ajouté",
  "amenity.updated": "Équipement mis à jour",
  "amenity.filterable_toggled": "Équipement (filtre) basculé",
  "amenity.deleted": "Équipement supprimé",
  "season.multiplier_updated": "Saison mise à jour",
  "pricing.supplements_updated": "Suppléments mis à jour",
  "pricing.min_stay_updated": "Séjour minimum mis à jour",
  "pricing.published": "Tarifs publiés",
  "settings.taxes_currency_updated": "Paramètres mis à jour",
};

function humanizeAction(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action
      .replace(/[_.]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim()
  );
}

/**
 * All-in-one dashboard payload. One `Promise.all` so the page is a single
 * server round-trip. Used by /admin/dashboard.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const { start: todayStart, end: todayEnd } = todayBoundsUtc();
  const weekEnd = addDays(todayStart, 7);

  const [
    totalProperties,
    todayArrivalsRows,
    todayDeparturesRows,
    currentlyOccupied,
    weekReservations,
    pendingPaymentRows,
    auditRows,
    reservationCodeMap,
  ] = await Promise.all([
    countActiveProperties(),
    prisma.reservation.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkIn: { gte: todayStart, lt: todayEnd },
      },
      select: dashboardReservationSelect,
      orderBy: [{ checkIn: "asc" }],
    }),
    prisma.reservation.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkOut: { gte: todayStart, lt: todayEnd },
      },
      select: dashboardReservationSelect,
      orderBy: [{ checkOut: "asc" }],
    }),
    prisma.reservation.count({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkIn: { lte: todayStart },
        checkOut: { gt: todayStart },
      },
    }),
    prisma.reservation.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkIn: { lt: weekEnd },
        checkOut: { gt: todayStart },
      },
      select: { checkIn: true, checkOut: true },
    }),
    // Pending payments: in-memory filter on paid < total because Prisma can't
    // express column-vs-column. 21 active units → small candidate set.
    prisma.reservation.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "NO_SHOW", "CHECKED_OUT"] },
      },
      select: { id: true, total: true, paidAmount: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 30,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        timestamp: true,
        user: { select: { name: true, email: true } },
      },
    }),
    // Pre-fetch every reservation code referenced by the last 30 audit rows
    // so we can deep-link the activity feed.
    prisma.reservation.findMany({
      where: { deletedAt: null },
      select: { id: true, code: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const pendingPaymentsExact = pendingPaymentRows.filter(
    (r) => r.paidAmount < r.total,
  ).length;

  // Week occupancy: count distinct stays overlapping each [day, day+1).
  const week: DashboardWeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = addDays(todayStart, i);
    const dayEnd = addDays(dayStart, 1);
    let occupied = 0;
    for (const r of weekReservations) {
      if (r.checkIn < dayEnd && r.checkOut > dayStart) occupied++;
    }
    const occupancyPct =
      totalProperties > 0 ? Math.round((occupied / totalProperties) * 100) : 0;
    week.push({ date: dayStart, occupancyPct, occupied });
  }

  // Today's occupancy KPI (same definition as week[0]).
  const occupancyPct =
    totalProperties > 0
      ? Math.round((currentlyOccupied / totalProperties) * 100)
      : 0;

  // Activity feed
  const codeById = new Map(reservationCodeMap.map((r) => [r.id, r.code]));
  const activity: DashboardActivityEntry[] = auditRows
    .slice(0, 10)
    .map((row: AuditLogWithUser) => {
      const userName = row.user?.name ?? row.user?.email ?? null;
      const label = humanizeAction(row.action);
      let sublabel: string | null = null;
      let href: string | null = null;
      if (row.entity === "Reservation") {
        const code = codeById.get(row.entityId);
        if (code) {
          sublabel = `#${code}`;
          href = `/admin/reservations/${code}`;
        }
      } else if (row.entity === "Payment") {
        sublabel = "Caisse";
        href = `/admin/payments`;
      } else if (row.entity === "Property") {
        sublabel = "Inventaire";
        href = `/admin/properties`;
      } else if (row.entity === "Guest") {
        sublabel = "Client";
        href = `/admin/clients`;
      } else if (row.entity === "Setting") {
        sublabel = "Paramètres";
        href = `/admin/settings`;
      }
      return {
        id: row.id,
        action: row.action,
        entity: row.entity,
        entityId: row.entityId,
        timestamp: row.timestamp,
        userName,
        label,
        sublabel,
        href,
      };
    });

  return {
    todayStart,
    todayEnd,
    kpis: {
      checkinsToday: todayArrivalsRows.length,
      checkoutsToday: todayDeparturesRows.length,
      occupancyPct,
      pendingPayments: pendingPaymentsExact,
    },
    arrivals: todayArrivalsRows.map(mapDashboardReservation),
    departures: todayDeparturesRows.map(mapDashboardReservation),
    week,
    activity,
  };
}

const dashboardReservationSelect = {
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
  guest: {
    select: { firstName: true, lastName: true, phone: true },
  },
  property: {
    select: {
      id: true,
      name: true,
      type: true,
      photos: {
        orderBy: { order: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  },
} satisfies Prisma.ReservationSelect;

type DashboardReservationRow = Prisma.ReservationGetPayload<{
  select: typeof dashboardReservationSelect;
}>;

function mapDashboardReservation(r: DashboardReservationRow): DashboardArrival {
  return {
    id: r.id,
    code: r.code,
    guestFirstName: r.guest.firstName,
    guestLastName: r.guest.lastName,
    guestPhone: r.guest.phone,
    propertyId: r.property.id,
    propertyName: r.property.name,
    propertyType: r.property.type,
    propertyPhotoUrl: r.property.photos[0]?.url ?? null,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    nights: r.nights,
    adults: r.adults,
    children: r.children,
    total: r.total,
    paidAmount: r.paidAmount,
    status: r.status,
    source: r.source,
  };
}
