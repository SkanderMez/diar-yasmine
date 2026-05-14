import { setRequestLocale } from "next-intl/server";
import { Calendar, Plus, Receipt, Tag, Users } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { Link } from "@/i18n/navigation";
import { TZ } from "@/lib/date";
import { getDashboardData } from "@/lib/queries";
import { DashboardKpiCards } from "@/components/admin/dashboard/dashboard-kpi-cards";
import { DashboardArrivals } from "@/components/admin/dashboard/dashboard-arrivals";
import { DashboardDepartures } from "@/components/admin/dashboard/dashboard-departures";
import { DashboardActivityFeed } from "@/components/admin/dashboard/dashboard-activity-feed";
import { DashboardWeekStrip } from "@/components/admin/dashboard/dashboard-week-strip";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getDashboardData();

  const todayLabel = formatInTimeZone(data.todayStart, TZ, "EEEE d MMMM yyyy");

  const subtitleParts: string[] = [
    capitalize(todayLabel),
    `${data.kpis.checkinsToday} arrivée${data.kpis.checkinsToday > 1 ? "s" : ""}`,
    `${data.kpis.checkoutsToday} départ${data.kpis.checkoutsToday > 1 ? "s" : ""}`,
    `${data.kpis.occupancyPct}% occupation`,
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Vue d&apos;ensemble</h1>
          <p>{subtitleParts.join(" · ")}</p>
        </div>
        <div className="page-actions">
          <Link
            href="/admin/calendar"
            className="btn-admin btn-admin-secondary"
          >
            <Calendar className="size-3.5" />
            Calendrier
          </Link>
          <Link
            href="/admin/reservations/new"
            className="btn-admin btn-admin-primary"
          >
            <Plus className="size-3.5" />
            Nouvelle résa
          </Link>
        </div>
      </div>

      <DashboardKpiCards kpis={data.kpis} />

      <div className="dashboard-grid-two">
        <DashboardArrivals arrivals={data.arrivals} />
        <DashboardDepartures departures={data.departures} />
      </div>

      <div className="dashboard-grid-two">
        <DashboardWeekStrip days={data.week} />
        <DashboardActivityFeed entries={data.activity} />
      </div>

      <section className="dashboard-quick-links">
        <Link href="/admin/calendar" className="dashboard-quick-link">
          <Calendar className="size-4" />
          <div>
            <div className="dashboard-quick-title">Ouvrir le calendrier</div>
            <div className="dashboard-quick-sub">
              Vue timeline · drag &amp; drop
            </div>
          </div>
        </Link>
        <Link href="/admin/payments" className="dashboard-quick-link">
          <Receipt className="size-4" />
          <div>
            <div className="dashboard-quick-title">Caisse</div>
            <div className="dashboard-quick-sub">
              Encaisser un paiement, exporter en CSV
            </div>
          </div>
        </Link>
        <Link href="/admin/clients" className="dashboard-quick-link">
          <Users className="size-4" />
          <div>
            <div className="dashboard-quick-title">Clients</div>
            <div className="dashboard-quick-sub">
              Annuaire des invités &amp; fidélité
            </div>
          </div>
        </Link>
        <Link href="/admin/pricing" className="dashboard-quick-link">
          <Tag className="size-4" />
          <div>
            <div className="dashboard-quick-title">Tarification</div>
            <div className="dashboard-quick-sub">
              Saisons, suppléments, séjour minimum
            </div>
          </div>
        </Link>
      </section>
    </>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
