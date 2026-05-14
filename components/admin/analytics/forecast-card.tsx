import { Lightbulb, TrendingUp } from "lucide-react";

interface ForecastCardProps {
  monthLabel: string;
  projectedRevenue: number;
  projectedOccupancyPct: number;
  peakWeeks: number[];
  recommendation: string;
}

function formatShortMillimes(millimes: number): string {
  const tnd = millimes / 1000;
  if (tnd >= 1_000_000) {
    return `~ ${(tnd / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  if (tnd >= 1000) {
    return `~ ${Math.round(tnd / 1000)}k`;
  }
  return `~ ${Math.round(tnd)}`;
}

function formatPeakWeeks(weeks: number[]): string {
  if (weeks.length === 0) return "Aucun pic identifié";
  if (weeks.length === 1) return `Semaine ${weeks[0]}`;
  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  return `Semaines ${first}-${last}`;
}

export function ForecastCard({
  monthLabel,
  projectedRevenue,
  projectedOccupancyPct,
  peakWeeks,
  recommendation,
}: ForecastCardProps) {
  return (
    <div className="chart-card">
      <h3>{`Forecast ${monthLabel}`}</h3>
      <div style={{ marginTop: 12 }}>
        <div className="forecast-headline">
          {formatShortMillimes(projectedRevenue)}
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {`TND prévisionnels · ${Math.round(projectedOccupancyPct)}% d'occupation prévue`}
        </div>
        <div className="forecast-tile">
          <strong>
            <TrendingUp
              size={14}
              aria-hidden
              style={{
                verticalAlign: "middle",
                marginRight: 6,
                color: "var(--primary)",
              }}
            />
            Pic prévu :
          </strong>{" "}
          <span style={{ color: "var(--text-muted)" }}>
            {formatPeakWeeks(peakWeeks)}.
          </span>
        </div>
        <div className="forecast-tile is-warning">
          <strong>
            <Lightbulb
              size={14}
              aria-hidden
              style={{ verticalAlign: "middle", marginRight: 6 }}
            />
            Recommandation :
          </strong>{" "}
          <span style={{ color: "var(--text-muted)" }}>{recommendation}</span>
        </div>
      </div>
    </div>
  );
}
