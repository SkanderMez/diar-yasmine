"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  format,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PropertyMiniCalendarProps {
  unavailableDays?: Date[];
  onSelect?: (range: { checkIn: string; checkOut: string }) => void;
  initialMonth?: Date;
}

/**
 * Maquette `.mini-calendar` — two months side-by-side, monday-first.
 * Click-to-select range (in → out → reset). Booked days are line-through
 * and not clickable; today gets a primary border; selected start/end are
 * primary-bg ivory-text; in-range cells are sand-bg primary-text.
 */
export function PropertyMiniCalendar({
  unavailableDays = [],
  onSelect,
  initialMonth,
}: PropertyMiniCalendarProps) {
  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    startOfMonth(initialMonth ?? today),
  );
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);

  const unavailableSet = useMemo(() => {
    const set = new Set<string>();
    unavailableDays.forEach((d) => set.add(format(d, "yyyy-MM-dd")));
    return set;
  }, [unavailableDays]);

  function isBooked(day: Date) {
    return unavailableSet.has(format(day, "yyyy-MM-dd"));
  }

  function pick(day: Date) {
    if (isBooked(day) || isBefore(day, today)) return;
    if (!checkIn || (checkIn && checkOut)) {
      /* First click OR third click after a complete range: reset to in. */
      setCheckIn(day);
      setCheckOut(null);
      return;
    }
    if (isBefore(day, checkIn) || isSameDay(day, checkIn)) {
      /* Picking before the in date — treat as a new in. */
      setCheckIn(day);
      setCheckOut(null);
      return;
    }
    setCheckOut(day);
    onSelect?.({
      checkIn: format(checkIn, "yyyy-MM-dd"),
      checkOut: format(day, "yyyy-MM-dd"),
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, -1))}
          disabled={
            viewMonth.getFullYear() === today.getFullYear() &&
            viewMonth.getMonth() === today.getMonth()
          }
          className="inline-flex size-9 items-center justify-center rounded-full text-charcoal-soft transition-colors hover:bg-primary-tint hover:text-charcoal disabled:opacity-30"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="inline-flex size-9 items-center justify-center rounded-full text-charcoal-soft transition-colors hover:bg-primary-tint hover:text-charcoal"
          aria-label="Mois suivant"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <Month
          month={viewMonth}
          today={today}
          checkIn={checkIn}
          checkOut={checkOut}
          isBooked={isBooked}
          onPick={pick}
        />
        <Month
          month={addMonths(viewMonth, 1)}
          today={today}
          checkIn={checkIn}
          checkOut={checkOut}
          isBooked={isBooked}
          onPick={pick}
        />
      </div>
    </div>
  );
}

function Month({
  month,
  today,
  checkIn,
  checkOut,
  isBooked,
  onPick,
}: {
  month: Date;
  today: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  isBooked: (d: Date) => boolean;
  onPick: (d: Date) => void;
}) {
  const first = startOfMonth(month);
  const startWeekday = (first.getDay() + 6) % 7; /* Mon = 0 */
  const daysInMonth = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();

  /* Cells include leading outside-month placeholders + the month days. */
  const cells: { date: Date; outside: boolean }[] = [];
  for (let i = 0; i < startWeekday; i++) {
    const d = new Date(
      first.getFullYear(),
      first.getMonth(),
      i - startWeekday + 1,
    );
    cells.push({ date: d, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(first.getFullYear(), first.getMonth(), d),
      outside: false,
    });
  }
  /* Pad trailing to complete the last week. */
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!.date;
    const next = new Date(
      last.getFullYear(),
      last.getMonth(),
      last.getDate() + 1,
    );
    cells.push({ date: next, outside: true });
  }

  const weekdays = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div>
      <h4 className="mb-2 font-heading text-[1.1rem] font-medium capitalize text-charcoal">
        {format(month, "MMMM yyyy", { locale: fr })}
      </h4>
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((w, i) => (
          <div
            key={`${w}-${i}`}
            className="pb-1 text-center text-[0.7rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
          >
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          const { date, outside } = cell;
          const past = isBefore(date, today);
          const booked = !outside && !past && isBooked(date);
          const isToday = isSameDay(date, today);
          const isStart = checkIn && isSameDay(date, checkIn);
          const isEnd = checkOut && isSameDay(date, checkOut);
          const inRange =
            checkIn &&
            checkOut &&
            !isStart &&
            !isEnd &&
            isWithinInterval(date, { start: checkIn, end: checkOut });

          const disabled = outside || booked || past;

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onPick(date)}
              className={cn(
                "relative flex aspect-square items-center justify-center text-sm transition-colors",
                outside && "cursor-default text-line",
                !outside && !disabled && "rounded-sm hover:bg-primary-tint",
                isToday && !isStart && !isEnd && "border-2 border-primary",
                booked &&
                  "cursor-not-allowed text-line line-through bg-sand-dark/40",
                past && !outside && !booked && "text-line line-through",
                inRange && "bg-primary-tint-strong text-primary rounded-none",
                isStart && "bg-primary text-ivory rounded-l-sm rounded-r-none",
                isEnd && "bg-primary text-ivory rounded-r-sm rounded-l-none",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
