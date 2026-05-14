"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { toZonedTime } from "date-fns-tz";
import { addDays } from "date-fns";
import { Plus } from "lucide-react";
import type { ActiveProperty, CalendarReservation } from "@/lib/queries";
import { TZ } from "@/lib/date";
import { useRouter } from "@/i18n/navigation";
import { CHANNEL_MARK, paymentBucket, type ChannelKey } from "./types";

const MIN_DAY_WIDTH = 36; // px — minimum cell width; matches maquette baseline

const DOW_LETTERS = ["D", "L", "M", "M", "J", "V", "S"] as const;

export interface TimelineReservation extends CalendarReservation {
  /** day-offset within the visible window (can be negative if stay started earlier) */
  startOffset: number;
  /** number of nights visible inside the window */
  visibleNights: number;
  channel: ChannelKey;
}

interface CalendarTimelineProps {
  properties: (ActiveProperty & {
    photoUrl?: string | null;
    metaLabel?: string;
  })[];
  days: Date[];
  reservations: TimelineReservation[];
  todayIndex: number | null;
  channelFilter: Set<ChannelKey>;
  searchQuery: string;
  onReservationClick: (id: string) => void;
}

interface DragState {
  propertyId: string;
  startIndex: number;
  endIndex: number;
}

function dayOfWeek(d: Date): string {
  const zoned = toZonedTime(d, TZ);
  const idx = zoned.getDay();
  return DOW_LETTERS[idx] ?? "";
}

function isWeekend(d: Date): boolean {
  const zoned = toZonedTime(d, TZ);
  const day = zoned.getDay();
  return day === 0 || day === 6;
}

function dayNumber(d: Date): number {
  return toZonedTime(d, TZ).getDate();
}

