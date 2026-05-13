"use client";

import { Calendar, MapPin, Phone, Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTND } from "@/lib/money";
import { formatLocalized } from "@/lib/date";
import type { CalendarReservation } from "@/lib/queries";
import { sourceBgClass } from "./legend";

const STATUS_LABEL: Record<CalendarReservation["status"], string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CHECKED_IN: "Arrivée enregistrée",
  CHECKED_OUT: "Départ enregistré",
  CANCELLED: "Annulée",
  NO_SHOW: "No-show",
};

const SOURCE_LABEL: Record<CalendarReservation["source"], string> = {
  DIRECT_WEB: "Site direct",
  WALK_IN: "Walk-in",
  PHONE: "Téléphone",
  PARTNER: "Partenaire",
  BOOKING: "Booking.com",
  AIRBNB: "Airbnb",
  EXPEDIA: "Expedia",
  OTHER: "Autre",
};

interface ReservationDrawerProps {
  reservation: CalendarReservation | null;
  propertyName: string | null;
  onClose: () => void;
}

export function ReservationDrawer({
  reservation,
  propertyName,
  onClose,
}: ReservationDrawerProps) {
  const open = !!reservation;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px]">
        {reservation ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full ${sourceBgClass(reservation.source)}`}
                  aria-hidden
                />
                <SheetTitle className="font-mono text-sm">
                  {reservation.code}
                </SheetTitle>
                <Badge variant="secondary" className="ml-auto">
                  {STATUS_LABEL[reservation.status]}
                </Badge>
              </div>
              <SheetDescription>
                Source : {SOURCE_LABEL[reservation.source]}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-6">
              <Row
                icon={<MapPin className="size-4" />}
                label="Hébergement"
                value={propertyName ?? "—"}
              />
              <Row
                icon={<Calendar className="size-4" />}
                label="Séjour"
                value={
                  <>
                    {formatLocalized(reservation.checkIn, "EEE d MMM")} →{" "}
                    {formatLocalized(reservation.checkOut, "EEE d MMM")}
                    <span className="ml-1 text-muted-foreground">
                      ({reservation.nights} nuit
                      {reservation.nights > 1 ? "s" : ""})
                    </span>
                  </>
                }
              />
              <Row
                icon={<Users className="size-4" />}
                label="Voyageurs"
                value={`${reservation.adults} adulte${reservation.adults > 1 ? "s" : ""}${reservation.children ? ` · ${reservation.children} enfant${reservation.children > 1 ? "s" : ""}` : ""}`}
              />
              <Row
                icon={<Phone className="size-4" />}
                label="Client"
                value={
                  <>
                    {reservation.guest.firstName} {reservation.guest.lastName}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {reservation.guest.phone}
                    </span>
                  </>
                }
              />

              <div className="rounded-lg border border-border bg-card p-4">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Total</dt>
                    <dd className="font-medium text-foreground">
                      {formatTND(reservation.total)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Payé</dt>
                    <dd>{formatTND(reservation.paidAmount)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-border pt-1.5">
                    <dt className="font-medium text-foreground">Solde</dt>
                    <dd className="font-medium text-primary">
                      {formatTND(reservation.total - reservation.paidAmount)}
                    </dd>
                  </div>
                </dl>
              </div>

              <Button asChild className="w-full" variant="outline">
                <a href={`/admin/reservations/${reservation.code}`}>
                  Ouvrir la fiche complète
                </a>
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-foreground">{value}</div>
      </div>
    </div>
  );
}
