"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  addMonths,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

type IsoDate = string;

export interface UnavailableRange {
  /** ISO yyyy-MM-dd or full ISO timestamp */
  checkIn: string;
  /** ISO yyyy-MM-dd or full ISO timestamp (exclusive) */
  checkOut: string;
}

interface DateRangePickerProps {
  /** ISO yyyy-MM-dd or empty string */
  checkIn: IsoDate;
  checkOut: IsoDate;
  onChange: (range: { checkIn: IsoDate; checkOut: IsoDate }) => void;
  /** Visual variant of the *trigger* (the modal panel is identical).
   *  - `split`: original two-cell trigger with its own border (default).
   *  - `compact`: single-cell label+value trigger used inside the home
   *    BookingSearch pill and inside the floating filter bar.
   *  - `dark`: dark/glass variant for hero photos. */
  variant?: "split" | "compact" | "dark";
  /** Booked half-open ranges that must be struck through and blocked. */
  unavailableRanges?: UnavailableRange[];
  /** Labels override (i18n later) */
  labels?: {
    checkIn?: string;
    checkOut?: string;
    pickDates?: string;
    clear?: string;
    nights?: (n: number) => string;
  };
}

const DEFAULT_LABELS = {
  checkIn: "Arrivée",
  checkOut: "Départ",
  pickDates: "Choisir les dates",
  clear: "Effacer",
  nights: (n: number) => `${n} nuit${n > 1 ? "s" : ""}`,
};

/**
 * Two-month range picker — opens a portaled modal calendar over a click
 * target. The trigger has 3 visual variants but the panel is identical:
 * Airbnb-style with hover-range preview and strikethrough on disabled
 * (past + booked) days.
 */
