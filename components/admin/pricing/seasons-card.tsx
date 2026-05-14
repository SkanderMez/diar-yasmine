"use client";

import { useId } from "react";

export type SeasonTier = "low" | "mid" | "high" | "peak";

export interface SeasonRowData {
  id: string;
  name: string;
  periodLabel: string;
  /** Basis points: 1000 = ×1.0, 1800 = ×1.8. */
  multiplier: number;
  tier: SeasonTier;
  /** Month/day boundaries of the season (year-agnostic). */
  startMonthDay: { month: number; day: number };
  endMonthDay: { month: number; day: number };
}

const SWATCH: Record<SeasonTier, string> = {
  low: "rgba(122,143,107,0.4)",
  mid: "rgba(79,184,196,0.4)",
  high: "rgba(224,176,116,0.4)",
  peak: "rgba(196,78,122,0.4)",
};

interface SeasonsCardProps {
  seasons: SeasonRowData[];
  onChange: (id: string, multiplier: number) => void;
}

/**
 * Settings card listing every Season row with its swatch, name, period and
 * an editable multiplier. The multiplier is shown as "×1.8" but stored in
 * basis points (1800).
 */
export function SeasonsCard({ seasons, onChange }: SeasonsCardProps) {
  return (
    <div className="season-card">
      <h4>Saisons</h4>
      {seasons.map((s) => (
        <SeasonRow key={s.id} season={s} onChange={onChange} />
      ))}
      {seasons.length === 0 ? (
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            padding: "8px 0",
          }}
        >
          Aucune saison configurée.
        </p>
      ) : null}
    </div>
  );
}

function SeasonRow({
  season,
  onChange,
}: {
  season: SeasonRowData;
  onChange: (id: string, multiplier: number) => void;
}) {
  const inputId = useId();
  const display = (season.multiplier / 1000).toFixed(1);

  return (
    <div className="season-row">
      <span
        className="season-swatch"
        style={{ background: SWATCH[season.tier] }}
      />
      <div>
        <div className="name">{season.name}</div>
        <div className="multi">{season.periodLabel}</div>
      </div>
      <label
        htmlFor={inputId}
        style={{
          marginLeft: "auto",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontFamily: "var(--font-mono)",
          fontSize: "0.85rem",
          color: "var(--primary)",
        }}
      >
        <span aria-hidden>×</span>
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          min="0"
          max="10"
          step="0.1"
          value={display}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v) || v < 0) return;
            onChange(season.id, Math.round(v * 1000));
          }}
          style={{
            width: 48,
            padding: "2px 4px",
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            color: "var(--primary)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.85rem",
            textAlign: "right",
          }}
        />
      </label>
    </div>
  );
}
