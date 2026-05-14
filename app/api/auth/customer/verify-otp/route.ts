import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import {
  hashPassword,
  setCustomerSessionCookie,
  signCustomerSession,
} from "@/lib/customer-auth";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{8,20}$/),
  code: z.string().regex(/^[0-9]{6}$/),
  password: z.string().min(8).max(128),
});

/**
 * POST /api/auth/customer/verify-otp
 *
 * Completes the upgrade: validates the OTP, sets the password on the
 * Guest row, marks the phone verified, opens a customer session.
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
    return NextResponse.json({ error: "bad_input" }, { status: 400 });
  }
  const { phone, code, password } = parsed.data;

  const result = await verifyOtp({
    phone,
    purpose: "ACCOUNT_UPGRADE",
    code,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  if (!result.guestId) {
    /* Account upgrade requires a pre-existing Guest. The request-otp step
     * is enumeration-safe but here we must enforce the link. */
    return NextResponse.json({ error: "no_guest" }, { status: 404 });
  }

  const guest = await prisma.guest.findUnique({
    where: { id: result.guestId },
    select: {
      id: true,
      phone: true,
      deletedAt: true,
      hashedPassword: true,
      firstName: true,
      lastName: true,
    },
  });
  if (!guest || guest.deletedAt) {
    return NextResponse.json({ error: "no_guest" }, { status: 404 });
  }

  const hash = await hashPassword(password);
  const now = new Date();
  await prisma.guest.update({
    where: { id: guest.id },
    data: {
      hashedPassword: hash,
      phoneVerifiedAt: now,
      accountCreatedAt: guest.hashedPassword ? undefined : now,
      lastLoginAt: now,
    },
  });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = request.headers.get("user-agent") ?? null;
  await writeAudit({
    action: guest.hashedPassword
      ? "guest.password_reset"
      : "guest.account_upgraded",
    entity: "Guest",
    entityId: guest.id,
    diff: { phoneVerified: true },
    ipAddress: ip,
    userAgent: ua,
  });

  const token = await signCustomerSession({
    guestId: guest.id,
    phone: guest.phone,
  });
  await setCustomerSessionCookie(token);

  return NextResponse.json({ ok: true });
}
