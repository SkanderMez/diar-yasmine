import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { flouciGateway } from "@/lib/payments/flouci";
import { writeAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

/**
 * Flouci payment webhook.
 *
 * Flouci POSTs here when a payment terminal state lands (success or fail).
 * We re-verify with their server-to-server API before mutating any state —
 * never trust the webhook body alone.
 *
 * The payment's `reference` column stores the Flouci payment_id and links
 * back to the Reservation via the `developer_tracking_id` we set when
 * generating the payment.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Phase 2: structure ready, returns early if Flouci isn't configured.
  // When FLOUCI_APP_TOKEN lands, this route starts processing real events.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentId = extractPaymentId(body);
  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment_id" }, { status: 400 });
  }

  try {
    const verification = await flouciGateway.verifyPayment(paymentId);
    if (verification.status !== "SUCCEEDED") {
      logger.info(
        { paymentId, status: verification.status },
        "Flouci webhook: payment not yet succeeded",
      );
      return NextResponse.json({ status: "ignored" });
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findFirst({
        where: { reference: paymentId, method: "FLOUCI" },
      });
      if (existing && existing.status === "SUCCEEDED") {
        // Idempotent — webhook delivered twice.
        return;
      }
      if (existing) {
        await tx.payment.update({
          where: { id: existing.id },
          data: { status: "SUCCEEDED" },
        });
        await tx.reservation.update({
          where: { id: existing.reservationId },
          data: { paidAmount: { increment: existing.amount } },
        });
        await writeAudit(
          {
            action: "payment.confirmed_via_webhook",
            entity: "Payment",
            entityId: existing.id,
            diff: { provider: "flouci", paymentId },
          },
          tx,
        );
      }
    });

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    logger.error({ err, paymentId }, "Flouci webhook handler failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function extractPaymentId(body: unknown): string | null {
  if (
    body &&
    typeof body === "object" &&
    "payment_id" in body &&
    typeof (body as { payment_id: unknown }).payment_id === "string"
  ) {
    return (body as { payment_id: string }).payment_id;
  }
  return null;
}
