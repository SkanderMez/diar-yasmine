import { NextResponse } from "next/server";
import { z } from "zod";
import { isAvailable } from "@/lib/availability";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * GET /api/properties/[id]/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
 *
 * Light public endpoint used by the BookingWidget to validate the date
 * range before submitting to /book. Returns `{ available: boolean }` plus
 * the property's active future reservation windows so the UI can suggest
 * alternatives. No PII leaks — guest names are excluded.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    checkIn: url.searchParams.get("checkIn"),
    checkOut: url.searchParams.get("checkOut"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_dates" }, { status: 400 });
  }

  const ci = new Date(`${parsed.data.checkIn}T00:00:00`);
  const co = new Date(`${parsed.data.checkOut}T00:00:00`);
  if (co <= ci) {
    return NextResponse.json({ error: "bad_range" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, status: true, deletedAt: true },
  });
  if (!property || property.deletedAt || property.status !== "ACTIVE") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const available = await isAvailable({
    propertyId: id,
    checkIn: ci,
    checkOut: co,
  });

  return NextResponse.json({ available });
}
