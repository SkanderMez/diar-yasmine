import { NextResponse } from "next/server";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { isValidReservationCode } from "@/lib/code";
import { logger, redactEmail } from "@/lib/logger";

/**
 * Send a voucher email for a single reservation.
 *
 * Staff-only (ADMIN | MANAGER | RECEPTION). For now this just writes the
 * audit log + returns ok — the Resend wiring lands later (see CLAUDE.md
 * → Active TODOs). Mirrors the shape of `bulk-status` and `bulk-email`.
 */
export const dynamic = "force-dynamic";

const ALLOWED_ROLES: UserRole[] = ["ADMIN", "MANAGER", "RECEPTION"];

const bodySchema = z
  .object({
    to: z.string().email().optional(),
  })
  .strict()
  .or(z.object({}).strict());

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(session.user.role as UserRole)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { code } = await params;
  if (!isValidReservationCode(code)) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  let parsedBody: { to?: string } = {};
  if (request.headers.get("content-length") !== "0") {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }
    const parsed = bodySchema.safeParse(raw ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_input", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    parsedBody = "to" in parsed.data ? parsed.data : {};
  }

  const reservation = await prisma.reservation.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      deletedAt: true,
      guestId: true,
      guest: { select: { email: true } },
    },
  });
  if (!reservation || reservation.deletedAt) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const emailTarget = parsedBody.to ?? reservation.guest.email ?? null;

  await writeAudit({
    userId: session.user.id,
    action: "voucher.sent",
    entity: "Reservation",
    entityId: reservation.id,
    diff: { to: emailTarget },
  });

  // TODO(resend): enqueue the email here once RESEND_API_KEY is wired.
  logger.info(
    {
      reservationCode: reservation.code,
      to: redactEmail(emailTarget),
      userId: session.user.id,
    },
    "voucher.send_requested",
  );

  return NextResponse.json({ ok: true });
}
