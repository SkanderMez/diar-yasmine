import { env } from "../env";
import { logger } from "../logger";
import {
  PaymentGatewayUnavailableError,
  type GatewayPaymentIntent,
  type GatewayPaymentResponse,
  type GatewayPaymentVerification,
  type PaymentGateway,
} from "./types";

/**
 * Stripe adapter — international cards, fallback when Flouci is not available
 * (foreign guests, Apple Pay, Google Pay).
 *
 * Implementation deferred to Phase 4 (Payments & Caisse). For now the adapter
 * exists so the unified interface can route by method; calling its methods
 * with STRIPE_SECRET_KEY unset throws PaymentGatewayUnavailableError.
 */

function assertConfigured(): { secretKey: string } {
  const missing: string[] = [];
  if (!env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
  if (missing.length) {
    throw new PaymentGatewayUnavailableError("STRIPE", missing);
  }
  return { secretKey: env.STRIPE_SECRET_KEY! };
}

export const stripeGateway: PaymentGateway = {
  method: "STRIPE",

  async createPaymentIntent(
    _input: GatewayPaymentIntent,
  ): Promise<GatewayPaymentResponse> {
    assertConfigured();
    logger.warn(
      { provider: "stripe" },
      "Stripe adapter not yet implemented — Phase 4",
    );
    throw new Error("Stripe adapter not yet implemented (Phase 4)");
  },

  async verifyPayment(_paymentId: string): Promise<GatewayPaymentVerification> {
    assertConfigured();
    throw new Error("Stripe adapter not yet implemented (Phase 4)");
  },
};
