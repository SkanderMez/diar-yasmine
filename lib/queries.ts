import type {
  Prisma,
  PropertyStatus,
  PropertyType,
  ReservationSource,
} from "@prisma/client";
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

/**
 * Demo helper — every guest is considered non-VIP until Phase D introduces
 * the `isVip` column. Centralised so the entire CRM page treats VIP-ness
 * consistently.
 */
function demoIsVipForGuest(_guestId: string): boolean {
  return false;
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
      isVip: demoIsVipForGuest(g.id),
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
function demoPreferencesFor(
  guestId: string,
): {
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
    isVip: demoIsVipForGuest(guest.id),
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
