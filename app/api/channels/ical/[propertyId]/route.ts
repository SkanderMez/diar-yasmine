import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildICalFeed } from "@/lib/channels/ical";

/**
 * GET /api/channels/ical/[propertyId].ics
 *
 * Public iCal feed of active reservations for a single property. Designed
 * to be plugged into Booking, Airbnb, and Expedia as the outbound calendar
 * — they poll it on their own schedule (typically 15-60 min) and avoid
 * double-booking against direct reservations.
 *
 * No auth — the propertyId is the secret-ish identifier. We could add a
 * signed token query param in Phase 5.5 if leaks become a concern, but
 * the data exposed is "this property is busy on these dates" only.
 *
 * Includes CANCELLED placeholders (STATUS:CANCELLED) for past UIDs so OTAs
 * release the date when a guest cancels.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  const { propertyId: raw } = await params;
  const propertyId = raw.replace(/\.ics$/, "");

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, name: true, deletedAt: true },
  });
  if (!property || property.deletedAt) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      deletedAt: null,
      // Include cancelled so OTAs see the release. They filter on STATUS.
      checkOut: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      code: true,
      checkIn: true,
      checkOut: true,
      status: true,
      source: true,
      updatedAt: true,
    },
    orderBy: { checkIn: "asc" },
  });

  const feed = buildICalFeed({
    name: `Diar Yasmine — ${property.name}`,
    events: reservations.map((r) => ({
      uid: `${r.id}@diaryasmine.tn`,
      start: r.checkIn,
      end: r.checkOut,
      summary:
        r.status === "CANCELLED" || r.status === "NO_SHOW"
          ? "Cancelled"
          : "Reserved",
      description: `${r.code} · ${r.source}`,
      status:
        r.status === "CANCELLED" || r.status === "NO_SHOW"
          ? "CANCELLED"
          : "CONFIRMED",
      lastModified: r.updatedAt,
    })),
  });

  return new NextResponse(feed, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="diar-yasmine-${propertyId}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
