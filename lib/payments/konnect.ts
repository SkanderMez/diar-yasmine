import { env } from "../env";
import {
  PaymentGatewayUnavailableError,
  type GatewayPaymentIntent,
  type GatewayPaymentResponse,
  type GatewayPaymentVerification,
  type PaymentGateway,
} from "./types";

/**
 * Konnect adapter — Tunisia local e-wallet, secondary option after Flouci.
 *
 * Placeholder. Implementation lands in Phase 4 once Konnect credentials
 * are issued (KONNECT_API_KEY + KONNECT_RECEIVER_WALLET_ID).
 */

function assertConfigured(): { apiKey: string; receiverWalletId: string } {
  const missing: string[] = [];
  if (!env.KONNECT_API_KEY) missing.push("KONNECT_API_KEY");
  if (!env.KONNECT_RECEIVER_WALLET_ID)
    missing.push("KONNECT_RECEIVER_WALLET_ID");
  if (missing.length) {
    throw new PaymentGatewayUnavailableError("KONNECT", missing);
  }
  return {
    apiKey: env.KONNECT_API_KEY!,
    receiverWalletId: env.KONNECT_RECEIVER_WALLET_ID!,
  };
}

export const konnectGateway: PaymentGateway = {
  method: "KONNECT",

  async createPaymentIntent(
    _input: GatewayPaymentIntent,
  ): Promise<GatewayPaymentResponse> {
    assertConfigured();
    throw new Error("Konnect adapter not yet implemented (Phase 4)");
  },

  async verifyPayment(_paymentId: string): Promise<GatewayPaymentVerification> {
    assertConfigured();
    throw new Error("Konnect adapter not yet implemented (Phase 4)");
  },
};
