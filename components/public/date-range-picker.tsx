"use client";

import { useEffect, useRef, useState } from "react";
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

interface DateRangePickerProps {
  /** ISO yyyy-MM-dd or empty string */
  checkIn: IsoDate;
  checkOut: IsoDate;
  onChange: (range: { checkIn: IsoDate; checkOut: IsoDate }) => void;
  /** Visual variant: light bg over pages or dark bg over hero photo */
  variant?: "light" | "dark";
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
 * Inline calendar popover replacing native <input type="date">. Two-month
 * view, range selection, click outside / Esc to close. Returns ISO strings
 * to stay drop-in compatible with the existing filter state.
 */
export function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  variant = "light",
  labels: labelOverrides,
}: DateRangePickerProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<"in" | "out">("in");
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(checkIn ? parseISO(checkIn) : new Date()),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const inDate = checkIn ? parseISO(checkIn) : null;
  const outDate = checkOut ? parseISO(checkOut) : null;
  const today = startOfDay(new Date());

  function pick(day: Date) {
    if (isBefore(day, today)) return;
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
            open && focus === "in" && variant === "light" && "bg-bone",
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
          <span className="text-sm font-medium">
            {inDate ? format(inDate, "d MMM yyyy", { locale: fr }) : "—"}
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
            open && focus === "out" && variant === "light" && "bg-bone",
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
          <span className="text-sm font-medium">
            {outDate ? format(outDate, "d MMM yyyy", { locale: fr }) : "—"}
          </span>
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(40rem,calc(100vw-2rem))] origin-top-left rounded-3xl border border-border bg-card p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg text-foreground">
              {nights > 0 ? labels.nights(nights) : labels.pickDates}
            </h3>
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
            <span className="text-xs text-muted-foreground">
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
              today={today}
              onPick={pick}
            />
            <MonthGrid
              month={addMonths(viewMonth, 1)}
              inDate={inDate}
              outDate={outDate}
              today={today}
              onPick={pick}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  month,
  inDate,
  outDate,
  today,
  onPick,
}: {
  month: Date;
  inDate: Date | null;
  outDate: Date | null;
  today: Date;
  onPick: (d: Date) => void;
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

  return (
    <div>
      <div className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-foreground">
        {format(month, "MMMM yyyy", { locale: fr })}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {weekdays.map((w, i) => (
          <span key={`${w}-${i}`}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1 text-sm">
        {cells.map((d, i) => {
          if (!d) return <span key={`empty-${i}`} />;
          const past = isBefore(d, today);
          const isIn = inDate && isSameDay(d, inDate);
          const isOut = outDate && isSameDay(d, outDate);
          const inRange =
            inDate &&
            outDate &&
            isWithinInterval(d, { start: inDate, end: outDate });
          const isEndpoint = isIn || isOut;
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={past}
              onClick={() => onPick(d)}
              className={cn(
                "relative mx-auto inline-flex size-9 items-center justify-center text-foreground transition-colors",
                past && "text-muted-foreground/40 line-through",
                !past &&
                  !isEndpoint &&
                  !inRange &&
                  "hover:bg-bone rounded-full",
                inRange && !isEndpoint && "bg-clay-light/30",
                isIn && "rounded-l-full",
                isOut && "rounded-r-full",
                isEndpoint &&
                  "z-10 rounded-full bg-primary text-primary-foreground hover:bg-deep",
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
