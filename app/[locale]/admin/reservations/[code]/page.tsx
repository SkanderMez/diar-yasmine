import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Calendar, Mail, MapPin, Phone, Users } from "lucide-react";
import { findReservationByCode } from "@/lib/queries";
import { formatTND } from "@/lib/money";
import { formatLocalized } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusActions } from "@/components/admin/reservation-detail/status-actions";
import { AddPaymentDialog } from "@/components/admin/reservation-detail/add-payment-dialog";
import { sourceBgClass } from "@/components/admin/calendar/legend";

const STATUS_LABEL = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CHECKED_IN: "Arrivée enregistrée",
  CHECKED_OUT: "Départ enregistré",
  CANCELLED: "Annulée",
  NO_SHOW: "No-show",
} as const;

const SOURCE_LABEL = {
  DIRECT_WEB: "Site direct",
  WALK_IN: "Walk-in",
  PHONE: "Téléphone",
  PARTNER: "Partenaire",
  BOOKING: "Booking.com",
  AIRBNB: "Airbnb",
  EXPEDIA: "Expedia",
  OTHER: "Autre",
} as const;

const METHOD_LABEL = {
  CASH: "Espèces",
  CARD: "Carte",
  TRANSFER: "Virement",
  STRIPE: "Stripe",
  FLOUCI: "Flouci",
  KONNECT: "Konnect",
  OTHER: "Autre",
} as const;

const PAYMENT_STATUS_LABEL = {
  PENDING: "En attente",
  SUCCEEDED: "Reçu",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
  PARTIALLY_REFUNDED: "Partiellement remboursé",
} as const;

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  const data = await findReservationByCode(code);
  if (!data) notFound();

  const { reservation, audit } = data;
  const balance = reservation.total - reservation.paidAmount;
  const extras = Array.isArray(reservation.extras)
    ? (reservation.extras as { label: string; amount: number }[])
    : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`size-3 rounded-full ${sourceBgClass(reservation.source)}`}
              aria-hidden
            />
            <h1 className="font-mono text-2xl text-foreground">
              {reservation.code}
            </h1>
            <Badge variant="secondary">
              {STATUS_LABEL[reservation.status]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {SOURCE_LABEL[reservation.source]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Créée le{" "}
            {formatLocalized(reservation.createdAt, "d MMM yyyy HH:mm")}
            {reservation.createdBy
              ? ` par ${reservation.createdBy.name}`
              : null}
          </p>
        </div>
        <StatusActions
          reservationId={reservation.id}
          code={reservation.code}
          currentStatus={reservation.status}
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Séjour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail
                  icon={<MapPin className="size-4" />}
                  label="Hébergement"
                >
                  {reservation.property.type === "CHALET" ? "🏖️" : "🌿"}{" "}
                  {reservation.property.name}
                </Detail>
                <Detail icon={<Calendar className="size-4" />} label="Dates">
                  {formatLocalized(reservation.checkIn, "EEE d MMM yyyy")} →{" "}
                  {formatLocalized(reservation.checkOut, "EEE d MMM yyyy")}
                  <br />
                  <span className="text-muted-foreground">
                    {reservation.nights} nuit
                    {reservation.nights > 1 ? "s" : ""}
                  </span>
                </Detail>
                <Detail icon={<Users className="size-4" />} label="Voyageurs">
                  {reservation.adults} adulte
                  {reservation.adults > 1 ? "s" : ""}
                  {reservation.children > 0
                    ? ` · ${reservation.children} enfant${reservation.children > 1 ? "s" : ""}`
                    : null}
                </Detail>
                <Detail icon={<Phone className="size-4" />} label="Client">
                  {reservation.guest.firstName} {reservation.guest.lastName}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {reservation.guest.phone}
                    {reservation.guest.email ? (
                      <>
                        {" · "}
                        <Mail className="inline size-3" />{" "}
                        {reservation.guest.email}
                      </>
                    ) : null}
                  </span>
                </Detail>
              </div>
              {reservation.guestRequests ? (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Demandes du client
                    </p>
                    <p className="mt-1 text-sm">{reservation.guestRequests}</p>
                  </div>
                </>
              ) : null}
              {reservation.internalNotes ? (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Notes internes
                    </p>
                    <p className="mt-1 text-sm">{reservation.internalNotes}</p>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tarif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <Row
                label={`${reservation.nights} nuit${reservation.nights > 1 ? "s" : ""}`}
                value={formatTND(reservation.basePrice)}
              />
              {reservation.discountAmount > 0 ? (
                <Row
                  label="Remise"
                  value={`- ${formatTND(reservation.discountAmount)}`}
                  tone="success"
                />
              ) : null}
              {extras.map((e, i) => (
                <Row key={i} label={e.label} value={formatTND(e.amount)} />
              ))}
              <Row
                label="Sous-total"
                value={formatTND(reservation.subtotal)}
                tone="muted"
              />
              {reservation.tax > 0 ? (
                <Row
                  label="TVA"
                  value={formatTND(reservation.tax)}
                  tone="muted"
                />
              ) : null}
              <Separator className="my-2" />
              <Row
                label="Total"
                value={formatTND(reservation.total)}
                tone="primary"
                strong
              />
              <Row
                label="Payé"
                value={formatTND(reservation.paidAmount)}
                tone="muted"
              />
              <Row
                label="Solde dû"
                value={formatTND(balance)}
                tone={balance > 0 ? "primary" : "success"}
                strong
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Paiements</CardTitle>
              <AddPaymentDialog
                reservationId={reservation.id}
                remainingBalance={balance}
              />
            </CardHeader>
            <CardContent>
              {reservation.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun paiement enregistré.
                </p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {reservation.payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-baseline justify-between gap-3 py-2"
                    >
                      <div>
                        <p className="font-medium">
                          {METHOD_LABEL[p.method]}{" "}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {PAYMENT_STATUS_LABEL[p.status]}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatLocalized(p.receivedAt, "d MMM yyyy HH:mm")}
                          {p.receivedBy ? ` · ${p.receivedBy.name}` : null}
                          {p.reference ? ` · ${p.reference}` : null}
                        </p>
                      </div>
                      <span className="font-medium">{formatTND(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent>
            {audit.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Pas d&apos;événement.
              </p>
            ) : (
              <ol className="space-y-3 text-sm">
                {audit.map((entry) => (
                  <li key={entry.id} className="space-y-0.5">
                    <p className="font-medium text-foreground">
                      {entry.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatLocalized(entry.timestamp, "d MMM yyyy HH:mm")}
                      {entry.user ? ` · ${entry.user.name}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="text-foreground">{children}</div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone = "default",
  strong = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "success" | "primary";
  strong?: boolean;
}) {
  const toneClass =
    tone === "muted"
      ? "text-muted-foreground"
      : tone === "success"
        ? "text-success"
        : tone === "primary"
          ? "text-primary"
          : "text-foreground";
  return (
    <div className="flex items-baseline justify-between">
      <span className={`${toneClass} ${strong ? "font-medium" : ""}`}>
        {label}
      </span>
      <span className={`${toneClass} ${strong ? "font-medium" : ""}`}>
        {value}
      </span>
    </div>
  );
}
