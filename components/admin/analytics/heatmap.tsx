import type { HeatmapCell, HeatmapIntensity } from "@/lib/queries";

interface HeatmapProps {
  year: number;
  cells: HeatmapCell[];
}

function classForIntensity(intensity: HeatmapIntensity): string {
  if (intensity === "peak") return "heat-cell heat-peak";
  if (intensity === 0) return "heat-cell";
  return `heat-cell heat-${intensity}`;
}

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

export function Heatmap({ year, cells }: HeatmapProps) {
  // First day of the year — weekday is 0=Mon..6=Sun.
  const first = cells[0];
  const leadingBlanks = first ? first.weekday : 0;

  return (
    <>
      <div className="heatmap-grid" aria-label={`Heatmap d'occupation ${year}`}>
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className="heat-cell" aria-hidden />
        ))}
        {cells.map((c) => (
          <div
            key={c.date}
            className={classForIntensity(c.intensity)}
            title={`${c.date} · ${c.occupied} unités occupées`}
          />
        ))}
      </div>
      <div className="heatmap-months">
        {FR_MONTHS_SHORT.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </>
  );
}
