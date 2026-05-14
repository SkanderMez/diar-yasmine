"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface MonthPickerProps {
  currentMonth: string;
  label: string;
}

const FR_MONTHS_FULL = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function parseMonth(monthIso: string): { year: number; month: number } {
  const [y, m] = monthIso.split("-");
  return {
    year: Number.parseInt(y ?? "2026", 10),
    month: Number.parseInt(m ?? "1", 10),
  };
}

function shiftMonth(
  monthIso: string,
  delta: number,
): { iso: string; label: string } {
  const { year, month } = parseMonth(monthIso);
  // month is 1..12 — convert to a Date-like math step
  const totalIdx = year * 12 + (month - 1) + delta;
  const newYear = Math.floor(totalIdx / 12);
  const newMonthIdx = ((totalIdx % 12) + 12) % 12;
  const iso = `${newYear}-${String(newMonthIdx + 1).padStart(2, "0")}`;
  const label = `${FR_MONTHS_FULL[newMonthIdx] ?? ""} ${newYear}`;
  return { iso, label };
}

export function MonthPicker({ currentMonth, label }: MonthPickerProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const options: { iso: string; label: string }[] = [];
  for (let d = -12; d <= 3; d++) {
    options.push(shiftMonth(currentMonth, d));
  }

  function onSelect(iso: string) {
    const params = new URLSearchParams(sp?.toString());
    params.set("month", iso);
    router.push(`?${params.toString()}`);
  }

  return (
    <details className="month-picker">
      <summary className="btn-admin btn-admin-secondary">
        <Calendar size={14} aria-hidden />
        <span>{label}</span>
        <ChevronDown size={14} aria-hidden />
      </summary>
      <div className="menu" role="listbox">
        {options.map((o) => (
          <a
            key={o.iso}
            href={`?month=${o.iso}`}
            className={o.iso === currentMonth ? "active" : undefined}
            onClick={(e) => {
              e.preventDefault();
              onSelect(o.iso);
            }}
          >
            {o.label}
          </a>
        ))}
      </div>
    </details>
  );
}
