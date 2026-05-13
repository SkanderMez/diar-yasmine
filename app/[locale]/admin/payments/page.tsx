import { Download } from "lucide-react";
import { addDays, format, isValid, parseISO, startOfDay } from "date-fns";
import { setRequestLocale } from "next-intl/server";
import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import { listPaymentsForRange } from "@/lib/queries";
import { formatTND } from "@/lib/money";
import { formatLocalized } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentsFilters } from "@/components/admin/payments/filters";
import { RefundButton } from "@/components/admin/payments/refund-button";

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  SUCCEEDED: "Reçu",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
  PARTIALLY_REFUNDED: "Partiel",
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Espèces",
  CARD: "Carte",
  TRANSFER: "Virement",
  STRIPE: "Stripe",
  FLOUCI: "Flouci",
  KONNECT: "Konnect",
  OTHER: "Autre",
};

const ALL_METHODS: PaymentMethod[] = [
  "CASH",
  "CARD",
  "TRANSFER",
  "STRIPE",
  "FLOUCI",
  "KONNECT",
  "OTHER",
];

export default async function PaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    start?: string;
    end?: string;
    method?: string;
    status?: string;
    q?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const today = startOfDay(new Date());
  const startParsed = sp.start ? parseISO(sp.start) : today;
  const endParsed = sp.end ? parseISO(sp.end) : today;
  const start = isValid(startParsed) ? startOfDay(startParsed) : today;
  // `end` is INCLUSIVE in the UI but the DB query uses [, ) so add 1 day.
  const endInclusive = isValid(endParsed) ? startOfDay(endParsed) : today;
  const endExclusive = addDays(endInclusive, 1);

  const { payments, totals } = await listPaymentsForRange({
    start,
    end: endExclusive,
    method: ALL_METHODS.includes(sp.method as PaymentMethod)
      ? (sp.method as PaymentMethod)
      : undefined,
    status: [
      "PENDING",
      "SUCCEEDED",
      "FAILED",
      "REFUNDED",
      "PARTIALLY_REFUNDED",
    ].includes(sp.status as PaymentStatus)
      ? (sp.status as PaymentStatus)
      : undefined,
    query: sp.q?.trim() || undefined,
  });

  // Aggregate totals per-method for the SUCCEEDED slice (the cash drawer
  // reconciliation cares about money actually received, not failed/pending).
  const succeededTotals = totals.filter((t) => t.status === "SUCCEEDED");
  const grandTotal = succeededTotals.reduce(
    (acc, t) => acc + (t._sum.amount ?? 0),
    0,
  );
  const refundedTotal = totals
    .filter((t) => t.status === "REFUNDED")
    .reduce((acc, t) => acc + (t._sum.amount ?? 0), 0);

  const exportHref = `/api/payments/export?${new URLSearchParams({
    start: format(start, "yyyy-MM-dd"),
    end: format(endInclusive, "yyyy-MM-dd"),
    ...(sp.method ? { method: sp.method } : {}),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.q ? { q: sp.q } : {}),
  }).toString()}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-foreground">Paiements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(start, "d MMM yyyy")} → {format(endInclusive, "d MMM yyyy")}
            {" · "}
            {payments.length} mouvement{payments.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <a href={exportHref}>
            <Download className="size-4" />
            Export CSV
          </a>
        </Button>
      </header>

      <PaymentsFilters
        defaults={{
          start: format(start, "yyyy-MM-dd"),
          end: format(endInclusive, "yyyy-MM-dd"),
          method: sp.method,
          status: sp.status,
          q: sp.q,
        }}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
              Reçu (net de remboursements)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-medium text-primary">
              {formatTND(grandTotal - refundedTotal)}
            </p>
          </CardContent>
        </Card>
        {ALL_METHODS.map((m) => {
          const total = succeededTotals
            .filter((t) => t.method === m)
            .reduce((acc, t) => acc + (t._sum.amount ?? 0), 0);
          if (total === 0) return null;
          return (
            <Card key={m}>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
                  {METHOD_LABEL[m]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-medium text-foreground">
                  {formatTND(total)}
                </p>
              </CardContent>
            </Card>
          );
        })}
        {refundedTotal > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
                Remboursé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-medium text-destructive">
                − {formatTND(refundedTotal)}
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mouvements</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun paiement sur cette période.
            </p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-baseline gap-3 py-3"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {format(p.receivedAt, "dd/MM HH:mm")}
                  </span>
                  <span className="font-medium text-foreground">
                    {METHOD_LABEL[p.method]}
                  </span>
                  <Badge
                    variant={
                      p.status === "SUCCEEDED"
                        ? "secondary"
                        : p.status === "REFUNDED"
                          ? "destructive"
                          : "outline"
                    }
                    className="text-[10px]"
                  >
                    {STATUS_LABEL[p.status]}
                  </Badge>
                  <a
                    href={`/admin/reservations/${p.reservation.code}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {p.reservation.code}
                  </a>
                  <span className="text-muted-foreground">
                    {p.reservation.guest.firstName}{" "}
                    {p.reservation.guest.lastName} ·{" "}
                    {p.reservation.property.name}
                  </span>
                  {p.reference && (
                    <span className="text-xs text-muted-foreground">
                      réf : {p.reference}
                    </span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-3">
                    <span
                      className={
                        p.status === "REFUNDED"
                          ? "font-medium text-destructive line-through"
                          : "font-medium text-foreground"
                      }
                    >
                      {formatTND(p.amount)}
                    </span>
                    {p.status === "SUCCEEDED" && (
                      <RefundButton
                        paymentId={p.id}
                        amountLabel={formatTND(p.amount)}
                      />
                    )}
                  </span>
                  {formatLocalized(p.receivedAt, "EEE") && p.receivedBy ? (
                    <span className="basis-full text-[10px] text-muted-foreground">
                      Encaissé par {p.receivedBy.name}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
