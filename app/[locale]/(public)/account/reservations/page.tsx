import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCurrentGuest } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { formatTND } from "@/lib/money";
import { FadeIn } from "@/components/public/fade-in";

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
    <main className="flex-1 bg-ivory pt-28 pb-24">
      <div className="container-x">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-sm text-charcoal-soft transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-3.5" />
            Retour au compte
          </Link>

          <FadeIn className="mt-6">
            <p className="eyebrow">Mes réservations</p>
            <h1 className="heading-display mt-2 text-4xl text-charcoal sm:text-5xl">
              {reservations.length} séjour{reservations.length > 1 ? "s" : ""}
            </h1>
            <p className="mt-2 text-sm text-charcoal-soft">
              Vos séjours à venir et l&apos;historique complet.
            </p>
          </FadeIn>

          {upcoming.length > 0 && (
            <FadeIn delay="delay-1" className="mt-10">
              <h2 className="font-heading text-xl text-charcoal">À venir</h2>
              <ul className="mt-4 space-y-3">
                {upcoming.map((r) => (
                  <ReservationRow key={r.id} r={r} />
                ))}
              </ul>
            </FadeIn>
          )}

          {past.length > 0 && (
            <FadeIn delay="delay-2" className="mt-10">
              <h2 className="font-heading text-xl text-charcoal">Historique</h2>
              <ul className="mt-4 space-y-3">
                {past.map((r) => (
                  <ReservationRow key={r.id} r={r} />
                ))}
              </ul>
            </FadeIn>
          )}

          {reservations.length === 0 && (
            <FadeIn
              delay="delay-1"
              className="mt-10 rounded-lg border border-dashed border-line bg-white p-12 text-center"
            >
              <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-sand text-primary">
                <Calendar className="size-5" />
              </div>
              <h3 className="mt-4 font-heading text-2xl text-charcoal">
                Aucune réservation pour l&apos;instant
              </h3>
              <p className="mt-2 text-sm text-charcoal-soft">
                Lancez-vous — la mer vous attend.
              </p>
              <Link
                href="/chalets"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-ivory transition-all hover:-translate-y-px hover:bg-bougainvillier hover:shadow-md"
              >
                Découvrir les chalets
                <ArrowRight className="size-4" />
              </Link>
            </FadeIn>
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
        className="group flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line-soft bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
      >
        <div className="min-w-0 flex-1">
          <p className="font-heading text-lg text-charcoal">
            {r.property.name}
          </p>
          <p className="mt-1 text-xs text-charcoal-soft">
            <span className="font-mono">{r.code}</span> ·{" "}
            {format(r.checkIn, "d MMM", { locale: fr })} →{" "}
            {format(r.checkOut, "d MMM yyyy", { locale: fr })} · {r.nights} nuit
            {r.nights > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm font-medium text-charcoal">
            {formatTND(r.total)}
          </span>
          <StatusPill status={r.status} />
          <ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </Link>
    </li>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    PENDING: {
      bg: "bg-warning/15",
      fg: "text-warning",
      label: "À confirmer",
    },
    CONFIRMED: {
      bg: "bg-primary/10",
      fg: "text-primary",
      label: "Confirmée",
    },
    CHECKED_IN: {
      bg: "bg-primary/10",
      fg: "text-primary",
      label: "En cours",
    },
    CHECKED_OUT: {
      bg: "bg-sand",
      fg: "text-charcoal-soft",
      label: "Terminée",
    },
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
    bg: "bg-sand",
    fg: "text-charcoal-soft",
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
