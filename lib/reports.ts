import {
  addMonths,
  differenceInCalendarDays,
  format,
  max as maxDate,
  min as minDate,
  startOfMonth,
} from "date-fns";
import type { ReservationSource } from "@prisma/client";
import { prisma } from "./prisma";
import type { Millimes } from "./money";

/**
 * Phase 6 reporting — pure aggregation over the Reservation table.
 *
 * Definitions:
 *  - **Occupancy rate**: occupied nights / available nights, where
 *    "occupied" excludes CANCELLED and NO_SHOW, "available" = number of
 *    active properties × number of days in the window.
 *  - **ADR (Average Daily Rate)**: revenue / occupied nights.
 *  - **RevPAR**: revenue / available nights ≡ occupancy × ADR.
 *
 * Revenue is the SUM of `Reservation.total` (millimes) over reservations
 * whose stay touches the window. To keep math fair, we *attribute* a
 * reservation's revenue and nights pro-rata to the months it spans, so a
 * stay from 28 July to 3 August contributes to both July and August.
 */

interface MonthlyBucket {
  month: string; // YYYY-MM
  occupiedNights: number;
  availableNights: number;
  revenue: Millimes;
  occupancyRate: number; // 0..1
  adr: Millimes; // revenue / occupiedNights
  revpar: Millimes; // revenue / availableNights
  bySource: Partial<
    Record<ReservationSource, { nights: number; revenue: Millimes }>
  >;
}

export interface ReportData {
  start: Date;
  end: Date;
  totalProperties: number;
  monthly: MonthlyBucket[];
  totals: {
    occupiedNights: number;
    availableNights: number;
    revenue: Millimes;
    occupancyRate: number;
    adr: Millimes;
    revpar: Millimes;
    bySource: Partial<
      Record<ReservationSource, { nights: number; revenue: Millimes }>
    >;
  };
}

function monthKey(d: Date): string {
  return format(d, "yyyy-MM");
}

function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

export async function aggregateReportData(opts: {
  start: Date;
  end: Date;
}): Promise<ReportData> {
  const { start, end } = opts;

  // Count active properties as of "now" — Phase 6 simplification. Phase 6.5
  // can step through soft-delete history if the portfolio expands later.
  const totalProperties = await prisma.property.count({
    where: { deletedAt: null, status: "ACTIVE" },
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
      nights: true,
      total: true,
      source: true,
    },
  });

  // Bucket per YYYY-MM in [start, end).
  const buckets = new Map<string, MonthlyBucket>();
  let cursor = startOfMonth(start);
  while (cursor < end) {
    const key = monthKey(cursor);
    const monthStart = cursor;
    const monthEnd = addMonths(monthStart, 1);
    const windowedStart = maxDate([monthStart, start]);
    const windowedEnd = minDate([monthEnd, end]);
    const monthDays = Math.max(
      0,
      differenceInCalendarDays(windowedEnd, windowedStart),
    );
    buckets.set(key, {
      month: key,
      occupiedNights: 0,
      availableNights: monthDays * totalProperties,
      revenue: 0,
      occupancyRate: 0,
      adr: 0,
      revpar: 0,
      bySource: {},
    });
    cursor = monthEnd;
  }

  for (const r of reservations) {
    const stayStart = maxDate([r.checkIn, start]);
    const stayEnd = minDate([r.checkOut, end]);
    const totalStayDays = differenceInCalendarDays(r.checkOut, r.checkIn);
    if (totalStayDays <= 0) continue;

    let monthCursor = startOfMonth(stayStart);
    while (monthCursor < stayEnd) {
      const monthStart = monthCursor;
      const monthEnd = addMonths(monthStart, 1);
      const overlapStart = maxDate([monthStart, stayStart]);
      const overlapEnd = minDate([monthEnd, stayEnd]);
      const nightsInMonth = Math.max(
        0,
        differenceInCalendarDays(overlapEnd, overlapStart),
      );
      if (nightsInMonth > 0) {
        const key = monthKey(monthStart);
        const bucket = buckets.get(key);
        if (bucket) {
          const ratio = nightsInMonth / totalStayDays;
          const revenueShare = Math.round(r.total * ratio);
          bucket.occupiedNights += nightsInMonth;
          bucket.revenue += revenueShare;
          const sourceBucket = (bucket.bySource[r.source] ??= {
            nights: 0,
            revenue: 0,
          });
          sourceBucket.nights += nightsInMonth;
          sourceBucket.revenue += revenueShare;
        }
      }
      monthCursor = monthEnd;
    }
  }

  const monthly = Array.from(buckets.values()).map((b) => {
    b.occupancyRate =
      b.availableNights > 0 ? b.occupiedNights / b.availableNights : 0;
    b.adr = b.occupiedNights > 0 ? Math.round(b.revenue / b.occupiedNights) : 0;
    b.revpar =
      b.availableNights > 0 ? Math.round(b.revenue / b.availableNights) : 0;
    return b;
  });

  const totalOccupiedNights = monthly.reduce((s, b) => s + b.occupiedNights, 0);
  const totalAvailableNights = monthly.reduce(
    (s, b) => s + b.availableNights,
    0,
  );
  const totalRevenue = monthly.reduce((s, b) => s + b.revenue, 0);
  const totalsBySource: Partial<
    Record<ReservationSource, { nights: number; revenue: Millimes }>
  > = {};
  for (const b of monthly) {
    for (const [src, value] of Object.entries(b.bySource)) {
      const s = src as ReservationSource;
      const acc = (totalsBySource[s] ??= { nights: 0, revenue: 0 });
      acc.nights += value.nights;
      acc.revenue += value.revenue;
    }
  }

  return {
    start,
    end,
    totalProperties,
    monthly,
    totals: {
      occupiedNights: totalOccupiedNights,
      availableNights: totalAvailableNights,
      revenue: totalRevenue,
      occupancyRate:
        totalAvailableNights > 0
          ? totalOccupiedNights / totalAvailableNights
          : 0,
      adr:
        totalOccupiedNights > 0
          ? Math.round(totalRevenue / totalOccupiedNights)
          : 0,
      revpar:
        totalAvailableNights > 0
          ? Math.round(totalRevenue / totalAvailableNights)
          : 0,
      bySource: totalsBySource,
    },
  };
}

export { daysInMonth };
