import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { listActiveProperties } from "@/lib/queries";
import { getSetting } from "@/lib/settings";
import { NewBookingClient } from "@/components/admin/new-booking/new-booking-client";

export const dynamic = "force-dynamic";

/**
 * Full-page admin "Nouvelle réservation" wizard.
 *
 * Replaces the Quick Book sheet flow for staff who prefer a guided 4-step
 * experience. The Quick Book sheet (⌘K) stays available for ultra-fast
 * walk-in/phone bookings.
 *
 * Pre-fills from search params when the calendar deep-links here:
 *   ?propertyId=... &checkIn=... &checkOut=...
 */
export default async function NewBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    propertyId?: string;
    checkIn?: string;
    checkOut?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const [propertiesRaw, taxRate, photoRows] = await Promise.all([
    listActiveProperties(),
    getSetting("tax.rate"),
    prisma.photo.findMany({
      where: { order: 0 },
      select: { propertyId: true, url: true, alt: true },
    }),
  ]);

  const photoByProperty = new Map<
    string,
    { url: string; alt: string | null }
  >();
  for (const p of photoRows) {
    photoByProperty.set(p.propertyId, { url: p.url, alt: p.alt });
  }

  const properties = propertiesRaw.map((p) => ({
    ...p,
    photoUrl: photoByProperty.get(p.id)?.url ?? null,
    photoAlt: photoByProperty.get(p.id)?.alt ?? null,
  }));

  return (
    <NewBookingClient
      properties={properties}
      taxRate={taxRate}
      prefill={{
        propertyId: sp.propertyId ?? null,
        checkIn: isYmd(sp.checkIn) ? sp.checkIn : null,
        checkOut: isYmd(sp.checkOut) ? sp.checkOut : null,
      }}
    />
  );
}

function isYmd(v: string | undefined): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
