import { formatInTimeZone } from "date-fns-tz";
import { Link } from "@/i18n/navigation";
import { TZ } from "@/lib/date";
import type { DashboardWeekDay } from "@/lib/queries";

interface DashboardWeekStripProps {
  days: DashboardWeekDay[];
}

/**
 * 7-day occupancy mini-bar. Each column shows a bar height proportional
 * to that day's occupancy %, plus the day label and a tooltip with the
 * exact count.
 */
export function DashboardWeekStrip({ days }: DashboardWeekStripProps) {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel-head">
        <h3>
          <span className="dashboard-panel-emoji" aria-hidden="true">
            📅
          </span>
          Cette semaine
        </h3>
        <Link href="/admin/calendar" className="dashboard-panel-link">
          Calendrier complet
        </Link>
      </header>

      <div className="dashboard-week-strip">
        {days.map((day, i) => {
          const dow = formatInTimeZone(day.date, TZ, "EEE");
          const dnum = formatInTimeZone(day.date, TZ, "d");
          const isToday = i === 0;
          return (
            <div
              key={day.date.toISOString()}
              className={`dashboard-week-day${isToday ? " is-today" : ""}`}
              title={`${day.occupied} unités occupées · ${day.occupancyPct}%`}
            >
              <div className="dashboard-week-bar-track" aria-hidden="true">
                <div
                  className="dashboard-week-bar-fill"
                  style={{ height: `${Math.max(4, day.occupancyPct)}%` }}
                />
              </div>
              <div className="dashboard-week-pct">{day.occupancyPct}%</div>
              <div className="dashboard-week-dow">{dow}</div>
              <div className="dashboard-week-dnum">{dnum}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
