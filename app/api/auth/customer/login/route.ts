import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  setCustomerSessionCookie,
  signCustomerSession,
  verifyPassword,
} from "@/lib/customer-auth";

const bodySchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

/**
 * POST /api/auth/customer/login
 *
 * Logs a customer in by phone OR email + password. Slow on purpose
 * (bcrypt compare). Generic error messages to prevent enumeration.
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

  const id = parsed.data.identifier.trim();
  const looksLikeEmail = id.includes("@");
  const guest = await prisma.guest.findFirst({
    where: looksLikeEmail
      ? { email: id.toLowerCase() }
      : { phone: id.replace(/\s+/g, "") },
  });

  if (!guest || guest.deletedAt || !guest.hashedPassword) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, guest.hashedPassword);
  if (!ok) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await prisma.guest.update({
    where: { id: guest.id },
    data: { lastLoginAt: new Date() },
  });

  const token = await signCustomerSession({
    guestId: guest.id,
    phone: guest.phone,
  });
  await setCustomerSessionCookie(token);

  return NextResponse.json({ ok: true });
}
