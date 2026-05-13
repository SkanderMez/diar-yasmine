import { Download } from "lucide-react";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import { setRequestLocale } from "next-intl/server";
import type { ReservationSource } from "@prisma/client";
import { aggregateReportData } from "@/lib/reports";
import { formatTND } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RevenueByMonthChart,
  SourceMixChart,
} from "@/components/admin/reports/revenue-chart";

/**
 * Phase 6 — Reports & Analytics.
 *
 * Default window: rolling 12 months ending at today. Override via
 * ?start=YYYY-MM-DD&end=YYYY-MM-DD search params.
 */
export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const end = sp.end
    ? new Date(`${sp.end}T00:00:00Z`)
    : startOfMonth(addMonths(new Date(), 1));
  const start = sp.start
    ? new Date(`${sp.start}T00:00:00Z`)
    : startOfMonth(subMonths(end, 12));

  const data = await aggregateReportData({ start, end });

  const exportHref = `/api/reports/export?${new URLSearchParams({
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  }).toString()}`;

  const sourceRows: {
    source: ReservationSource;
    revenue: number;
    nights: number;
  }[] = Object.entries(data.totals.bySource).map(([source, value]) => ({
    source: source as ReservationSource,
    revenue: value.revenue,
    nights: value.nights,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-foreground">Rapports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(start, "MMM yyyy")} →{" "}
            {format(addMonths(end, -1), "MMM yyyy")}
            {" · "}
            {data.totalProperties} hébergements actifs
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <a href={exportHref}>
            <Download className="size-4" />
            Export CSV
          </a>
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Revenu"
          value={formatTND(data.totals.revenue)}
          tone="primary"
        />
        <Kpi
          label="Taux d'occupation"
          value={`${Math.round(data.totals.occupancyRate * 100)}%`}
          hint={`${data.totals.occupiedNights} / ${data.totals.availableNights} nuits`}
        />
        <Kpi
          label="ADR"
          value={formatTND(data.totals.adr)}
          hint="Revenu / nuit occupée"
        />
        <Kpi
          label="RevPAR"
          value={formatTND(data.totals.revpar)}
          hint="Revenu / nuit disponible"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenu mensuel (TND)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueByMonthChart data={data.monthly} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mix par source</CardTitle>
          </CardHeader>
          <CardContent>
            <SourceMixChart data={sourceRows} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail mensuel</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                <th className="py-2 text-left">Mois</th>
                <th className="py-2 text-right">Revenu</th>
                <th className="py-2 text-right">Nuits occupées</th>
                <th className="py-2 text-right">Occupation</th>
                <th className="py-2 text-right">ADR</th>
                <th className="py-2 text-right">RevPAR</th>
              </tr>
            </thead>
            <tbody>
              {data.monthly.map((m) => (
                <tr key={m.month} className="border-b border-border">
                  <td className="py-2">{m.month}</td>
                  <td className="py-2 text-right font-medium text-foreground">
                    {formatTND(m.revenue)}
                  </td>
                  <td className="py-2 text-right">{m.occupiedNights}</td>
                  <td className="py-2 text-right">
                    {Math.round(m.occupancyRate * 100)}%
                  </td>
                  <td className="py-2 text-right">{formatTND(m.adr)}</td>
                  <td className="py-2 text-right">{formatTND(m.revpar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "primary";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            tone === "primary"
              ? "text-3xl font-medium text-primary"
              : "text-3xl font-medium text-foreground"
          }
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
