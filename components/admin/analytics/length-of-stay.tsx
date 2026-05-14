import { TrendingDown, TrendingUp } from "lucide-react";
import type { StayBucket } from "@/lib/queries";

interface LengthOfStayProps {
  avgNights: number;
  distribution: { bucket: StayBucket; pct: number }[];
  delta?: number;
}

const BUCKET_LABEL: Record<StayBucket, string> = {
  "1": "1n",
  "2": "2n",
  "3": "3n",
  "4": "4n",
  "5": "5n",
  "6": "6n",
  "7+": "7n+",
};

const BUCKET_OPACITY: Record<StayBucket, number> = {
  "1": 0.3,
  "2": 0.45,
  "3": 0.65,
  "4": 1,
  "5": 0.85,
  "6": 0.55,
  "7+": 0.35,
};

export function LengthOfStay({
  avgNights,
  distribution,
  delta,
}: LengthOfStayProps) {
  const maxPct = distribution.reduce((m, d) => (d.pct > m ? d.pct : m), 0);
  const trendDirection = (delta ?? 0) >= 0 ? "up" : "down";
  const trendText =
    delta === undefined
      ? null
      : delta >= 0
        ? `+${delta.toFixed(1)} vs mois précédent`
        : `${delta.toFixed(1)} vs mois précédent`;

  return (
    <div className="chart-card">
      <h3>Durée moyenne de séjour</h3>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          marginTop: 12,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2.75rem",
            fontWeight: 500,
          }}
        >
          {avgNights.toFixed(1).replace(".", ",")}
        </span>
        <span style={{ color: "var(--text-muted)" }}>nuits</span>
        {trendText ? (
          <span
            className={`kpi-trend ${trendDirection}`}
            style={{ marginLeft: "auto" }}
          >
            {trendDirection === "up" ? (
              <TrendingUp size={12} aria-hidden />
            ) : (
              <TrendingDown size={12} aria-hidden />
            )}
            <span>{trendText}</span>
          </span>
        ) : null}
      </div>
      <div className="stay-bars" aria-hidden>
        {distribution.map((d) => {
          const heightPct = maxPct > 0 ? (d.pct / maxPct) * 100 : 0;
          return (
            <div
              key={d.bucket}
              style={{
                opacity: BUCKET_OPACITY[d.bucket],
                height: `${Math.max(2, heightPct)}%`,
              }}
              title={`${BUCKET_LABEL[d.bucket]} · ${Math.round(d.pct)}%`}
            />
          );
        })}
      </div>
      <div className="stay-bars-labels">
        {distribution.map((d) => (
          <span key={d.bucket}>{BUCKET_LABEL[d.bucket]}</span>
        ))}
      </div>
    </div>
  );
}
