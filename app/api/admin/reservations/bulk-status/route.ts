import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

/**
 * Bulk status update for /admin/reservations. Used by the "Marquer
 * confirmées" / "Annuler" actions in the bulk-action bar.
 *
 * - Staff-only (ADMIN | MANAGER | RECEPTION).
 * - Validates every id, then updates + audits each row in a single tx.
 * - Returns `{ ok, count }` so the client can render a useful toast.
 */
export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  status: z.enum(["CONFIRMED", "CANCELLED"]),
});

const ALLOWED_ROLES: UserRole[] = ["ADMIN", "MANAGER", "RECEPTION"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(session.user.role as UserRole)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { ids, status } = parsed.data;
  const userId = session.user.id;
  const action =
    status === "CANCELLED"
      ? "reservation.bulk_cancelled"
      : "reservation.bulk_confirmed";

  const count = await prisma.$transaction(async (tx) => {
    const before = await tx.reservation.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, status: true },
    });

    if (before.length === 0) return 0;

    const updated = await tx.reservation.updateMany({
      where: { id: { in: before.map((b) => b.id) } },
      data: { status },
    });

    await Promise.all(
      before.map((b) =>
        writeAudit(
          {
            userId,
            action,
            entity: "Reservation",
            entityId: b.id,
            diff: { before: { status: b.status }, after: { status } },
          },
          tx,
        ),
      ),
    );

    return updated.count;
  });

  revalidatePath("/[locale]/admin/reservations", "page");
  revalidatePath("/[locale]/admin/calendar", "page");

  return NextResponse.json({ ok: true, count });
}
