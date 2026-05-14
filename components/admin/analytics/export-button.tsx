"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
  /** Current month in YYYY-MM format. */
  month: string;
}

function parseMonth(monthIso: string): { year: number; month: number } {
  const [y, m] = monthIso.split("-");
  return {
    year: Number.parseInt(y ?? "2026", 10),
    month: Number.parseInt(m ?? "1", 10),
  };
}

function nextMonthIso(monthIso: string): string {
  const { year, month } = parseMonth(monthIso);
  const totalIdx = year * 12 + (month - 1) + 1;
  const newYear = Math.floor(totalIdx / 12);
  const newMonth = (totalIdx % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

export function ExportButton({ month }: ExportButtonProps) {
  function onClick() {
    const start = `${month}-01`;
    const end = `${nextMonthIso(month)}-01`;
    const params = new URLSearchParams({ start, end });
    window.location.href = `/api/reports/export?${params.toString()}`;
  }

  return (
    <button
      type="button"
      className="btn-admin btn-admin-primary"
      onClick={onClick}
    >
      <Download size={14} aria-hidden />
      <span>Exporter</span>
    </button>
  );
}
