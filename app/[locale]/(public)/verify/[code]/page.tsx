import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Calendar, Home, XCircle } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { isValidReservationCode } from "@/lib/code";
import { formatLocalized } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Vérifier un voucher",
  robots: { index: false },
};

/**
 * Public voucher verification page. Anyone scanning the QR on a voucher
 * lands here and sees enough to confirm the booking is real, but no PII.
 *
 * - Valid + active → "Réservation valide", property + dates + status.
 * - Cancelled / no-show → red banner.
 * - Unknown code → 404.
 *
 * Cache: dynamic (status may flip). No-index by metadata.
 */
export const dynamic = "force-dynamic";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  if (!isValidReservationCode(code)) notFound();

  const reservation = await prisma.reservation.findUnique({
    where: { code },
    select: {
      code: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      status: true,
      deletedAt: true,
      property: { select: { name: true, type: true } },
    },
  });
  if (!reservation || reservation.deletedAt) notFound();

  const isActive = !["CANCELLED", "NO_SHOW"].includes(reservation.status);

  return (
    <main className="flex flex-1 items-center justify-center bg-sand py-20">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <Card className="overflow-hidden">
          <CardHeader
            className={
              isActive
                ? "border-b border-border bg-success/10 text-success"
                : "border-b border-border bg-destructive/10 text-destructive"
            }
          >
            <CardTitle className="flex items-center gap-2">
              {isActive ? (
                <>
                  <CheckCircle2 className="size-5" />
                  Réservation valide
                </>
              ) : (
                <>
                  <XCircle className="size-5" />
                  Réservation invalide
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-6">
            <div className="font-mono text-lg text-primary">
              {reservation.code}
            </div>
            <Row
              icon={<Home className="size-4" />}
              label="Hébergement"
              value={`${reservation.property.type === "CHALET" ? "🏖️" : "🌿"} ${reservation.property.name}`}
            />
            <Row
              icon={<Calendar className="size-4" />}
              label="Séjour"
              value={`${formatLocalized(reservation.checkIn, "d MMM yyyy")} → ${formatLocalized(reservation.checkOut, "d MMM yyyy")} · ${reservation.nights} nuit${reservation.nights > 1 ? "s" : ""}`}
            />
            <p className="border-t border-border pt-4 text-xs text-muted-foreground">
              Cette vérification confirme l&apos;authenticité de la réservation.
              Pour toute question, contactez la réception.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-foreground">{value}</p>
      </div>
    </div>
  );
}
