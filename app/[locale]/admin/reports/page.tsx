import { setRequestLocale } from "next-intl/server";
import {
  getAnalyticsKpis,
  getGuestOriginSplit,
  getKpiSparklines,
  getLengthOfStayDistribution,
  getNextMonthForecast,
  getRevenueMonthly,
  getSourceSplit,
  getTopUnits,
  getYearHeatmap,
} from "@/lib/queries";
import { KpiCard } from "@/components/admin/analytics/kpi-card";
import { RevenueChart } from "@/components/admin/analytics/revenue-chart";
import { SourceDonut } from "@/components/admin/analytics/source-donut";
import { Heatmap } from "@/components/admin/analytics/heatmap";
import { TopUnits } from "@/components/admin/analytics/top-units";
import { LengthOfStay } from "@/components/admin/analytics/length-of-stay";
import { GuestOrigin } from "@/components/admin/analytics/guest-origin";
import { ForecastCard } from "@/components/admin/analytics/forecast-card";
import { MonthPicker } from "@/components/admin/analytics/month-picker";
import { ExportButton } from "@/components/admin/analytics/export-button";

const FR_MONTHS_FULL = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function currentMonthIso(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseMonthOrCurrent(input: string | undefined): {
  iso: string;
  year: number;
  monthIdx: number;
  label: string;
} {
  const fallback = currentMonthIso();
  const candidate =
    input && /^[0-9]{4}-[0-9]{2}$/.test(input) ? input : fallback;
  const [yearStr, monthStr] = candidate.split("-");
  const year = Number.parseInt(yearStr ?? "2026", 10);
  const monthIdx = Number.parseInt(monthStr ?? "01", 10) - 1;
  const safeMonthIdx =
    monthIdx >= 0 && monthIdx <= 11 ? monthIdx : new Date().getUTCMonth();
  return {
    iso: candidate,
    year,
    monthIdx: safeMonthIdx,
    label: `${FR_MONTHS_FULL[safeMonthIdx] ?? ""} ${year}`,
  };
}

const CHANNEL_COLORS: Record<string, string> = {
  direct: "var(--ch-direct)",
  booking: "var(--ch-booking)",
  airbnb: "var(--ch-airbnb)",
  expedia: "var(--ch-expedia)",
};

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const month = parseMonthOrCurrent(sp.month);

  const [
    kpis,
    sparklines,
    revenueMonthly,
    sourceSplit,
    heatmapCells,
    topUnits,
    losDist,
    guestOrigin,
    forecast,
  ] = await Promise.all([
    getAnalyticsKpis(month.iso),
    getKpiSparklines(month.iso),
    getRevenueMonthly(month.year),
    getSourceSplit(month.iso),
    getYearHeatmap(month.year),
    getTopUnits(month.iso, 5),
    getLengthOfStayDistribution(month.iso),
    getGuestOriginSplit(month.iso),
    getNextMonthForecast(month.iso),
  ]);

  const donutSlices = sourceSplit.rows.map((r) => ({
    key: r.key,
    label: r.label,
    count: r.count,
    pct: r.pct,
    color: CHANNEL_COLORS[r.key] ?? "var(--text-muted)",
  }));

  const revenueDeltaText =
    Number.isFinite(kpis.revenue.deltaPct) && kpis.revenue.prevValue > 0
      ? `${kpis.revenue.deltaPct >= 0 ? "+" : ""}${kpis.revenue.deltaPct.toFixed(1)}% vs mois précédent`
      : "— vs mois précédent";
  const occDeltaText = `${kpis.occupancy.deltaPts >= 0 ? "+" : ""}${kpis.occupancy.deltaPts.toFixed(0)} pts vs mois précédent`;
  const adrDeltaText =
    Number.isFinite(kpis.adr.deltaPct) && kpis.adr.prevValue > 0
      ? `${kpis.adr.deltaPct >= 0 ? "+" : ""}${kpis.adr.deltaPct.toFixed(1)}% vs mois précédent`
      : "— vs mois précédent";
  const revparDeltaText =
    Number.isFinite(kpis.revpar.deltaPct) && kpis.revpar.prevValue > 0
      ? `${kpis.revpar.deltaPct >= 0 ? "+" : ""}${kpis.revpar.deltaPct.toFixed(1)}% vs mois précédent`
      : "— vs mois précédent";

  const revenueValueTnd = Math.round(kpis.revenue.value / 1000);
  const adrValueTnd = Math.round(kpis.adr.value / 1000);
  const revparValueTnd = Math.round(kpis.revpar.value / 1000);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Rapports & Analytics</h1>
          <p>{`Performance du domaine · ${month.label}`}</p>
        </div>
        <div className="page-actions">
          <MonthPicker currentMonth={month.iso} label={month.label} />
          <button
            type="button"
            className="btn-admin btn-admin-secondary"
            disabled
            aria-disabled
          >
            Comparer
          </button>
          <ExportButton month={month.iso} />
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          label="Revenu mensuel"
          value={revenueValueTnd.toLocaleString("fr-FR")}
          unit="TND"
          trend={{
            direction: kpis.revenue.deltaPct >= 0 ? "up" : "down",
            text: revenueDeltaText,
          }}
          sparkline={sparklines.revenue}
          color="primary"
        />
        <KpiCard
          label="Taux d'occupation"
          value={Math.round(kpis.occupancy.pct).toString()}
          unit="%"
          trend={{
            direction: kpis.occupancy.deltaPts >= 0 ? "up" : "down",
            text: occDeltaText,
          }}
          sparkline={sparklines.occupancy}
          color="success"
        />
        <KpiCard
          label={
            <>
              ADR{" "}
              <span style={{ fontSize: "0.72rem", fontWeight: 400 }}>
                (prix nuit)
              </span>
            </>
          }
          value={adrValueTnd.toLocaleString("fr-FR")}
          unit="TND"
          trend={{
            direction: kpis.adr.deltaPct >= 0 ? "up" : "down",
            text: adrDeltaText,
          }}
          sparkline={sparklines.adr}
          color="accent"
        />
        <KpiCard
          label="RevPAR"
          value={revparValueTnd.toLocaleString("fr-FR")}
          unit="TND"
          trend={{
            direction: kpis.revpar.deltaPct >= 0 ? "up" : "down",
            text: revparDeltaText,
          }}
          sparkline={sparklines.revpar}
          color="bougainvillier"
        />
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <h3>Revenu mensuel · 12 derniers mois</h3>
              <div className="sub">Comparaison année courante vs N-1</div>
            </div>
            <div className="chart-legend">
              <span>
                <span
                  className="dot"
                  style={{ background: "var(--primary)" }}
                />
                {revenueMonthly.currentYear}
              </span>
              <span>
                <span
                  className="dot"
                  style={{ background: "var(--text-dim)" }}
                />
                {revenueMonthly.previousYear}
              </span>
            </div>
          </div>
          <RevenueChart
            currentYear={revenueMonthly.current}
            previousYear={revenueMonthly.previous}
            currentYearLabel={revenueMonthly.currentYear}
            previousYearLabel={revenueMonthly.previousYear}
            activeMonthIdx={month.monthIdx}
          />
        </div>

        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <h3>Répartition par source</h3>
              <div className="sub">{`${month.label} · ${sourceSplit.totalCount} réservations`}</div>
            </div>
          </div>
          {sourceSplit.totalCount === 0 ? (
            <p
              style={{
                padding: "16px 0",
                color: "var(--text-muted)",
                fontSize: "0.88rem",
              }}
            >
              Pas encore de réservation sur ce mois.
            </p>
          ) : (
            <SourceDonut
              slices={donutSlices}
              totalCount={sourceSplit.totalCount}
            />
          )}
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-card-head">
            <div>
              <h3>{`Heatmap d'occupation · ${month.year}`}</h3>
              <div className="sub">
                {`Chaque cellule = 1 jour · plus c'est sombre, plus l'occupation est élevée`}
              </div>
            </div>
            <div className="chart-legend">
              <span style={{ marginRight: 8 }}>Moins</span>
              <span
                className="dot"
                style={{ background: "rgba(79,184,196,0.2)" }}
              />
              <span
                className="dot"
                style={{ background: "rgba(79,184,196,0.4)" }}
              />
              <span
                className="dot"
                style={{ background: "rgba(79,184,196,0.6)" }}
              />
              <span className="dot" style={{ background: "var(--primary)" }} />
              <span
                className="dot"
                style={{ background: "var(--bougainvillier)" }}
              />
              <span style={{ marginLeft: 8 }}>Plus</span>
            </div>
          </div>
          <Heatmap year={month.year} cells={heatmapCells} />
        </div>

        <TopUnits
          items={topUnits}
          monthLabel={month.label.split(" ")[0] ?? month.label}
        />
      </div>

      <div className="analytics-bottom-grid">
        <LengthOfStay
          avgNights={losDist.avgNights}
          distribution={losDist.distribution}
        />
        <GuestOrigin countries={guestOrigin} />
        <ForecastCard
          monthLabel={forecast.monthLabel}
          projectedRevenue={forecast.projectedRevenue}
          projectedOccupancyPct={forecast.projectedOccupancyPct}
          peakWeeks={forecast.peakWeeks}
          recommendation={forecast.recommendation}
        />
      </div>
    </div>
  );
}
