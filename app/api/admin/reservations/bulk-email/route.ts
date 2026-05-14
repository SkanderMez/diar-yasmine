import { NextResponse } from "next/server";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";

/**
 * Stub endpoint for the "Email groupé" bulk action.
 *
 * Resend wiring lands later (CLAUDE.md → Active TODOs). For now we just
 * validate input + ack so the toast can show the queued count.
 */
export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  template: z.literal("default").default("default"),
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

  // TODO(resend): enqueue email with parsed.data.template per parsed.data.ids
  return NextResponse.json({ ok: true, queued: parsed.data.ids.length });
}
