import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint.
 *
 * Pings the database via a SELECT 1 raw query. Returns 200 with
 * `status: "ok"` when reachable, 503 with `status: "degraded"` when
 * the DB is unreachable. Use this from uptime probes (Vercel Cron,
 * Uptime Robot, Better Stack) and from Sentry's release checks.
 *
 * Intentionally unauthenticated — no PII is exposed.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  let dbStatus: "ok" | "error" = "error";
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const before = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - before;
    dbStatus = "ok";
  } catch (err) {
    dbError = err instanceof Error ? err.message : "unknown";
  }

  const body = {
    status: dbStatus === "ok" ? "ok" : "degraded",
    db: { status: dbStatus, latencyMs: dbLatencyMs, error: dbError },
    environment: process.env.NODE_ENV ?? "unknown",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    timestamp: new Date().toISOString(),
    responseMs: Date.now() - start,
  };

  return NextResponse.json(body, {
    status: dbStatus === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
