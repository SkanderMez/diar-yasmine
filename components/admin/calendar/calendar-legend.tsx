interface CalendarLegendProps {
  stats: {
    occupancyPct: number;
    activeCount: number;
    arrivalsToday: number;
    changePct: number;
  };
}

export function CalendarLegend({ stats }: CalendarLegendProps) {
  const changeIsUp = stats.changePct >= 0;
  const changeColor = changeIsUp ? "var(--success)" : "var(--danger)";
  const changeSign = changeIsUp ? "+" : "";

  return (
    <div className="cal-legend">
      <div className="cal-legend-section">
        <span className="label">Source</span>
        <div className="cal-legend-item">
          <span
            className="cal-legend-bar"
            style={{ background: "var(--ch-direct)" }}
            aria-hidden
          />
          Direct
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-bar"
            style={{ background: "var(--ch-booking)" }}
            aria-hidden
          />
          Booking
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-bar"
            style={{ background: "var(--ch-airbnb)" }}
            aria-hidden
          />
          Airbnb
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-bar"
            style={{ background: "var(--ch-expedia)" }}
            aria-hidden
          />
          Expedia
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-bar"
            style={{ background: "var(--ch-walkin)" }}
            aria-hidden
          />
          Walk-in
        </div>
      </div>

      <div className="cal-legend-divider" aria-hidden />

      <div className="cal-legend-section">
        <span className="label">Statut</span>
        <div className="cal-legend-item">
          <span
            className="cal-legend-bar"
            style={{ background: "var(--ch-direct)" }}
            aria-hidden
          />
          Confirmé
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-bar"
            style={{
              background: "transparent",
              border: "1.5px dashed var(--warning)",
            }}
            aria-hidden
          />
          Option
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-bar"
            style={{ background: "var(--primary)" }}
            aria-hidden
          />
          Check-in
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-bar"
            style={{ background: "var(--text-muted)" }}
            aria-hidden
          />
          Check-out
        </div>
      </div>

      <div className="cal-legend-divider" aria-hidden />

      <div className="cal-legend-section">
        <span className="label">Paiement</span>
        <div className="cal-legend-item">
          <PayDot color="#4DD89B" />
          Payée
        </div>
        <div className="cal-legend-item">
          <PayDot color="#FFD166" />
          Acompte
        </div>
        <div className="cal-legend-item">
          <PayDot color="#FF6B6B" />
          Impayée
        </div>
        <div className="cal-legend-item">
          <PayDot color="#97a3ab" />
          Remboursée
        </div>
      </div>

      <div className="cal-legend-divider" aria-hidden />

      <div
        style={{
          marginLeft: "auto",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span>
          <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>
            {stats.occupancyPct}%
          </strong>{" "}
          occupation
        </span>
        <span>
          <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>
            {stats.activeCount}
          </strong>{" "}
          résa actives
        </span>
        <span>
          <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>
            {stats.arrivalsToday}
          </strong>{" "}
          arrivées aujourd&apos;hui
        </span>
        <span>
          <strong style={{ color: changeColor, fontSize: "0.95rem" }}>
            {changeSign}
            {stats.changePct}%
          </strong>{" "}
          vs mois dernier
        </span>
      </div>
    </div>
  );
}

function PayDot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
        boxShadow: `0 0 0 2px ${color}33`,
      }}
      aria-hidden
    />
  );
}