export function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  variant = "split",
  unavailableRanges,
  labels: labelOverrides,
}: DateRangePickerProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<"in" | "out">("in");
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(checkIn ? parseISO(checkIn) : new Date()),
  );
  const [hoverDay, setHoverDay] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const inDate = checkIn ? parseISO(checkIn) : null;
  const outDate = checkOut ? parseISO(checkOut) : null;
  const today = startOfDay(new Date());

  // Expand each unavailable booked range into the set of blocked nights.
  // We treat checkOut as exclusive (the last booked night is checkOut-1)
  // so the next guest's checkIn lands cleanly on the previous checkout.
  const disabledTimes = useMemo(() => {
    const set = new Set<number>();
    if (!unavailableRanges) return set;
    for (const r of unavailableRanges) {
      const start = startOfDay(new Date(r.checkIn));
      const end = startOfDay(new Date(r.checkOut));
      for (
        let d = start;
        isBefore(d, end);
        d = new Date(d.getTime() + 86400000)
      ) {
        set.add(d.getTime());
      }
    }
    return set;
  }, [unavailableRanges]);

  function isDisabledDay(day: Date): boolean {
    if (isBefore(day, today)) return true;
    return disabledTimes.has(startOfDay(day).getTime());
  }

  /**
   * Reject a candidate range when the half-open span [start, end) crosses
   * any disabled day — Airbnb behaviour: you can't book *over* an existing
   * reservation.
   */
  function rangeCrossesDisabled(start: Date, end: Date): boolean {
    let d = startOfDay(start);
    const stop = startOfDay(end);
    while (isBefore(d, stop)) {
      if (disabledTimes.has(d.getTime())) return true;
      d = new Date(d.getTime() + 86400000);
    }
    return false;
  }

  function pick(day: Date) {
    if (isDisabledDay(day)) return;
    if (focus === "in" || !inDate) {
      onChange({ checkIn: format(day, "yyyy-MM-dd"), checkOut: "" });
      setFocus("out");
      return;
    }
    if (isBefore(day, inDate) || isSameDay(day, inDate)) {
      onChange({ checkIn: format(day, "yyyy-MM-dd"), checkOut: "" });
      setFocus("out");
      return;
    }
    if (rangeCrossesDisabled(inDate, day)) {
      // Selected range straddles a booked night → restart from this day.
      onChange({ checkIn: format(day, "yyyy-MM-dd"), checkOut: "" });
      setFocus("out");
      return;
    }
    onChange({ checkIn, checkOut: format(day, "yyyy-MM-dd") });
    setFocus("in");
    setOpen(false);
  }

  function clear() {
    onChange({ checkIn: "", checkOut: "" });
    setFocus("in");
  }

  const nights =
    inDate && outDate
      ? Math.round((outDate.getTime() - inDate.getTime()) / 86400000)
      : 0;

  return (
    <div ref={rootRef} className="relative">
      {variant === "compact" ? (
        <button
          type="button"
          onClick={() => {
            setFocus(inDate ? "out" : "in");
            setOpen(true);
            setViewMonth(startOfMonth(inDate ?? new Date()));
          }}
          className={cn(
            "booking-pill-cell booking-pill-trigger",
            open && "open",
          )}
        >
          <span className="booking-pill-label">
            <Calendar className="mr-1 inline size-3" />
            Dates
          </span>
          <span
            className={cn(
              "booking-pill-value",
              !inDate && "booking-pill-value-placeholder",
            )}
          >
            {inDate && outDate
              ? `${format(inDate, "d MMM", { locale: fr })} → ${format(outDate, "d MMM", { locale: fr })}`
              : inDate
                ? `${format(inDate, "d MMM yyyy", { locale: fr })}`
                : "Quand ?"}
          </span>
        </button>
      ) : (
        <div
          className={cn(
            "grid grid-cols-2 divide-x rounded-2xl border transition-shadow",
            variant === "dark"
              ? "divide-white/15 border-white/25 bg-white/10 backdrop-blur-md text-white"
              : "divide-border border-border bg-card shadow-sm hover:shadow-md",
          )}
        >
          <button
            type="button"
            onClick={() => {
              setFocus("in");
              setOpen(true);
              setViewMonth(startOfMonth(inDate ?? new Date()));
            }}
            className={cn(
              "flex flex-col items-start gap-0.5 rounded-l-2xl px-5 py-3 text-left transition-colors",
              variant === "dark" ? "hover:bg-white/10" : "hover:bg-bone",
              open && focus === "in" && variant !== "dark" && "bg-bone",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.22em]",
                variant === "dark" ? "text-white/65" : "text-muted-foreground",
              )}
            >
              <Calendar className="mr-1 inline size-3" />
              {labels.checkIn}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                inDate
                  ? variant === "dark"
                    ? "text-white"
                    : "text-charcoal"
                  : variant === "dark"
                    ? "text-white/55"
                    : "text-muted-foreground",
              )}
            >
              {inDate
                ? format(inDate, "d MMM yyyy", { locale: fr })
                : "Sélectionner"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFocus("out");
              setOpen(true);
              setViewMonth(startOfMonth(outDate ?? inDate ?? new Date()));
            }}
            className={cn(
              "flex flex-col items-start gap-0.5 rounded-r-2xl px-5 py-3 text-left transition-colors",
              variant === "dark" ? "hover:bg-white/10" : "hover:bg-bone",
              open && focus === "out" && variant !== "dark" && "bg-bone",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.22em]",
                variant === "dark" ? "text-white/65" : "text-muted-foreground",
              )}
            >
              <Calendar className="mr-1 inline size-3" />
              {labels.checkOut}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                outDate
                  ? variant === "dark"
                    ? "text-white"
                    : "text-charcoal"
                  : variant === "dark"
                    ? "text-white/55"
                    : "text-muted-foreground",
              )}
            >
              {outDate
                ? format(outDate, "d MMM yyyy", { locale: fr })
                : "Sélectionner"}
            </span>
          </button>
        </div>
      )}

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              aria-label="Fermer le calendrier"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            />

            <div
              className="relative w-full max-w-[min(44rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl"
              onMouseLeave={() => setHoverDay(null)}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-lg text-foreground">
                    {nights > 0
                      ? labels.nights(nights)
                      : inDate
                        ? "Sélectionnez la date de départ"
                        : labels.pickDates}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {inDate && outDate
                      ? `${format(inDate, "d MMM yyyy", { locale: fr })} → ${format(outDate, "d MMM yyyy", { locale: fr })}`
                      : "Vos dates de séjour"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {(inDate || outDate) && (
                    <button
                      type="button"
                      onClick={clear}
                      className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-bone hover:text-foreground"
                    >
                      {labels.clear}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-bone hover:text-foreground"
                    aria-label="Fermer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                  disabled={isSameMonth(viewMonth, today)}
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-bone hover:text-foreground disabled:opacity-30"
                  aria-label="Mois précédent"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {format(viewMonth, "MMMM yyyy", { locale: fr })} ·{" "}
                  {format(addMonths(viewMonth, 1), "MMMM yyyy", { locale: fr })}
                </span>
                <button
                  type="button"
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-bone hover:text-foreground"
                  aria-label="Mois suivant"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <MonthGrid
                  month={viewMonth}
                  inDate={inDate}
                  outDate={outDate}
                  hoverDay={focus === "out" && inDate ? hoverDay : null}
                  today={today}
                  isDisabledDay={isDisabledDay}
                  onPick={pick}
                  onHover={setHoverDay}
                />
                <MonthGrid
                  month={addMonths(viewMonth, 1)}
                  inDate={inDate}
                  outDate={outDate}
                  hoverDay={focus === "out" && inDate ? hoverDay : null}
                  today={today}
                  isDisabledDay={isDisabledDay}
                  onPick={pick}
                  onHover={setHoverDay}
                />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  {disabledTimes.size > 0
                    ? "Les dates barrées sont déjà réservées."
                    : "Tous les jours sont disponibles."}
                </p>
                <div className="flex items-center gap-2">
                  {(inDate || outDate) && (
                    <button
                      type="button"
                      onClick={clear}
                      className="rounded-full px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-bone hover:text-foreground"
                    >
                      {labels.clear}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-bougainvillier"
                  >
                    {nights > 0 ? "Valider" : "Fermer"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function MonthGrid({
  month,
  inDate,
  outDate,
  hoverDay,
  today,
  isDisabledDay,
  onPick,
  onHover,
}: {
  month: Date;
  inDate: Date | null;
  outDate: Date | null;
  hoverDay: Date | null;
  today: Date;
  isDisabledDay: (d: Date) => boolean;
  onPick: (d: Date) => void;
  onHover: (d: Date | null) => void;
}) {
  const first = startOfMonth(month);
  const startWeekday = (first.getDay() + 6) % 7; /* Mon=0 */
  const daysInMonth = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();
  const cells: (Date | null)[] = Array.from({ length: startWeekday }).map(
    () => null,
  );
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), d));
  }

  const weekdays = ["L", "M", "M", "J", "V", "S", "D"];

  // Hover preview range: when only inDate is set and the user is hovering
  // a day that's >= inDate, highlight the in-between cells.
  const hoverEnd =
    inDate && !outDate && hoverDay && !isBefore(hoverDay, inDate)
      ? hoverDay
      : null;

  return (
    <div>
      <div className="mb-3 text-center font-heading text-[1.05rem] font-normal text-charcoal">
        {format(month, "MMMM yyyy", { locale: fr })}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {weekdays.map((w, i) => (
          <span key={`${w}-${i}`}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1 text-sm">
        {cells.map((d, i) => {
          if (!d) return <span key={`empty-${i}`} />;
          const disabled = isDisabledDay(d);
          const past = isBefore(d, today);
          const isIn = inDate && isSameDay(d, inDate);
          const isOut = outDate && isSameDay(d, outDate);
          const inRange =
            inDate &&
            outDate &&
            isWithinInterval(d, { start: inDate, end: outDate });
          const inHover =
            hoverEnd &&
            inDate &&
            isWithinInterval(d, { start: inDate, end: hoverEnd });
          const isEndpoint = isIn || isOut;
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onPick(d)}
              onMouseEnter={() => onHover(d)}
              className={cn(
                "relative mx-auto inline-flex size-10 items-center justify-center text-foreground transition-colors",
                past && "text-muted-foreground/40 line-through",
                disabled &&
                  !past &&
                  "text-muted-foreground/60 line-through cursor-not-allowed",
                !disabled &&
                  !isEndpoint &&
                  !inRange &&
                  !inHover &&
                  "hover:bg-sand rounded-full",
                (inRange || inHover) && !isEndpoint && "bg-sand text-charcoal",
                isIn && "rounded-l-full",
                isOut && "rounded-r-full",
                isEndpoint &&
                  "z-10 rounded-full bg-primary text-primary-foreground hover:bg-bougainvillier",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
