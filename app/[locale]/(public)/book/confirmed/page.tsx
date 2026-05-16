import { CheckCircle2, Mail, Phone, UserPlus } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { isValidReservationCode } from "@/lib/code";
import { getCustomerSession } from "@/lib/customer-auth";

export default async function BookConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { code } = await searchParams;
  const validCode = code && isValidReservationCode(code) ? code : null;

  // Look up the guest behind this reservation so we can pre-fill the
  // upgrade flow with their phone and skip the "verify a phone we
  // already know" step. Only run when the code is well-formed.
  const reservation = validCode
    ? await prisma.reservation.findUnique({
        where: { code: validCode },
        select: {
          guest: {
            select: {
              firstName: true,
              phone: true,
              accountCreatedAt: true,
            },
          },
        },
      })
    : null;

  const session = await getCustomerSession();
  const showUpgradeCta = Boolean(
    !session && reservation && !reservation.guest.accountCreatedAt,
  );
  const upgradeHref = reservation
    ? `/account/upgrade?phone=${encodeURIComponent(reservation.guest.phone)}`
    : "/account/upgrade";

  return (
    <main className="flex flex-1 items-center justify-center bg-sand py-24">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-6 text-4xl font-medium text-foreground">
          {reservation?.guest.firstName
            ? `Merci ${reservation.guest.firstName} !`
            : "Réservation confirmée"}
        </h1>
        {validCode ? (
          <p className="mt-4 font-mono text-lg text-primary">{validCode}</p>
        ) : null}
        <p className="mt-4 text-muted-foreground">
          Votre demande de réservation est enregistrée. Notre équipe vous
          contacte sous peu pour finaliser le paiement et envoyer le voucher.
        </p>

        {showUpgradeCta && (
          <div className="mt-10 rounded-2xl border border-primary/15 bg-white p-6 text-left shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <span className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserPlus className="size-5" />
              </span>
              <div className="flex-1">
                <h2 className="font-heading text-xl text-charcoal">
                  Activez votre espace voyageur
                </h2>
                <p className="mt-1 text-sm text-charcoal-soft">
                  Retrouvez cette réservation à tout moment, téléchargez votre
                  voucher dès qu&apos;il sera prêt, et profitez de petits
                  bénéfices aux prochains séjours. C&apos;est gratuit et ça
                  prend moins d&apos;une minute.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={upgradeHref}>Créer mon compte</Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/account/login">J&apos;ai déjà un compte</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`mailto:contact@diaryasmine.tn?subject=Réservation%20${validCode ?? ""}`}
            >
              <Mail className="mr-2 size-4" /> Nous contacter
            </a>
          </Button>
          <Button asChild variant="ghost">
            <a href={`tel:+216`}>
              <Phone className="mr-2 size-4" /> Appeler la réception
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
