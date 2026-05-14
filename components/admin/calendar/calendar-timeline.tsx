"use client";

import type { CSSProperties } from "react";
import { toZonedTime } from "date-fns-tz";
import type { ActiveProperty, CalendarReservation } from "@/lib/queries";
import { TZ } from "@/lib/date";
import { CHANNEL_MARK, paymentBucket, type ChannelKey } from "./types";

const DAY_WIDTH = 36; // px — matches maquette

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

export function CalendarTimeline({
  properties,
  days,
  reservations,
  todayIndex,
  channelFilter,
  searchQuery,
  onReservationClick,
}: CalendarTimelineProps) {
  const chalets = properties.filter((p) => p.type === "CHALET");
  const bungalows = properties.filter((p) => p.type === "BUNGALOW");
  const groups: { label: string; items: typeof properties }[] = [];
  if (chalets.length > 0) groups.push({ label: "CHALETS", items: chalets });
  if (bungalows.length > 0)
    groups.push({ label: "BUNGALOWS", items: bungalows });

  const totalWidth = days.length * DAY_WIDTH;
  const headerGridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${days.length}, ${DAY_WIDTH}px)`,
    width: totalWidth,
  };
  const rowWidthStyle: CSSProperties = { width: totalWidth };

  const reservationsByProperty = new Map<string, TimelineReservation[]>();
  for (const r of reservations) {
    const arr = reservationsByProperty.get(r.propertyId) ?? [];
    arr.push(r);
    reservationsByProperty.set(r.propertyId, arr);
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();

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
          <div className="cal-header-row" style={headerGridStyle}>
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
          </div>

          {groups.map((group) => (
            <div key={group.label}>
              <div
                className="unit-section-spacer"
                style={rowWidthStyle}
                aria-hidden
              />
              {group.items.map((property) => {
                const rows = reservationsByProperty.get(property.id) ?? [];
                return (
                  <div
                    key={property.id}
                    className="booking-row weekend-bg"
                    style={rowWidthStyle}
                  >
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

                      const left = r.startOffset * DAY_WIDTH;
                      const width = r.visibleNights * DAY_WIDTH - 4;
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
                            left: `${left}px`,
                            width: `${width}px`,
                            display: hidden ? "none" : undefined,
                          }}
                          onClick={() => onReservationClick(r.id)}
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
              style={{ left: `${todayIndex * DAY_WIDTH + DAY_WIDTH / 2}px` }}
              aria-hidden
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
