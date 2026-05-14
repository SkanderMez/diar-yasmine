"use client";

import { useId } from "react";

export interface SupplementsState {
  weekendPct: number;
  tnHolidaysPct: number;
  ramadanPct: number;
  aidPct: number;
}

interface SupplementsCardProps {
  value: SupplementsState;
  onChange: (next: SupplementsState) => void;
}

const ROWS: { key: keyof SupplementsState; label: string }[] = [
  { key: "weekendPct", label: "Week-end (Ven-Dim)" },
  { key: "tnHolidaysPct", label: "Vacances scolaires TN" },
  { key: "ramadanPct", label: "Ramadan" },
  { key: "aidPct", label: "Aïd" },
];

/**
 * Settings card with 4 supplement rows — weekend, holidays, ramadan, aid.
 * Values are stored as basis points (1500 = +15%) but displayed as percent
 * with the sign explicit (+15 / -20).
 */
export function SupplementsCard({ value, onChange }: SupplementsCardProps) {
  return (
    <div className="settings-card">
      <h4
        style={{
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--text-muted)",
          marginBottom: 12,
        }}
      >
        Suppléments
      </h4>
      {ROWS.map((row) => (
        <SupplementRow
          key={row.key}
          label={row.label}
          value={value[row.key]}
          onChange={(next) => onChange({ ...value, [row.key]: next })}
        />
      ))}
    </div>
  );
}

function SupplementRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const inputId = useId();
  // Basis points -> integer percent for display (1500 -> 15).
  const display = Math.round(value / 100).toString();
  const signed = value > 0 ? `+${display}` : display;

  return (
    <div className="setting-row">
      <label htmlFor={inputId} className="label">
        {label}
      </label>
      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          id={inputId}
          className="amt"
          type="text"
          inputMode="numeric"
          value={signed}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9+\-]/g, "");
            const n = Number(raw);
            if (!Number.isFinite(n)) return;
            const clamped = Math.max(-100, Math.min(100, Math.trunc(n)));
            onChange(clamped * 100);
          }}
        />
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          %
        </span>
      </span>
    </div>
  );
}
