import { env } from "../env";
import { logger } from "../logger";
import { millimesToTnd } from "../money";
import {
  PaymentGatewayUnavailableError,
  type GatewayPaymentIntent,
  type GatewayPaymentResponse,
  type GatewayPaymentVerification,
  type PaymentGateway,
} from "./types";

/**
 * Flouci adapter — Tunisia's local e-wallet payment gateway.
 * Docs: https://developers.flouci.com/
 *
 * The structure is in place; the actual API calls fire as soon as
 * `FLOUCI_APP_TOKEN` + `FLOUCI_APP_SECRET` are set in the environment.
 * Until then, calling `createPaymentIntent` throws PaymentGatewayUnavailableError.
 *
 * Webhook delivery is handled by /api/webhooks/flouci/route.ts.
 */

const FLOUCI_BASE_URL = "https://developers.flouci.com/api";
const FLOUCI_SESSION_TIMEOUT_SECS = 60 * 30; // 30 min

function assertConfigured(): {
  appToken: string;
  appSecret: string;
} {
  const missing: string[] = [];
  if (!env.FLOUCI_APP_TOKEN) missing.push("FLOUCI_APP_TOKEN");
  if (!env.FLOUCI_APP_SECRET) missing.push("FLOUCI_APP_SECRET");
  if (missing.length) {
    throw new PaymentGatewayUnavailableError("FLOUCI", missing);
  }
  return {
    appToken: env.FLOUCI_APP_TOKEN!,
    appSecret: env.FLOUCI_APP_SECRET!,
  };
}

export const flouciGateway: PaymentGateway = {
  method: "FLOUCI",

  async createPaymentIntent(
    input: GatewayPaymentIntent,
  ): Promise<GatewayPaymentResponse> {
    const { appToken, appSecret } = assertConfigured();
    if (input.currency !== "TND") {
      throw new Error("Flouci only supports TND payments");
    }

    const response = await fetch(`${FLOUCI_BASE_URL}/generate_payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_token: appToken,
        app_secret: appSecret,
        // Flouci expects the amount in TND, not millimes.
        amount: millimesToTnd(input.amount).toFixed(3),
        accept_card: true,
        session_timeout_secs: FLOUCI_SESSION_TIMEOUT_SECS,
        success_link: input.successUrl,
        fail_link: input.cancelUrl,
        developer_tracking_id: input.reservationId,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logger.error(
        { provider: "flouci", status: response.status, body },
        "Flouci createPaymentIntent failed",
      );
      throw new Error(
        `Flouci createPaymentIntent failed: HTTP ${response.status}`,
      );
    }

    const json = (await response.json()) as {
      result: { payment_id: string; link: string };
    };
    return {
      paymentId: json.result.payment_id,
      redirectUrl: json.result.link,
    };
  },

  async verifyPayment(paymentId: string): Promise<GatewayPaymentVerification> {
    const { appToken, appSecret } = assertConfigured();
    const response = await fetch(`${FLOUCI_BASE_URL}/payments/${paymentId}`, {
      headers: {
        "Content-Type": "application/json",
        apppublic: appToken,
        appsecret: appSecret,
      },
    });
    if (!response.ok) {
      throw new Error(`Flouci verifyPayment failed: HTTP ${response.status}`);
    }
    const json = (await response.json()) as {
      result: { status: string; amount: number; payment_id: string };
    };
    return {
      paymentId: json.result.payment_id,
      status: json.result.status === "SUCCESS" ? "SUCCEEDED" : "PENDING",
      amountReceived: Math.round(json.result.amount * 1000),
      rawPayload: json,
    };
  },
};
