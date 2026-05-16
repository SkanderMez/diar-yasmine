import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { z } from "zod";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FunnelClient } from "@/components/public/funnel/funnel-client";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { findConflicts } from "@/lib/availability";
import { getCustomerSession } from "@/lib/customer-auth";
import { getPropertyRatingSummary } from "@/lib/queries";
import { parseLocalDate, nightsBetween } from "@/lib/date";

export const metadata: Metadata = { title: "Réserver" };

const querySchema = z.object({
  propertyId: z.string().min(1).optional(),
  propertySlug: z.string().min(1).optional(),
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
  promo: z.string().max(60).optional(),
});

/**
 * Public booking funnel — pixel-matches /diar yasmine assets/diar yasmine
 * maquette/reservation.html. Step 1 (Hébergement & dates) is collected on
 * the property page and arrives via search params; we render step 2 (guest
 * info + stay details) here and tease step 3 (payment) as a dashed preview.
 *
 * Server work: validate the property / date range, preflight the EXCLUDE
 * constraint, fetch a hero photo and the current tax rate, then hand
 * everything to the client component that owns the form state.
 */
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

  if (!parsed.success) {
    return <MissingParamsView />;
  }
  const {
    propertyId,
    checkIn,
    checkOut,
    adults: adultsRaw,
    children: childrenRaw,
    promo,
  } = parsed.data;
  if (!propertyId || !checkIn || !checkOut) {
    return <MissingParamsView />;
  }
  const adults = adultsRaw ?? 2;
  const children = childrenRaw ?? 0;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
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
      beachfront: true,
      hasPrivatePool: true,
      photos: {
        orderBy: { order: "asc" },
        take: 1,
        select: { url: true },
      },
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

  const checkInDate = parseLocalDate(checkIn);
  const checkOutDate = parseLocalDate(checkOut);
  let nights: number;
  try {
    nights = nightsBetween(checkInDate, checkOutDate);
  } catch {
    return (
      <ErrorView
        title="Dates invalides"
        message="La date d'arrivée doit précéder la date de départ."
      />
    );
  }

  // Preflight availability check — the EXCLUDE constraint is the final word.
  const conflicts = await findConflicts({
    propertyId: property.id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
  });
  if (conflicts.length > 0) {
    return (
      <ErrorView
        title="Dates indisponibles"
        message="Cet hébergement n'est plus disponible sur ces dates. Choisissez d'autres dates ou un autre logement."
      />
    );
  }

  const [taxRate, ratingSummary, customerSession] = await Promise.all([
    getSetting("tax.rate"),
    getPropertyRatingSummary(property.id),
    getCustomerSession(),
  ]);

  const sessionGuest = customerSession
    ? await prisma.guest.findUnique({
        where: { id: customerSession.guestId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          country: true,
        },
      })
    : null;

  const initialGuest = sessionGuest
    ? {
        firstName: sessionGuest.firstName,
        lastName: sessionGuest.lastName,
        email: sessionGuest.email ?? "",
        phone: sessionGuest.phone,
        country: sessionGuest.country ?? "TN",
      }
    : undefined;

  return (
    <main className="flex-1 bg-sand pt-24">
      <FunnelClient
        property={{
          id: property.id,
          slug: property.slug,
          name: property.name,
          type: property.type,
          photoUrl: property.photos[0]?.url ?? null,
          beachfront: property.beachfront,
          hasPrivatePool: property.hasPrivatePool,
          basePrice: property.basePrice,
          cleaningFee: property.cleaningFee,
        }}
        checkIn={checkIn}
        checkOut={checkOut}
        nights={nights}
        adults={adults}
        childrenCount={children}
        taxRate={taxRate}
        promoCode={promo}
        rating={ratingSummary}
        initialGuest={initialGuest}
        isCustomerLoggedIn={Boolean(customerSession)}
      />
    </main>
  );
}

function MissingParamsView() {
  return (
    <main className="flex-1 bg-sand pt-24">
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
    <main className="flex-1 bg-sand pt-24">
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
