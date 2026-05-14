import { TrendingDown, TrendingUp } from "lucide-react";

type KpiColor = "primary" | "success" | "accent" | "bougainvillier";

interface KpiTrend {
  direction: "up" | "down";
  text: string;
}

interface KpiCardProps {
  label: React.ReactNode;
  value: string;
  unit?: string;
  trend: KpiTrend | null;
  sparkline: number[];
  color?: KpiColor;
}

const STROKE_BY_COLOR: Record<KpiColor, string> = {
  primary: "var(--primary)",
  success: "var(--success)",
  accent: "var(--accent)",
  bougainvillier: "var(--bougainvillier)",
};

/**
 * Build a monotonic linear `M..L..` path string normalised to the 200×36
 * sparkline viewBox. Series with no variance still render on the midline
 * thanks to a 1px floor on the value range.
 */
function buildSparklinePath(series: number[]): string {
  if (series.length === 0) return "";
  const w = 200;
  const h = 36;
  const padding = 1;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(1, max - min);
  const stepX = series.length > 1 ? w / (series.length - 1) : 0;
  return series
    .map((v, i) => {
      const x = i * stepX;
      const ratio = (v - min) / range;
      const y = padding + (1 - ratio) * (h - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function KpiCard({
  label,
  value,
  unit,
  trend,
  sparkline,
  color = "primary",
}: KpiCardProps) {
  const stroke = STROKE_BY_COLOR[color];
  const path = buildSparklinePath(sparkline);
  const trendClass =
    trend?.direction === "down" ? "kpi-trend down" : "kpi-trend up";

  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}
        {unit ? (
          <span
            style={{
              fontSize: "1rem",
              color: "var(--text-muted)",
              fontWeight: 400,
              marginLeft: 6,
            }}
          >
            {unit}
          </span>
        ) : null}
      </div>
      {trend ? (
        <div className={trendClass}>
          {trend.direction === "up" ? (
            <TrendingUp size={12} aria-hidden />
          ) : (
            <TrendingDown size={12} aria-hidden />
          )}
          <span>{trend.text}</span>
        </div>
      ) : null}
      <div className="kpi-sparkline" aria-hidden>
        <svg viewBox="0 0 200 36" preserveAspectRatio="none">
          {path ? (
            <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
          ) : null}
        </svg>
      </div>
    </div>
  );
}
