"use client";

import { useId } from "react";

export interface RulesState {
  minStayLow: number;
  minStayHigh: number;
  minStayPeak: number;
  longstayDiscountPct: number;
  longstayThresholdNights: number;
}

interface RulesCardProps {
  value: RulesState;
  onChange: (next: RulesState) => void;
}

/**
 * Settings card for the min-stay rules and long-stay discount.
 * Min-stay values are integer nights; the long-stay discount is stored
 * in basis points (-1000 = -10%) but displayed as percent.
 */
export function RulesCard({ value, onChange }: RulesCardProps) {
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
        Règles
      </h4>
      <NightsRow
        label="Séjour min. basse"
        suffix="nuits"
        value={value.minStayLow}
        onChange={(next) => onChange({ ...value, minStayLow: next })}
      />
      <NightsRow
        label="Séjour min. haute"
        suffix="nuits"
        value={value.minStayHigh}
        onChange={(next) => onChange({ ...value, minStayHigh: next })}
      />
      <NightsRow
        label="Séjour min. pic"
        suffix="nuits"
        value={value.minStayPeak}
        onChange={(next) => onChange({ ...value, minStayPeak: next })}
      />
      <LongStayRow
        discountPct={value.longstayDiscountPct}
        thresholdNights={value.longstayThresholdNights}
        onChange={(discountPct, thresholdNights) =>
          onChange({
            ...value,
            longstayDiscountPct: discountPct,
            longstayThresholdNights: thresholdNights,
          })
        }
      />
    </div>
  );
}

function NightsRow({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const inputId = useId();
  return (
    <div className="setting-row">
      <label htmlFor={inputId} className="label">
        {label}
      </label>
      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          id={inputId}
          className="amt"
          type="number"
          inputMode="numeric"
          min={1}
          max={30}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            onChange(Math.max(1, Math.min(30, Math.trunc(n))));
          }}
        />
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          {suffix}
        </span>
      </span>
    </div>
  );
}

function LongStayRow({
  discountPct,
  thresholdNights,
  onChange,
}: {
  discountPct: number;
  thresholdNights: number;
  onChange: (discountPct: number, thresholdNights: number) => void;
}) {
  const discountId = useId();
  const thresholdId = useId();
  const display = Math.round(discountPct / 100).toString();
  const signed = discountPct > 0 ? `+${display}` : display;

  return (
    <div className="setting-row">
      <label htmlFor={discountId} className="label">
        Remise long séjour
      </label>
      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          id={discountId}
          className="amt"
          type="text"
          inputMode="numeric"
          value={signed}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9+\-]/g, "");
            const n = Number(raw);
            if (!Number.isFinite(n)) return;
            const clamped = Math.max(-100, Math.min(100, Math.trunc(n)));
            onChange(clamped * 100, thresholdNights);
          }}
        />
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          % ≥
        </span>
        <input
          id={thresholdId}
          aria-label="Seuil nuits"
          type="number"
          min={1}
          max={60}
          value={thresholdNights}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            onChange(discountPct, Math.max(1, Math.min(60, Math.trunc(n))));
          }}
          style={{
            width: 38,
            padding: "4px 6px",
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            textAlign: "right",
          }}
        />
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          n
        </span>
      </span>
    </div>
  );
}
