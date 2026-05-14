import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Calendar, LogOut, Phone, ShieldCheck, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentGuest } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/public/logout-button";

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

  const [reservationsCount, upcoming] = await Promise.all([
    prisma.reservation.count({
      where: { guestId: guest.id, deletedAt: null },
    }),
    prisma.reservation.findFirst({
      where: {
        guestId: guest.id,
        deletedAt: null,
        status: { in: ["PENDING", "CONFIRMED"] },
        checkIn: { gte: new Date() },
      },
      orderBy: { checkIn: "asc" },
      include: {
        property: { select: { name: true, slug: true, type: true } },
      },
    }),
  ]);

  return (
    <main className="flex-1 bg-ivory pt-28 text-foreground">
      <div className="container-x section-y">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="eyebrow">Mon compte</p>
              <h1 className="mt-3 heading-display text-4xl text-foreground sm:text-5xl">
                Bonjour {guest.firstName}
              </h1>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <Stat
              icon={<Calendar className="size-5" />}
              value={String(reservationsCount)}
              label="séjour(s)"
            />
            <Stat
              icon={<Phone className="size-5" />}
              value={guest.phone}
              label="téléphone"
              compact
            />
            <Stat
              icon={<ShieldCheck className="size-5" />}
              value={guest.phoneVerifiedAt ? "Vérifié" : "À vérifier"}
              label="statut"
            />
          </div>

          {upcoming && (
            <section className="mt-10 rounded-3xl border border-primary/20 bg-primary/5 p-6">
              <p className="eyebrow">Prochain séjour</p>
              <h2 className="mt-2 font-heading text-2xl text-foreground">
                {upcoming.property.name}
              </h2>
              <p className="mt-1 text-sm text-foreground/75">
                {upcoming.checkIn.toISOString().slice(0, 10)} →{" "}
                {upcoming.checkOut.toISOString().slice(0, 10)} ·{" "}
                {upcoming.nights} nuit{upcoming.nights > 1 ? "s" : ""}
              </p>
              <div className="mt-4">
                <Button asChild shape="pill" size="sm" variant="outline">
                  <Link href={`/verify/${upcoming.code}`}>
                    Voir ma réservation
                  </Link>
                </Button>
              </div>
            </section>
          )}

          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            <CardLink
              href="/account/reservations"
              icon={<Calendar className="size-5" />}
              title="Mes réservations"
              body="Historique complet, à venir et passées."
            />
            <CardLink
              href="/account/profile"
              icon={<User className="size-5" />}
              title="Mon profil"
              body="Coordonnées, langue préférée, préférences."
            />
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({
  icon,
  value,
  label,
  compact,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-bone text-foreground">
        {icon}
      </span>
      <p
        className={
          compact
            ? "mt-3 font-heading text-lg text-foreground"
            : "mt-3 font-heading text-3xl text-foreground"
        }
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
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
      className="group flex items-start gap-4 rounded-3xl border border-border bg-card p-6 transition-all hover:border-foreground/30 hover:shadow-md"
    >
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="flex-1">
        <h3 className="font-heading text-lg text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <LogOut className="size-4 -rotate-90 text-muted-foreground transition-colors group-hover:text-primary" />
    </Link>
  );
}
