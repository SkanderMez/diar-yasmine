import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requestOtp } from "@/lib/otp";

const bodySchema = z.object({
  phone: z
    .string()
    .min(8)
    .max(20)
    .regex(/^\+?[0-9]{8,20}$/, "Numéro invalide"),
});

/**
 * POST /api/auth/customer/request-otp
 *
 * Used by the public account-upgrade flow.
 * - Lookup an existing Guest by phone.
 * - Generate a 6-digit OTP, hash + store with 10-min TTL.
 * - Dispatch via SMS (stub for now — see lib/sms.ts).
 *
 * The response intentionally does NOT confirm whether a Guest exists
 * (enumeration protection). The client just gets `{ ok: true }` either
 * way and proceeds to the OTP step.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_phone" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({
    where: { phone: parsed.data.phone },
    select: { id: true, deletedAt: true },
  });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  if (guest && !guest.deletedAt) {
    const result = await requestOtp({
      phone: parsed.data.phone,
      purpose: "ACCOUNT_UPGRADE",
      guestId: guest.id,
      ipAddress: ip,
    });
    if (!result.ok && result.reason === "rate_limited") {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
  }

  /* Always return ok to prevent enumeration. The client UI will redirect
   * to the OTP step regardless. */
  return NextResponse.json({ ok: true });
}
