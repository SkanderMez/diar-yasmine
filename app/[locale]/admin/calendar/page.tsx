import { Download, Plus, RefreshCw } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import {
  listActiveProperties,
  listReservationsForCalendar,
} from "@/lib/queries";
import { TZ, parseLocalDate } from "@/lib/date";
import {
  CalendarClient,
  type SerializableTimelineReservation,
} from "@/components/admin/calendar/calendar-client";
import { channelKeyFromSource } from "@/components/admin/calendar/types";
import { Link } from "@/i18n/navigation";

const ALLOWED_DAYS = new Set([14, 30, 90]);
const DEFAULT_DAYS = 30;

/**
 * Returns the wall-clock first day of the given UTC instant's calendar
 * month in Africa/Tunis, then converts back to a UTC Date for storage.
 */
function firstOfMonthLocal(instant: Date): Date {
  const zoned = toZonedTime(instant, TZ);
  const y = zoned.getFullYear();
  const m = String(zoned.getMonth() + 1).padStart(2, "0");
  return parseLocalDate(`${y}-${m}-01`);
}

function monthKey(instant: Date): string {
  const zoned = toZonedTime(instant, TZ);
  const y = zoned.getFullYear();
  const m = String(zoned.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function addMonthsLocal(instant: Date, delta: number): Date {
  const zoned = toZonedTime(instant, TZ);
  const y = zoned.getFullYear();
  const m = zoned.getMonth();
  const ny = y + Math.floor((m + delta) / 12);
  const nm = (((m + delta) % 12) + 12) % 12;
  const ymd = `${ny}-${String(nm + 1).padStart(2, "0")}-01`;
  return parseLocalDate(ymd);
}

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string; days?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  // Anchor the timeline on the first day of the requested month (or today's).
  const today = new Date();
  const requestedMonth =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month)
      ? parseLocalDate(`${sp.month}-01`)
      : firstOfMonthLocal(today);

  const daysParam = Number(sp.days);
  const viewSize = ALLOWED_DAYS.has(daysParam) ? daysParam : DEFAULT_DAYS;

  const start = requestedMonth;
  const end = addDays(start, viewSize);
  const prevStart = addDays(start, -viewSize);

  const [
    propertiesRaw,
    reservationsRaw,
    photoRows,
    monthCount,
    prevMonthCount,
    monthBookedNights,
  ] = await Promise.all([
    listActiveProperties(),
    listReservationsForCalendar(start, end),
    prisma.photo.findMany({
      where: { order: 0 },
      select: { propertyId: true, url: true },
    }),
    prisma.reservation.count({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
    }),
    prisma.reservation.count({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkIn: { lt: start },
        checkOut: { gt: prevStart },
      },
    }),
    prisma.reservation.aggregate({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
      _sum: { nights: true },
    }),
  ]);

  const photoByProperty = new Map<string, string>();
  for (const p of photoRows) {
    photoByProperty.set(p.propertyId, p.url);
  }

  const properties = propertiesRaw.map((p) => {
    const metaLabel = p.beachfront
      ? "Front de mer"
      : p.seaView
        ? "Vue mer"
        : p.hasPrivatePool
          ? "Piscine"
          : p.type === "CHALET"
            ? "2e ligne"
            : "Jardin";
    return {
      ...p,
      photoUrl: photoByProperty.get(p.id) ?? null,
      metaLabel,
    };
  });

  // Build day cells (ISO strings; client re-hydrates to Date).
  const days: Date[] = Array.from({ length: viewSize }, (_, i) =>
    addDays(start, i),
  );
  const daysIso = days.map((d) => d.toISOString());

  // Today index relative to the window (in local TZ).
  const todayZoned = toZonedTime(today, TZ);
  const todayYmd = `${todayZoned.getFullYear()}-${String(
    todayZoned.getMonth() + 1,
  ).padStart(2, "0")}-${String(todayZoned.getDate()).padStart(2, "0")}`;
  const todayLocal = parseLocalDate(todayYmd);
  const startZoned = toZonedTime(start, TZ);
  const todayIdx = differenceInCalendarDays(
    toZonedTime(todayLocal, TZ),
    startZoned,
  );
  const todayIndex = todayIdx >= 0 && todayIdx < viewSize ? todayIdx : null;

  // Project each reservation onto the visible window.
  const reservations: SerializableTimelineReservation[] = reservationsRaw.map(
    (r) => {
      const rawStartOffset = differenceInCalendarDays(
        toZonedTime(r.checkIn, TZ),
        startZoned,
      );
      const rawEndOffset = differenceInCalendarDays(
        toZonedTime(r.checkOut, TZ),
        startZoned,
      );
      const clampedStart = Math.max(rawStartOffset, 0);
      const clampedEnd = Math.min(rawEndOffset, viewSize);
      const visibleNights = Math.max(clampedEnd - clampedStart, 1);
      return {
        id: r.id,
        code: r.code,
        propertyId: r.propertyId,
        checkIn: r.checkIn.toISOString(),
        checkOut: r.checkOut.toISOString(),
        nights: r.nights,
        adults: r.adults,
        children: r.children,
        status: r.status,
        source: r.source,
        total: r.total,
        paidAmount: r.paidAmount,
        guest: r.guest,
        startOffset: clampedStart,
        visibleNights,
        channel: channelKeyFromSource(r.source),
      };
    },
  );

  // Stats for the legend bar.
  const totalNights = monthBookedNights._sum.nights ?? 0;
  const capacity = propertiesRaw.length * viewSize;
  const occupancyPct =
    capacity > 0 ? Math.round((totalNights / capacity) * 100) : 0;
  const changePct =
    prevMonthCount === 0
      ? 0
      : Math.round(((monthCount - prevMonthCount) / prevMonthCount) * 100);
  const arrivalsToday = reservationsRaw.filter((r) => {
    const ciZoned = toZonedTime(r.checkIn, TZ);
    return (
      ciZoned.getFullYear() === todayZoned.getFullYear() &&
      ciZoned.getMonth() === todayZoned.getMonth() &&
      ciZoned.getDate() === todayZoned.getDate()
    );
  }).length;

  // Display label in French; the timezone offset for Africa/Tunis (UTC+1)
  // means parseLocalDate("2026-06-01") is 2026-05-31T23:00Z. Use the zoned
  // value so the label reflects the local month.
  const monthLabel = format(toZonedTime(start, TZ), "MMMM yyyy", {
    locale: fr,
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Calendrier des réservations</h1>
          <p>
            Vue d&apos;ensemble de l&apos;occupation des {properties.length}{" "}
            hébergements
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn-admin btn-admin-ghost">
            <Download className="size-3.5" />
            Export
          </button>
          <Link
            href="/admin/channels"
            className="btn-admin btn-admin-secondary"
          >
            <RefreshCw className="size-3.5" />
            Sync
          </Link>
          <Link
            href="/admin/reservations/new"
            className="btn-admin btn-admin-primary"
          >
            <Plus className="size-3.5" />
            Nouvelle résa
          </Link>
        </div>
      </div>

      <CalendarClient
        properties={properties}
        reservations={reservations}
        daysIso={daysIso}
        todayIndex={todayIndex}
        monthLabel={monthLabel}
        currentMonthIso={monthKey(start)}
        prevMonthIso={monthKey(addMonthsLocal(start, -1))}
        nextMonthIso={monthKey(addMonthsLocal(start, 1))}
        todayMonthIso={monthKey(today)}
        viewSize={viewSize}
        stats={{
          occupancyPct,
          activeCount: monthCount,
          arrivalsToday,
          changePct,
        }}
      />
    </>
  );
}
