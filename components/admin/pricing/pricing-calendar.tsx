import type { SeasonTier } from "./seasons-card";

export interface PricingDayCell {
  /** ISO YYYY-MM-DD (local). */
  date: string;
  /** Day-of-month number to render. */
  dayNumber: number;
  /** Computed nightly price in millimes; null for "outside" cells. */
  price: number | null;
  /** Season tier this day falls under, or null when outside. */
  season: SeasonTier | null;
  isWeekend: boolean;
  isToday: boolean;
  isOutside: boolean;
  badges: string[];
}

export interface PricingMonth {
  /** Display label, e.g. "Juin 2026". */
  label: string;
  /** 35 or 42 day cells (7 × N weeks), padded with `isOutside: true`. */
  days: PricingDayCell[];
}

interface PricingCalendarProps {
  months: PricingMonth[];
  /** Used for the legend hint at the bottom. */
  unitName: string;
  /** Base price in millimes for the legend. */
  unitBasePrice: number;
}

const DOW_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * Pure presentational two-month price grid. Receives pre-computed cells.
 * No I/O, no state — the orchestrator client recomputes the grid when
 * supplements/multipliers change.
 */
export function PricingCalendar({
  months,
  unitName,
  unitBasePrice,
}: PricingCalendarProps) {
  return (
    <div className="month-grid">
      <div className="two-months">
        {months.map((m) => (
          <MonthBlock key={m.label} month={m} />
        ))}
      </div>

      <CalendarLegend unitName={unitName} unitBasePrice={unitBasePrice} />
    </div>
  );
}

function MonthBlock({ month }: { month: PricingMonth }) {
  const weeks: PricingDayCell[][] = [];
  for (let i = 0; i < month.days.length; i += 7) {
    weeks.push(month.days.slice(i, i + 7));
  }

  return (
    <div>
      <h3 className="month-title">{month.label}</h3>
      <div className="month-row">
        {DOW_LABELS.map((d, i) => (
          <div key={`${d}-${i}`} className="dow-label">
            {d}
          </div>
        ))}
      </div>
      {weeks.map((w, weekIdx) => (
        <div key={weekIdx} className="month-row" style={{ marginTop: 4 }}>
          {w.map((cell) => (
            <DayCell key={cell.date} cell={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}

function DayCell({ cell }: { cell: PricingDayCell }) {
  const classes = ["day-cell"];
  if (cell.isOutside) classes.push("outside");
  if (cell.season) classes.push(cell.season);
  if (cell.isWeekend && !cell.isOutside) classes.push("weekend");
  if (cell.isToday) classes.push("today");

  return (
    <div className={classes.join(" ")}>
      <span className="dnum">{cell.dayNumber}</span>
      {!cell.isOutside && cell.price !== null ? (
        <span className="price">{formatPriceTND(cell.price)}</span>
      ) : null}
      {cell.badges[0] && !cell.isOutside ? (
        <span className="badge-mini">{cell.badges[0]}</span>
      ) : null}
    </div>
  );
}

/**
 * Compact TND formatter for the calendar cells — no currency suffix, just
 * the integer TND value with a thin space thousands separator (matches the
 * maquette: "1 224", "1 408").
 */
function formatPriceTND(millimes: number): string {
  const tnd = Math.round(millimes / 1000);
  return tnd.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function CalendarLegend({
  unitName,
  unitBasePrice,
}: {
  unitName: string;
  unitBasePrice: number;
}) {
  const baseTnd = Math.round(unitBasePrice / 1000);
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "14px 0 4px",
        marginTop: 16,
        borderTop: "1px solid var(--border)",
        fontSize: "0.78rem",
        color: "var(--text-muted)",
        flexWrap: "wrap",
      }}
    >
      <span>
        <strong style={{ color: "var(--text)" }}>Base {unitName} :</strong>{" "}
        {baseTnd} TND / nuit
      </span>
      <span>·</span>
      <span>
        Pic ×1.8 ={" "}
        <strong style={{ color: "var(--bougainvillier)" }}>
          {formatPriceTND(unitBasePrice * 1.8)} TND
        </strong>
      </span>
      <span>·</span>
      <span>+ WE 15% = {formatPriceTND(unitBasePrice * 1.8 * 1.15)} TND</span>
      <span>·</span>
      <span>+ Vac 10% = {formatPriceTND(unitBasePrice * 1.8 * 1.1)} TND</span>
    </div>
  );
}
