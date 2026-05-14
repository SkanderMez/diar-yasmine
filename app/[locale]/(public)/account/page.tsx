import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCurrentGuest } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/public/logout-button";
import { FadeIn } from "@/components/public/fade-in";

export const metadata: Metadata = {
  title: "Mon compte",
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const guest = await getCurrentGuest();
  if (!guest) redirect(`/${locale}/account/login`);

  const [reservationsCount, completedCount, upcoming] = await Promise.all([
    prisma.reservation.count({
      where: { guestId: guest.id, deletedAt: null },
    }),
    prisma.reservation.count({
      where: {
        guestId: guest.id,
        deletedAt: null,
        status: { in: ["CHECKED_OUT"] },
      },
    }),
    prisma.reservation.findFirst({
      where: {
        guestId: guest.id,
        deletedAt: null,
        status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
        checkOut: { gte: new Date() },
      },
      orderBy: { checkIn: "asc" },
      include: {
        property: {
          select: { name: true, slug: true, type: true },
        },
      },
    }),
  ]);

  return (
    <main className="flex-1 bg-ivory pt-28 pb-24">
      <div className="container-x">
        <div className="mx-auto max-w-5xl">
          {/* Header row */}
          <FadeIn className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Mon compte</p>
              <h1 className="heading-display mt-2 text-4xl text-charcoal sm:text-5xl">
                Bonjour {guest.firstName}
              </h1>
              <p className="mt-2 text-sm text-charcoal-soft">
                Bienvenue dans votre espace personnel.
              </p>
            </div>
            <LogoutButton />
          </FadeIn>

          {/* Stats row */}
          <FadeIn delay="delay-1" className="mt-10 grid gap-4 sm:grid-cols-3">
            <Stat
              icon={<Calendar className="size-5" />}
              value={String(reservationsCount)}
              label={`séjour${reservationsCount > 1 ? "s" : ""} au total`}
            />
            <Stat
              icon={<Sparkles className="size-5" />}
              value={String(completedCount)}
              label="séjours réalisés"
            />
            <Stat
              icon={<ShieldCheck className="size-5" />}
              value={guest.phoneVerifiedAt ? "Vérifié" : "À vérifier"}
              label="statut compte"
            />
          </FadeIn>

          {/* Next stay */}
          {upcoming && (
            <FadeIn
              delay="delay-2"
              className="mt-8 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-turquoise/10 p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="eyebrow">Prochain séjour</p>
                  <h2 className="mt-2 font-heading text-2xl text-charcoal sm:text-3xl">
                    {upcoming.property.name}
                  </h2>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-charcoal-soft">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {format(upcoming.checkIn, "d MMM", { locale: fr })} →{" "}
                      {format(upcoming.checkOut, "d MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span>
                      {upcoming.nights} nuit{upcoming.nights > 1 ? "s" : ""}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      Tazarka
                    </span>
                  </p>
                </div>
                <Link
                  href={`/verify/${upcoming.code}`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-ivory transition-all hover:-translate-y-px hover:bg-bougainvillier hover:shadow-md"
                >
                  Voir le voucher
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </FadeIn>
          )}

          {/* Sections grid */}
          <FadeIn delay="delay-3" className="mt-8 grid gap-4 sm:grid-cols-2">
            <CardLink
              href="/account/reservations"
              icon={<Calendar className="size-5" />}
              title="Mes réservations"
              body="Historique complet, à venir et passées."
            />
            <CardLink
              href="/contact"
              icon={<User className="size-5" />}
              title="Modifier mes coordonnées"
              body="Pour mettre à jour vos coordonnées, contactez la réception."
            />
          </FadeIn>

          {/* Contact line */}
          <FadeIn
            delay="delay-3"
            className="mt-10 rounded-lg border border-line-soft bg-white p-5 text-center text-sm text-charcoal-soft"
          >
            Une question ? Notre équipe est joignable au{" "}
            <a
              href="tel:+21672000000"
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              <Phone className="size-3.5" />
              +216 72 000 000
            </a>
          </FadeIn>
        </div>
      </div>
    </main>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-line-soft bg-white p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-sand text-primary">
        {icon}
      </span>
      <p className="mt-4 font-heading text-3xl font-normal text-charcoal">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function CardLink({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-lg border border-line-soft bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="flex-1">
        <h3 className="font-heading text-lg text-charcoal">{title}</h3>
        <p className="mt-1 text-sm text-charcoal-soft">{body}</p>
      </div>
      <ChevronRight className="mt-2 size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
