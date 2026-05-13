"use client";

import { Fragment, useMemo, useState } from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  isWeekend,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { ActiveProperty, CalendarReservation } from "@/lib/queries";
import { useQuickBook } from "@/components/admin/quick-book/provider";
import { sourceBgClass } from "./legend";
import { ReservationDrawer } from "./reservation-drawer";

interface CalendarGridProps {
  startDate: Date;
  days: number;
  properties: ActiveProperty[];
  reservations: CalendarReservation[];
}

/**
 * Multi-unit calendar grid (read-only in Phase 2 — drag & drop lands in
 * Phase 2.5).
 *
 * CSS Grid layout: 1 sticky property column + N day columns, with
 * reservation blocks spanning multiple day columns via `grid-column:
 * span N`. Empty cells are individually clickable to open Quick Book
 * with prefilled property + date.
 */
export function CalendarGrid({
  startDate,
  days,
  properties,
  reservations,
}: CalendarGridProps) {
  const [selected, setSelected] = useState<CalendarReservation | null>(null);
  const { openQuickBook } = useQuickBook();

  // Bucket properties into Chalets / Bungalows so the header rows render
  // collapsible groups in the design — Phase 2.5 makes them actually
  // collapsible; for now they're just visually distinct.
  const groups = useMemo(() => {
    const chalets = properties.filter((p) => p.type === "CHALET");
    const bungalows = properties.filter((p) => p.type === "BUNGALOW");
    return [
      { label: "Chalets · pieds dans l'eau", properties: chalets },
      { label: "Bungalows · jardin", properties: bungalows },
    ];
  }, [properties]);

  const today = new Date();
  const reservationsByProperty = useMemo(() => {
    const map = new Map<string, CalendarReservation[]>();
    for (const r of reservations) {
      const arr = map.get(r.propertyId) ?? [];
      arr.push(r);
      map.set(r.propertyId, arr);
    }
    return map;
  }, [reservations]);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <div className="min-w-fit">
          {/* Header row */}
          <div
            className="grid border-b border-border"
            style={{
              gridTemplateColumns: `220px repeat(${days}, minmax(56px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-20 border-r border-border bg-card px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Hébergement
            </div>
            {Array.from({ length: days }, (_, i) => {
              const date = addDays(startDate, i);
              const isToday = isSameDay(date, today);
              const weekend = isWeekend(date);
              return (
                <div
                  key={i}
                  className={[
                    "border-r border-border px-1 py-2 text-center text-xs",
                    isToday ? "bg-primary/10 font-semibold text-primary" : "",
                    !isToday && weekend ? "bg-secondary/50" : "",
                  ].join(" ")}
                >
                  <div className="text-[10px] uppercase text-muted-foreground">
                    {format(date, "EEE", { locale: fr })}
                  </div>
                  <div className="text-sm text-foreground">
                    {format(date, "d", { locale: fr })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Property rows */}
          {groups.map((group) => (
            <Fragment key={group.label}>
              <div
                className="grid border-b border-border bg-sand/40"
                style={{
                  gridTemplateColumns: `220px repeat(${days}, minmax(56px, 1fr))`,
                }}
              >
                <div className="sticky left-0 z-10 col-span-full border-r border-border bg-sand/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </div>
              </div>

              {group.properties.map((property) => (
                <PropertyRow
                  key={property.id}
                  property={property}
                  startDate={startDate}
                  days={days}
                  reservations={reservationsByProperty.get(property.id) ?? []}
                  onReservationClick={(r) => setSelected(r)}
                  onEmptyCellClick={(d) =>
                    openQuickBook({
                      propertyId: property.id,
                      checkInDate: format(d, "yyyy-MM-dd"),
                      checkOutDate: format(addDays(d, 1), "yyyy-MM-dd"),
                    })
                  }
                  today={today}
                />
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      <ReservationDrawer
        reservation={selected}
        propertyName={
          properties.find((p) => p.id === selected?.propertyId)?.name ?? null
        }
        onClose={() => setSelected(null)}
      />
    </>
  );
}

interface PropertyRowProps {
  property: ActiveProperty;
  startDate: Date;
  days: number;
  reservations: CalendarReservation[];
  today: Date;
  onReservationClick: (r: CalendarReservation) => void;
  onEmptyCellClick: (date: Date) => void;
}

function PropertyRow({
  property,
  startDate,
  days,
  reservations,
  today,
  onReservationClick,
  onEmptyCellClick,
}: PropertyRowProps) {
  return (
    <div
      className="grid border-b border-border"
      style={{
        gridTemplateColumns: `220px repeat(${days}, minmax(56px, 1fr))`,
      }}
    >
      <div className="sticky left-0 z-10 flex items-center gap-2 border-r border-border bg-card px-3 py-2 text-sm">
        <span
          className={`size-2 rounded-full ${property.type === "CHALET" ? "bg-primary" : "bg-olive"}`}
          aria-hidden
        />
        <span className="truncate font-medium text-foreground">
          {property.name}
        </span>
      </div>

      {Array.from({ length: days }, (_, dayIdx) => {
        const date = addDays(startDate, dayIdx);
        const reservation = reservations.find(
          (r) => r.checkIn <= date && date < r.checkOut,
        );

        if (reservation && isSameDay(date, reservation.checkIn)) {
          const span = differenceInCalendarDays(
            reservation.checkOut,
            reservation.checkIn,
          );
          // Cap span at the visible window so a long stay doesn't blow out
          // the row when only its start is visible.
          const visibleSpan = Math.min(span, days - dayIdx);
          return (
            <button
              key={dayIdx}
              type="button"
              onClick={() => onReservationClick(reservation)}
              style={{ gridColumn: `span ${visibleSpan}` }}
              className={`m-0.5 flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-left text-xs font-medium text-white shadow-sm transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring/40 ${sourceBgClass(reservation.source)}`}
              title={`${reservation.guest.firstName} ${reservation.guest.lastName} — ${reservation.code}`}
            >
              <span className="truncate">
                {reservation.guest.lastName || reservation.guest.firstName}
              </span>
              <span className="ml-auto rounded-sm bg-black/15 px-1 text-[10px]">
                {reservation.nights}n
              </span>
            </button>
          );
        }

        if (reservation) {
          // Spanned by an earlier block; render nothing so auto-flow shifts.
          return null;
        }

        const isToday = isSameDay(date, today);
        const weekend = isWeekend(date);
        return (
          <button
            key={dayIdx}
            type="button"
            onClick={() => onEmptyCellClick(date)}
            className={[
              "h-14 border-r border-border/60 transition-colors focus:outline-none focus:bg-accent/40",
              isToday ? "bg-primary/5" : "",
              !isToday && weekend ? "bg-secondary/30" : "",
              "hover:bg-accent/30",
            ].join(" ")}
            aria-label={`Réserver ${property.name} le ${format(date, "d MMMM", { locale: fr })}`}
          />
        );
      })}
    </div>
  );
}
