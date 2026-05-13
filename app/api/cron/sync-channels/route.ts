import { NextResponse, type NextRequest } from "next/server";
import { syncAllChannels } from "@/lib/channels/sync";
import { logger } from "@/lib/logger";

/**
 * Vercel Cron entry point.
 *
 * Schedule via `vercel.json`:
 *   { "crons": [{ "path": "/api/cron/sync-channels", "schedule": "* /15 * * * *" }] }
 *
 * Vercel's Cron Authorization header carries a shared secret
 * (CRON_SECRET) — we verify it here so the route isn't world-callable.
 * Anonymous calls in dev are allowed when CRON_SECRET is unset.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const header = request.headers.get("authorization") ?? "";
    if (header !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const summaries = await syncAllChannels();
    logger.info({ summaries }, "channel sync run complete");
    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      summaries,
    });
  } catch (err) {
    logger.error({ err }, "channel sync cron failed");
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
