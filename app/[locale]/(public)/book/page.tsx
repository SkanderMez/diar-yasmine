import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { z } from "zod";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PublicBookingForm } from "@/components/public/public-booking-form";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { findConflicts } from "@/lib/availability";
import { parseLocalDate } from "@/lib/date";

export const metadata: Metadata = { title: "Réserver" };

const querySchema = z.object({
  propertyId: z.string().min(1).optional(),
  checkIn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  checkOut: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  adults: z.coerce.number().int().min(1).max(20).optional(),
  children: z.coerce.number().int().min(0).max(20).optional(),
});

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const parsed = querySchema.safeParse(sp);

  if (
    !parsed.success ||
    !parsed.data.propertyId ||
    !parsed.data.checkIn ||
    !parsed.data.checkOut
  ) {
    return <MissingParamsView />;
  }
  const q = parsed.data;
  const adults = q.adults ?? 2;
  const children = q.children ?? 0;

  const property = await prisma.property.findUnique({
    where: { id: q.propertyId },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      capacity: true,
      basePrice: true,
      cleaningFee: true,
      status: true,
      deletedAt: true,
    },
  });
  if (!property || property.deletedAt || property.status !== "ACTIVE") {
    return <PropertyMissingView />;
  }
  if (adults + children > property.capacity) {
    return (
      <ErrorView
        title="Capacité dépassée"
        message={`Cet hébergement accueille jusqu'à ${property.capacity} personnes.`}
      />
    );
  }

  // Preflight availability check — the EXCLUDE constraint is the final word.
  const conflicts = await findConflicts({
    propertyId: property.id,
    checkIn: parseLocalDate(q.checkIn!),
    checkOut: parseLocalDate(q.checkOut!),
  });
  if (conflicts.length > 0) {
    return (
      <ErrorView
        title="Dates indisponibles"
        message="Cet hébergement n'est plus disponible sur ces dates. Choisissez d'autres dates ou un autre logement."
      />
    );
  }

  const taxRate = await getSetting("tax.rate");

  return (
    <main className="flex-1 bg-sand">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Étape finale
          </p>
          <h1 className="mt-2 text-3xl font-medium text-foreground sm:text-4xl">
            Réservation
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Vérifiez votre récapitulatif et complétez vos coordonnées. La
            confirmation est instantanée — notre équipe vous contactera pour
            organiser le paiement.
          </p>
        </header>

        <PublicBookingForm
          propertyId={property.id}
          propertyName={property.name}
          propertyType={property.type}
          basePrice={property.basePrice}
          cleaningFee={property.cleaningFee}
          checkInDate={q.checkIn!}
          checkOutDate={q.checkOut!}
          adults={adults}
          childrenCount={children}
          taxRate={taxRate}
        />
      </div>
    </main>
  );
}

function MissingParamsView() {
  return (
    <main className="flex-1 bg-sand">
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-3xl font-medium text-foreground">Réserver</h1>
        <p className="mt-3 text-muted-foreground">
          Choisissez d&apos;abord un hébergement et des dates depuis nos listes.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/chalets">Voir les chalets</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/bungalows">Voir les bungalows</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function PropertyMissingView() {
  return (
    <ErrorView
      title="Hébergement introuvable"
      message="Cette unité n'existe plus ou n'est plus disponible à la réservation."
    />
  );
}

function ErrorView({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex-1 bg-sand">
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-3xl font-medium text-foreground">{title}</h1>
        <p className="mt-3 text-muted-foreground">{message}</p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
