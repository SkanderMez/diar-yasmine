import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentGuest } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { formatTND } from "@/lib/money";

export const metadata: Metadata = {
  title: "Mes réservations",
};

export default async function AccountReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const guest = await getCurrentGuest();
  if (!guest) redirect(`/${locale}/account/login`);

  const reservations = await prisma.reservation.findMany({
    where: { guestId: guest.id, deletedAt: null },
    orderBy: { checkIn: "desc" },
    include: {
      property: {
        select: { name: true, slug: true, type: true },
      },
    },
  });

  const now = new Date();
  const upcoming = reservations.filter(
    (r) => r.checkOut > now && !["CANCELLED", "NO_SHOW"].includes(r.status),
  );
  const past = reservations.filter(
    (r) => r.checkOut <= now || ["CANCELLED", "NO_SHOW"].includes(r.status),
  );

  return (
    <main className="flex-1 bg-ivory pt-28 text-foreground">
      <div className="container-x section-y">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/account"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour au compte
          </Link>

          <p className="eyebrow">Mes réservations</p>
          <h1 className="mt-3 heading-display text-4xl text-foreground sm:text-5xl">
            {reservations.length} séjour{reservations.length > 1 ? "s" : ""}
          </h1>

          {upcoming.length > 0 && (
            <section className="mt-10">
              <h2 className="font-heading text-xl text-foreground">À venir</h2>
              <ul className="mt-4 space-y-3">
                {upcoming.map((r) => (
                  <ReservationRow key={r.id} r={r} />
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <h2 className="font-heading text-xl text-foreground">Historique</h2>
            {past.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Vous n&apos;avez pas encore de séjour passé.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {past.map((r) => (
                  <ReservationRow key={r.id} r={r} />
                ))}
              </ul>
            )}
          </section>

          {reservations.length === 0 && (
            <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <h3 className="font-heading text-2xl text-foreground">
                Aucune réservation pour l&apos;instant
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Lancez-vous — la mer vous attend.
              </p>
              <div className="mt-6">
                <Button asChild shape="pill" size="lg">
                  <Link href="/chalets">Découvrir les chalets</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ReservationRow({
  r,
}: {
  r: {
    id: string;
    code: string;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    status: string;
    total: number;
    property: { name: string; type: string };
  };
}) {
  return (
    <li>
      <Link
        href={`/verify/${r.code}`}
        className="group flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 transition-all hover:border-foreground/30 hover:shadow-md"
      >
        <div>
          <p className="font-heading text-lg text-foreground">
            {r.property.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {r.code} · {r.checkIn.toISOString().slice(0, 10)} →{" "}
            {r.checkOut.toISOString().slice(0, 10)} · {r.nights} nuit
            {r.nights > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">
            {formatTND(r.total)}
          </span>
          <StatusPill status={r.status} />
          <ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
      </Link>
    </li>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    PENDING: {
      bg: "bg-amber-100",
      fg: "text-amber-800",
      label: "À confirmer",
    },
    CONFIRMED: { bg: "bg-primary/10", fg: "text-primary", label: "Confirmée" },
    CHECKED_IN: { bg: "bg-primary/10", fg: "text-primary", label: "En cours" },
    CHECKED_OUT: { bg: "bg-bone", fg: "text-foreground", label: "Terminée" },
    CANCELLED: {
      bg: "bg-destructive/10",
      fg: "text-destructive",
      label: "Annulée",
    },
    NO_SHOW: {
      bg: "bg-destructive/10",
      fg: "text-destructive",
      label: "No-show",
    },
  };
  const s = map[status] ?? {
    bg: "bg-bone",
    fg: "text-foreground",
    label: status,
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${s.bg} ${s.fg}`}
    >
      {s.label}
    </span>
  );
}
