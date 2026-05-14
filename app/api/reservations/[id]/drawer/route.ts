import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findReservationForDrawer } from "@/lib/queries";

/**
 * JSON endpoint feeding the calendar drawer. Returns the full reservation
 * payload plus the recent audit trail. Staff-only — uses the Auth.js
 * session cookie like every other admin endpoint.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await findReservationForDrawer(id);
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
