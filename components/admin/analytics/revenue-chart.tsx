const FR_MONTHS_SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

interface RevenueChartProps {
  /** Current-year monthly revenue in millimes, 12 entries Jan..Dec. */
  currentYear: number[];
  /** Previous-year monthly revenue in millimes, 12 entries Jan..Dec. */
  previousYear: number[];
  currentYearLabel: number;
  previousYearLabel: number;
  /** 0..11 — month to highlight with the tooltip pill. */
  activeMonthIdx: number;
}

const VB_W = 800;
const VB_H = 320;
const PLOT_LEFT = 80;
const PLOT_RIGHT = 740;
const PLOT_TOP = 40;
const PLOT_BOTTOM = 280;

function ceilToBucket(value: number, bucket: number): number {
  if (value <= 0) return bucket;
  return Math.ceil(value / bucket) * bucket;
}

function formatShortK(millimes: number): string {
  // millimes → TND → "K" string. Round to nearest integer K.
  const tnd = millimes / 1000;
  if (tnd >= 1000) return `${Math.round(tnd / 1000)}k`;
  return `${Math.round(tnd)}`;
}

export function RevenueChart({
  currentYear,
  previousYear,
  currentYearLabel,
  previousYearLabel,
  activeMonthIdx,
}: RevenueChartProps) {
  const all = [...currentYear, ...previousYear];
  const maxMillimes = all.reduce((m, v) => (v > m ? v : m), 0);
  // Auto-scale Y to the next 50k-TND bucket above the max value.
  const yTopTnd = Math.max(50_000, ceilToBucket(maxMillimes / 1000, 50_000));
  const yLabels = [yTopTnd, (yTopTnd * 3) / 4, yTopTnd / 2, yTopTnd / 4];

  const xStep = (PLOT_RIGHT - PLOT_LEFT) / 11;
  const plotH = PLOT_BOTTOM - PLOT_TOP;

  const xFor = (i: number) => PLOT_LEFT + i * xStep;
  const yFor = (millimes: number) => {
    const tnd = millimes / 1000;
    const ratio = Math.min(1, yTopTnd > 0 ? tnd / yTopTnd : 0);
    return PLOT_BOTTOM - ratio * plotH;
  };

  const currentPoints = currentYear.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  const previousPoints = previousYear.map((v, i) => ({
    x: xFor(i),
    y: yFor(v),
  }));

  const visibleCurrent = currentPoints.slice(0, activeMonthIdx + 1);
  const currentPath = visibleCurrent
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y.toFixed(2)}`)
    .join(" ");

  let areaPath = "";
  if (visibleCurrent.length > 0) {
    const last = visibleCurrent[visibleCurrent.length - 1];
    const first = visibleCurrent[0];
    if (first && last) {
      areaPath = `${currentPath} L ${last.x} ${PLOT_BOTTOM} L ${first.x} ${PLOT_BOTTOM} Z`;
    }
  }

  const previousPath = previousPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y.toFixed(2)}`)
    .join(" ");

  const activePoint = currentPoints[activeMonthIdx];
  const activeRevenue = currentYear[activeMonthIdx] ?? 0;
  const activeLabel = FR_MONTHS_SHORT[activeMonthIdx] ?? "";

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={{ width: "100%", height: 320 }}
      role="img"
      aria-label={`Revenu mensuel ${currentYearLabel} vs ${previousYearLabel}`}
    >
      <defs>
        <linearGradient id="dy-revenue-grad" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="var(--primary)" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
      </defs>

      <g stroke="var(--border)" strokeDasharray="2,4">
        {yLabels.map((_, i) => {
          const y = PLOT_TOP + ((i + 1) * plotH) / (yLabels.length + 1);
          return <line key={i} x1={PLOT_LEFT} y1={y} x2={PLOT_RIGHT} y2={y} />;
        })}
      </g>

      <g fill="var(--text-dim)" fontSize={11} fontFamily="var(--font-mono)">
        {yLabels.map((tnd, i) => {
          const y = PLOT_TOP + ((i + 1) * plotH) / (yLabels.length + 1);
          return (
            <text key={i} x={PLOT_LEFT - 8} y={y + 4} textAnchor="end">
              {`${Math.round(tnd / 1000)}k`}
            </text>
          );
        })}
      </g>

      {previousPath ? (
        <path
          d={previousPath}
          fill="none"
          stroke="var(--text-dim)"
          strokeWidth={2}
          strokeDasharray="4,3"
        />
      ) : null}

      {areaPath ? (
        <path d={areaPath} fill="url(#dy-revenue-grad)" opacity={0.35} />
      ) : null}
      {currentPath ? (
        <path
          d={currentPath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={3}
        />
      ) : null}

      {visibleCurrent.slice(0, -1).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--primary)" />
      ))}
      {activePoint ? (
        <circle
          cx={activePoint.x}
          cy={activePoint.y}
          r={6}
          fill="var(--bougainvillier)"
          stroke="var(--bg-app)"
          strokeWidth={2}
        />
      ) : null}

      {activePoint ? (
        <g
          transform={`translate(${activePoint.x}, ${Math.max(60, activePoint.y - 28)})`}
        >
          <rect
            x={-50}
            y={-30}
            width={100}
            height={22}
            rx={4}
            fill="var(--bg-surface)"
            stroke="var(--primary)"
          />
          <text
            x={0}
            y={-16}
            textAnchor="middle"
            fill="var(--primary)"
            fontSize={11}
            fontWeight={600}
          >
            {`${activeLabel} · ${formatShortK(activeRevenue)}`}
          </text>
        </g>
      ) : null}

      <g fill="var(--text-dim)" fontSize={11}>
        {FR_MONTHS_SHORT.map((label, i) => (
          <text
            key={label}
            x={xFor(i)}
            y={PLOT_BOTTOM + 25}
            textAnchor="middle"
            fill={i === activeMonthIdx ? "var(--primary)" : "var(--text-dim)"}
            fontWeight={i === activeMonthIdx ? 600 : undefined}
          >
            {label}
          </text>
        ))}
      </g>
    </svg>
  );
}
