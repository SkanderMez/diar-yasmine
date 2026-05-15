import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { isValidReservationCode } from "@/lib/code";
import { formatLocalized } from "@/lib/date";
import { ReviewForm } from "@/components/public/review/review-form";
import { ReviewAlreadySubmitted } from "@/components/public/review/review-already-submitted";

export const metadata: Metadata = {
  title: "Laisser un avis",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ReviewPage({
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
      status: true,
      deletedAt: true,
      guest: { select: { firstName: true } },
      property: { select: { name: true, type: true } },
      review: { select: { id: true, status: true } },
    },
  });

  if (!reservation || reservation.deletedAt) notFound();

  const now = new Date();
  const stayEnded = reservation.checkOut.getTime() <= now.getTime();
  const blockedStatus = ["CANCELLED", "NO_SHOW", "PENDING"].includes(
    reservation.status,
  );

  if (reservation.review) {
    return (
      <ReviewAlreadySubmitted
        propertyName={reservation.property.name}
        propertyType={reservation.property.type}
        status={reservation.review.status}
      />
    );
  }

  if (blockedStatus || !stayEnded) {
    return (
      <main className="flex-1 bg-ivory text-foreground">
        <section className="section-y-lg">
          <div className="container-x max-w-2xl text-center">
            <p className="mb-2 font-script text-2xl text-turquoise">
              {reservation.property.name}
            </p>
            <h1 className="heading-display text-3xl text-charcoal sm:text-4xl">
              Pas encore disponible
            </h1>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              {blockedStatus
                ? "Votre séjour n'a pas (encore) eu lieu. Le formulaire d'avis s'ouvrira après le check-out."
                : `Vous pourrez déposer votre avis après le ${formatLocalized(
                    reservation.checkOut,
                    "d MMMM yyyy",
                  )}.`}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-ivory text-foreground">
      <section className="section-y-lg">
        <div className="container-x max-w-2xl">
          <div className="mb-8 text-center">
            <p className="mb-1 font-script text-2xl text-turquoise">
              Merci pour votre séjour
              {reservation.guest.firstName
                ? `, ${reservation.guest.firstName}`
                : ""}
            </p>
            <h1 className="heading-display text-3xl text-charcoal sm:text-4xl">
              Comment s&apos;est passé{" "}
              <em className="heading-em">{reservation.property.name}</em>&nbsp;?
            </h1>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Votre avis aide d&apos;autres voyageurs à choisir et nous aide à
              nous améliorer. Notre équipe le relit avant publication.
            </p>
          </div>

          <ReviewForm code={reservation.code} locale={locale} />
        </div>
      </section>
    </main>
  );
}
