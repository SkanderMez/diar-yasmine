import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Stripe payment webhook.
 *
 * Placeholder — Phase 4 (Payments & Caisse) wires the full Stripe flow,
 * including signature verification via STRIPE_WEBHOOK_SECRET. Until then,
 * this route returns 503 if Stripe isn't configured and 501 otherwise so
 * Stripe stops retrying.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 },
    );
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  logger.warn({ signature }, "Stripe webhook received but handler is Phase 4");
  return NextResponse.json({ error: "Not implemented yet" }, { status: 501 });
}
