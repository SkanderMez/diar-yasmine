import type { TopUnitRow } from "@/lib/queries";

interface TopUnitsProps {
  items: TopUnitRow[];
  monthLabel: string;
}

/**
 * Compact millimes formatter — "42,8k" / "1,2M" / "850" — using a
 * comma as the decimal separator to match fr-FR conventions.
 */
function formatShortMillimes(millimes: number): string {
  const tnd = millimes / 1000;
  if (tnd >= 1_000_000) {
    return `${(tnd / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  if (tnd >= 1000) {
    return `${(tnd / 1000).toFixed(1).replace(".", ",")}k`;
  }
  return Math.round(tnd).toString();
}

export function TopUnits({ items, monthLabel }: TopUnitsProps) {
  if (items.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-card-head">
          <div>
            <h3>{`Top unités · ${monthLabel}`}</h3>
            <div className="sub">Par revenu généré</div>
          </div>
        </div>
        <p
          style={{
            padding: "16px 0",
            color: "var(--text-muted)",
            fontSize: "0.88rem",
          }}
        >
          Aucune réservation sur ce mois.
        </p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <div>
          <h3>{`Top unités · ${monthLabel}`}</h3>
          <div className="sub">Par revenu généré</div>
        </div>
      </div>
      {items.map((item, idx) => {
        const occPct =
          item.availableNights > 0
            ? Math.min(
                100,
                Math.round((item.occupiedNights / item.availableNights) * 100),
              )
            : 0;
        return (
          <div key={item.id} className="top-row">
            <span className="rank">{idx + 1}</span>
            <div
              className="thumb"
              style={
                item.photoUrl
                  ? { backgroundImage: `url(${item.photoUrl})` }
                  : undefined
              }
              aria-hidden
            />
            <div>
              <div style={{ fontWeight: 500 }}>{item.name}</div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                }}
              >
                {`${item.occupiedNights}j sur ${item.availableNights}`}
              </div>
            </div>
            <div className="occ" aria-hidden>
              <div className="occ-fill" style={{ width: `${occPct}%` }} />
            </div>
            <div className="rev">{formatShortMillimes(item.revenue)}</div>
          </div>
        );
      })}
    </div>
  );
}