/** Format a UTC Date as YYYY-MM-DD in the Africa/Tunis timezone. */
function toYmd(d: Date): string {
  const z = toZonedTime(d, TZ);
  const y = z.getFullYear();
  const m = String(z.getMonth() + 1).padStart(2, "0");
  const day = String(z.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CalendarTimeline({
  properties,
  days,
  reservations,
  todayIndex,
  channelFilter,
  searchQuery,
  onReservationClick,
}: CalendarTimelineProps) {
  const router = useRouter();
  const chalets = properties.filter((p) => p.type === "CHALET");
  const bungalows = properties.filter((p) => p.type === "BUNGALOW");
  const groups: { label: string; items: typeof properties }[] = [];
  if (chalets.length > 0) groups.push({ label: "CHALETS", items: chalets });
  if (bungalows.length > 0)
    groups.push({ label: "BUNGALOWS", items: bungalows });

  const n = days.length;
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${n}, minmax(${MIN_DAY_WIDTH}px, 1fr))`,
    minWidth: n * MIN_DAY_WIDTH,
  };

  const reservationsByProperty = useMemo(() => {
    const map = new Map<string, TimelineReservation[]>();
    for (const r of reservations) {
      const arr = map.get(r.propertyId) ?? [];
      arr.push(r);
      map.set(r.propertyId, arr);
    }
    return map;
  }, [reservations]);

  /**
   * Precompute occupancy per property × day-index. Day index `i` is
   * occupied when any reservation covers night `i` (startOffset <= i <
   * startOffset + visibleNights). We use the *unclamped* visible range
   * stored in startOffset / visibleNights, which already accounts for
   * stays starting earlier or ending after the window.
   */
  const occupancy = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const r of reservations) {
      // Treat cancelled / no-show as free.
      if (r.status === "CANCELLED" || r.status === "NO_SHOW") continue;
      const set = map.get(r.propertyId) ?? new Set<number>();
      const from = Math.max(r.startOffset, 0);
      const to = Math.min(r.startOffset + r.visibleNights, n);
      for (let i = from; i < to; i++) set.add(i);
      map.set(r.propertyId, set);
    }
    return map;
  }, [reservations, n]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  // Drag-to-create state and pointer handlers.
  const [drag, setDrag] = useState<DragState | null>(null);
  // Latest drag is mirrored in a ref to keep pointermove/up handlers stable.
  const dragRef = useRef<DragState | null>(null);
  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  const indexFromClientX = useCallback(
    (rowEl: HTMLDivElement, clientX: number): number | null => {
      const rect = rowEl.getBoundingClientRect();
      if (rect.width <= 0) return null;
      const relX = clientX - rect.left;
      if (relX < 0 || relX >= rect.width) {
        // Clamp into range, otherwise drag breaks at the edges.
        const clamped = Math.max(0, Math.min(rect.width - 1, relX));
        return Math.min(n - 1, Math.floor((clamped / rect.width) * n));
      }
      return Math.min(n - 1, Math.floor((relX / rect.width) * n));
    },
    [n],
  );

  const handlePointerDown = useCallback(
    (
      e: ReactPointerEvent<HTMLDivElement>,
      propertyId: string,
      occupiedSet: Set<number> | undefined,
    ) => {
      // Ignore non-primary buttons.
      if (e.button !== 0) return;
      // Don't start a drag when the user pressed on an existing booking bar.
      const target = e.target as HTMLElement;
      if (target.closest(".booking")) return;
      const rowEl = e.currentTarget;
      const idx = indexFromClientX(rowEl, e.clientX);
      if (idx === null) return;
      if (occupiedSet?.has(idx)) return;
      e.preventDefault();
      rowEl.setPointerCapture(e.pointerId);
      setDrag({ propertyId, startIndex: idx, endIndex: idx });
    },
    [indexFromClientX],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, propertyId: string) => {
      const current = dragRef.current;
      if (!current || current.propertyId !== propertyId) return;
      const idx = indexFromClientX(e.currentTarget, e.clientX);
      if (idx === null) return;
      if (idx === current.endIndex) return;
      setDrag({ ...current, endIndex: idx });
    },
    [indexFromClientX],
  );

  const finishDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, propertyId: string) => {
      const current = dragRef.current;
      if (!current || current.propertyId !== propertyId) {
        return;
      }
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      const from = Math.min(current.startIndex, current.endIndex);
      const to = Math.max(current.startIndex, current.endIndex);

      // Cancel the drag if any selected cell is occupied. This includes the
      // start cell — which guards us against drag-overs that crossed a
      // booking bar.
      const occupied = occupancy.get(propertyId);
      if (occupied) {
        for (let i = from; i <= to; i++) {
          if (occupied.has(i)) {
            setDrag(null);
            return;
          }
        }
      }

      const checkInDate = days[from];
      const checkOutDate = days[to];
      if (!checkInDate || !checkOutDate) {
        setDrag(null);
        return;
      }
      // Single click → 1 night (checkOut = checkIn + 1). Drag → range +1 day
      // to make the right edge inclusive (checkOut is exclusive).
      const checkOutInclusive = addDays(checkOutDate, 1);
      const url = `/admin/reservations/new?propertyId=${encodeURIComponent(
        propertyId,
      )}&checkIn=${toYmd(checkInDate)}&checkOut=${toYmd(checkOutInclusive)}`;
      setDrag(null);
      router.push(url);
    },
    [days, occupancy, router],
  );

  const handlePointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      setDrag(null);
    },
    [],
  );

  return (
    <div className="cal-wrapper">
      <div className="cal-grid">
        {/* LEFT — unit list */}
        <div className="cal-left">
          <div className="cal-left-header">
            <span className="label">Unité ({properties.length})</span>
          </div>
          {groups.map((group) => (
            <div key={group.label}>
              <div className="unit-section-header">
                {group.label}
                <span className="count">· {group.items.length}</span>
              </div>
              {group.items.map((p) => (
                <div className="unit-row-label" key={p.id}>
                  <div
                    className="thumb"
                    style={
                      p.photoUrl
                        ? { backgroundImage: `url(${p.photoUrl})` }
                        : undefined
                    }
                    aria-hidden
                  />
                  <div className="info">
                    <div className="name">{p.name}</div>
                    <div className="meta">
                      {p.capacity} voy.{p.metaLabel ? ` · ${p.metaLabel}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* RIGHT — timeline */}
        <div className="cal-right">
          <div className="cal-tracks" style={{ minWidth: n * MIN_DAY_WIDTH }}>
            <div className="cal-header-row" style={gridStyle}>
              {days.map((d, i) => {
                const weekend = isWeekend(d);
                const today = todayIndex === i;
                const cls = ["cal-day"];
                if (weekend) cls.push("weekend");
                if (today) cls.push("today");
                return (
                  <div className={cls.join(" ")} key={i}>
                    <span className="dow">{dayOfWeek(d)}</span>
                    <span className="dnum">{dayNumber(d)}</span>
                  </div>
                );
              })}
              {todayIndex !== null ? (
                <span
                  className="today-badge"
                  style={{ left: `calc(${((todayIndex + 0.5) / n) * 100}%)` }}
                  aria-hidden
                >
                  AUJ
                </span>
              ) : null}
            </div>

            {groups.map((group) => (
              <div key={group.label}>
                <div
                  className="unit-section-spacer"
                  style={{ minWidth: n * MIN_DAY_WIDTH }}
                  aria-hidden
                />
                {group.items.map((property) => {
                  const rows = reservationsByProperty.get(property.id) ?? [];
                  const occupied = occupancy.get(property.id);
                  const isDragging =
                    drag !== null && drag.propertyId === property.id;
                  const dragFrom = isDragging
                    ? Math.min(drag.startIndex, drag.endIndex)
                    : null;
                  const dragTo = isDragging
                    ? Math.max(drag.startIndex, drag.endIndex)
                    : null;
                  const dragNights =
                    dragFrom !== null && dragTo !== null
                      ? dragTo - dragFrom + 1
                      : 0;

                  return (
                    <div
                      key={property.id}
                      className="booking-row"
                      style={{ minWidth: n * MIN_DAY_WIDTH }}
                      onPointerDown={(e) =>
                        handlePointerDown(e, property.id, occupied)
                      }
                      onPointerMove={(e) => handlePointerMove(e, property.id)}
                      onPointerUp={(e) => finishDrag(e, property.id)}
                      onPointerCancel={handlePointerCancel}
                    >
                      {/* Cell layer — weekend stripes, hover hints, drag selection */}
                      <div className="cells" style={gridStyle} aria-hidden>
                        {days.map((d, i) => {
                          const cellCls = ["cell"];
                          if (isWeekend(d)) cellCls.push("weekend");
                          const occupiedHere = occupied?.has(i) ?? false;
                          if (!occupiedHere) cellCls.push("is-empty");
                          if (
                            isDragging &&
                            dragFrom !== null &&
                            dragTo !== null &&
                            i >= dragFrom &&
                            i <= dragTo
                          ) {
                            cellCls.push("selecting");
                          }
                          return <div className={cellCls.join(" ")} key={i} />;
                        })}
                      </div>

                      {/* Drag ghost label */}
                      {isDragging &&
                      dragFrom !== null &&
                      dragTo !== null &&
                      dragNights > 0 ? (
                        <div
                          className="drag-ghost"
                          style={{
                            left: `calc(${(dragFrom / n) * 100}% + 4px)`,
                          }}
                        >
                          <Plus className="size-3" aria-hidden />
                          Nouvelle résa · {dragNights} nuit
                          {dragNights > 1 ? "s" : ""}
                        </div>
                      ) : null}

                      {rows.map((r) => {
                        const matchesChannel =
                          channelFilter.size === 0 ||
                          channelFilter.has(r.channel);
                        const guestName =
                          `${r.guest.firstName} ${r.guest.lastName}`.trim();
                        const matchesSearch =
                          !normalizedSearch ||
                          guestName.toLowerCase().includes(normalizedSearch) ||
                          r.code.toLowerCase().includes(normalizedSearch);
                        const hidden = !matchesChannel || !matchesSearch;

                        const leftPct = (r.startOffset / n) * 100;
                        const widthPct = (r.visibleNights / n) * 100;
                        const channelClass =
                          r.channel === "booking" ? "booking-ch" : r.channel;
                        const isOption = r.status === "PENDING";
                        const pay = paymentBucket(r.total, r.paidAmount);

                        const cls = ["booking", channelClass];
                        if (isOption) cls.push("option");

                        const mark = CHANNEL_MARK[r.channel];

                        return (
                          <button
                            type="button"
                            key={r.id}
                            className={cls.join(" ")}
                            style={{
                              left: `${leftPct}%`,
                              width: `calc(${widthPct}% - 4px)`,
                              display: hidden ? "none" : undefined,
                            }}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onReservationClick(r.id);
                            }}
                            onPointerDown={(ev) => ev.stopPropagation()}
                            title={`${guestName} — ${r.code}`}
                          >
                            <span
                              className="ch-logo"
                              aria-hidden
                              title={mark.title}
                            >
                              {isOption ? "⏳" : mark.label}
                            </span>
                            {!isOption ? (
                              <span className={`pay-dot ${pay}`} aria-hidden />
                            ) : null}
                            <span className="name">{guestName}</span>
                            <span className="nights">{r.nights}n</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}

            {todayIndex !== null ? (
              <div
                className="today-line"
                style={{ left: `calc(${((todayIndex + 0.5) / n) * 100}%)` }}
                aria-hidden
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
