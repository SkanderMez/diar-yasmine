interface DonutSlice {
  key: string;
  label: string;
  count: number;
  pct: number;
  color: string;
}

interface SourceDonutProps {
  slices: DonutSlice[];
  totalCount: number;
}

// Truncated circumference (matches the maquette: stroke-dasharray total = 240,
// the actual 2πr at r=38 is ~238.76 — visually identical).
const DASH_TOTAL = 240;

export function SourceDonut({ slices, totalCount }: SourceDonutProps) {
  const arcs = slices.reduce<
    { key: string; color: string; length: number; offset: number }[]
  >((acc, s) => {
    const length = (s.pct / 100) * DASH_TOTAL;
    const prev = acc[acc.length - 1];
    const cursor = prev ? prev.offset * -1 + prev.length : 0;
    acc.push({ key: s.key, color: s.color, length, offset: -cursor });
    return acc;
  }, []);

  return (
    <div className="donut-wrap">
      <svg
        className="donut"
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Répartition par source — ${totalCount} réservations`}
      >
        <circle
          cx={50}
          cy={50}
          r={38}
          fill="none"
          stroke="var(--bg-surface-2)"
          strokeWidth={12}
        />
        {arcs.map((arc) => (
          <circle
            key={arc.key}
            cx={50}
            cy={50}
            r={38}
            fill="none"
            stroke={arc.color}
            strokeWidth={12}
            strokeDasharray={`${arc.length.toFixed(2)} ${DASH_TOTAL}`}
            strokeDashoffset={arc.offset.toFixed(2)}
            transform="rotate(-90 50 50)"
          />
        ))}
        <text
          x={50}
          y={48}
          textAnchor="middle"
          fill="var(--text)"
          fontSize={13}
          fontWeight={600}
          fontFamily="Fraunces, serif"
        >
          {totalCount}
        </text>
        <text
          x={50}
          y={60}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize={6}
        >
          réservations
        </text>
      </svg>
      <div className="donut-legend">
        {slices.map((s) => (
          <div key={s.key} className="donut-row">
            <span className="name">
              <span className="sw" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="val">{`${Math.round(s.pct)}% · ${s.count}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
