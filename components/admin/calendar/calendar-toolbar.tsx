"use client";

import { CalendarClock, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { CHANNEL_KEYS, CHANNEL_LABEL, type ChannelKey } from "./types";

interface CalendarToolbarProps {
  monthLabel: string;
  prevMonthIso: string;
  nextMonthIso: string;
  currentMonthIso: string;
  todayMonthIso: string;
  viewSize: number;
  channelFilter: Set<ChannelKey>;
  onChannelToggle: (key: ChannelKey | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const VIEW_SIZES = [14, 30, 90] as const;

const DOT_COLORS: Record<ChannelKey, string> = {
  direct: "var(--ch-direct)",
  booking: "var(--ch-booking)",
  airbnb: "var(--ch-airbnb)",
  expedia: "var(--ch-expedia)",
  walkin: "var(--ch-walkin)",
};

export function CalendarToolbar({
  monthLabel,
  prevMonthIso,
  nextMonthIso,
  currentMonthIso,
  todayMonthIso,
  viewSize,
  channelFilter,
  onChannelToggle,
  search,
  onSearchChange,
}: CalendarToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  function navigateTo(updates: Record<string, string | null>) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  const allActive = channelFilter.size === 0;

  return (
    <div className="cal-toolbar">
      <div className="cal-date-nav">
        <button
          type="button"
          className="icon-btn"
          aria-label="Mois précédent"
          onClick={() => navigateTo({ month: prevMonthIso })}
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="date-display">{monthLabel}</div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Mois suivant"
          onClick={() => navigateTo({ month: nextMonthIso })}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <button
        type="button"
        className="btn-admin btn-admin-secondary btn-admin-sm"
        style={{ marginLeft: 8 }}
        onClick={() => navigateTo({ month: todayMonthIso })}
        disabled={currentMonthIso === todayMonthIso}
      >
        <CalendarClock className="size-3.5" />
        Aujourd&apos;hui
      </button>

      <div className="cal-toggle" role="tablist" aria-label="Taille de la vue">
        {VIEW_SIZES.map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={v === viewSize}
            className={v === viewSize ? "active" : ""}
            onClick={() => navigateTo({ days: String(v) })}
          >
            {v} jours
          </button>
        ))}
      </div>

      <div
        style={{
          width: 1,
          height: 24,
          background: "var(--border)",
          margin: "0 4px",
        }}
        aria-hidden
      />

      <div className="search-bar" style={{ maxWidth: 280 }}>
        <Search
          className="size-3.5"
          style={{ color: "var(--text-dim)" }}
          aria-hidden
        />
        <input
          type="search"
          placeholder="Filtrer par client…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Filtrer les réservations par client"
        />
      </div>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className={`filter-chip${allActive ? " active" : ""}`}
          onClick={() => onChannelToggle(null)}
        >
          <span
            className="dot"
            style={{ background: "var(--ch-direct)" }}
            aria-hidden
          />
          Tous
        </button>
        {CHANNEL_KEYS.map((key) => {
          const active = channelFilter.has(key);
          return (
            <button
              key={key}
              type="button"
              className={`filter-chip${active ? " active" : ""}`}
              onClick={() => onChannelToggle(key)}
              aria-pressed={active}
            >
              <span
                className="dot"
                style={{ background: DOT_COLORS[key] }}
                aria-hidden
              />
              {CHANNEL_LABEL[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
