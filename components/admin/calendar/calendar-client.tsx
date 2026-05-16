"use client";

import { useCallback, useMemo, useState } from "react";
import type { ActiveProperty } from "@/lib/queries";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarRange } from "lucide-react";
import { CalendarToolbar } from "./calendar-toolbar";
import {
  CalendarTimeline,
  type TimelineReservation,
} from "./calendar-timeline";
import { CalendarLegend } from "./calendar-legend";
import { ReservationDrawer } from "./reservation-drawer";
import { type ChannelKey } from "./types";

interface CalendarClientProps {
  properties: (ActiveProperty & {
    photoUrl?: string | null;
    metaLabel?: string;
  })[];
  /** Serializable view of reservations — Dates are ISO strings */
  reservations: SerializableTimelineReservation[];
  /** Day cells (ISO strings) for the visible window */
  daysIso: string[];
  todayIndex: number | null;
  monthLabel: string;
  currentMonthIso: string;
  prevMonthIso: string;
  nextMonthIso: string;
  todayMonthIso: string;
  viewSize: number;
  stats: {
    occupancyPct: number;
    activeCount: number;
    arrivalsToday: number;
    changePct: number;
  };
  /** Set when the current window is empty but a reservation exists in
   *  another month. The banner offers a one-click jump so the admin
   *  never wonders "où sont mes réservations". */
  jumpToReservation?: {
    monthIso: string;
    label: string;
    isPast: boolean;
  } | null;
}

export interface SerializableTimelineReservation {
  id: string;
  code: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  status: TimelineReservation["status"];
  source: TimelineReservation["source"];
  total: number;
  paidAmount: number;
  guest: { id: string; firstName: string; lastName: string; phone: string };
  startOffset: number;
  visibleNights: number;
  channel: ChannelKey;
}

export function CalendarClient({
  properties,
  reservations,
  daysIso,
  todayIndex,
  monthLabel,
  currentMonthIso,
  prevMonthIso,
  nextMonthIso,
  todayMonthIso,
  viewSize,
  stats,
  jumpToReservation,
}: CalendarClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<Set<ChannelKey>>(
    new Set(),
  );
  const [search, setSearch] = useState("");

  const days = useMemo(() => daysIso.map((iso) => new Date(iso)), [daysIso]);

  const timelineReservations = useMemo<TimelineReservation[]>(
    () =>
      reservations.map((r) => ({
        id: r.id,
        code: r.code,
        propertyId: r.propertyId,
        checkIn: new Date(r.checkIn),
        checkOut: new Date(r.checkOut),
        nights: r.nights,
        adults: r.adults,
        children: r.children,
        status: r.status,
        source: r.source,
        total: r.total,
        paidAmount: r.paidAmount,
        guest: r.guest,
        startOffset: r.startOffset,
        visibleNights: r.visibleNights,
        channel: r.channel,
      })),
    [reservations],
  );

  const handleChannelToggle = useCallback((key: ChannelKey | null) => {
    setChannelFilter((prev) => {
      if (key === null) return new Set();
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <>
      <CalendarToolbar
        monthLabel={monthLabel}
        prevMonthIso={prevMonthIso}
        nextMonthIso={nextMonthIso}
        currentMonthIso={currentMonthIso}
        todayMonthIso={todayMonthIso}
        viewSize={viewSize}
        channelFilter={channelFilter}
        onChannelToggle={handleChannelToggle}
        search={search}
        onSearchChange={setSearch}
      />

      {jumpToReservation && reservations.length === 0 && (
        <CalendarJumpBanner
          monthIso={jumpToReservation.monthIso}
          label={jumpToReservation.label}
          isPast={jumpToReservation.isPast}
        />
      )}

      <CalendarTimeline
        properties={properties}
        days={days}
        reservations={timelineReservations}
        todayIndex={todayIndex}
        channelFilter={channelFilter}
        searchQuery={search}
        onReservationClick={setSelectedId}
      />

      <CalendarLegend stats={stats} />

      <ReservationDrawer
        reservationId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

function CalendarJumpBanner({
  monthIso,
  label,
  isPast,
}: {
  monthIso: string;
  label: string;
  isPast: boolean;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/admin/calendar?month=${monthIso}`)}
      className="calendar-jump-banner"
    >
      <CalendarRange className="size-4" aria-hidden />
      <span>
        {isPast ? "Réservation la plus récente" : "Prochaine réservation"} en{" "}
        <strong>{label}</strong>
      </span>
      <ArrowRight className="size-3.5" aria-hidden />
    </button>
  );
}
