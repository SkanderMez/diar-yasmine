import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import type { Millimes } from "../money";

export type { PaymentMethod, PaymentStatus };

/** Methods that flow through a third-party gateway (vs. recorded manually). */
export const GATEWAY_METHODS: readonly PaymentMethod[] = [
  "STRIPE",
  "FLOUCI",
  "KONNECT",
] as const;

export const MANUAL_METHODS: readonly PaymentMethod[] = [
  "CASH",
  "CARD",
  "TRANSFER",
  "OTHER",
] as const;

export function isGatewayMethod(m: PaymentMethod): boolean {
  return GATEWAY_METHODS.includes(m);
}

/**
 * Input for initiating a gateway payment. The caller has already chosen
 * the gateway; the adapter builds the redirect URL or client secret.
 */
export interface GatewayPaymentIntent {
  reservationId: string;
  amount: Millimes;
  currency: "TND" | "EUR" | "USD";
  customerEmail?: string;
  customerPhone?: string;
  /** Where the gateway redirects the user after success / failure. */
  successUrl: string;
  cancelUrl: string;
  /** Free-form data echoed back in the webhook payload. */
  metadata?: Record<string, string>;
}

/** Result returned to the client — used to redirect or render a payment widget. */
export interface GatewayPaymentResponse {
  /** Provider-specific ID we'll match in the webhook. */
  paymentId: string;
  /** Redirect to this URL to complete the payment. */
  redirectUrl: string;
  /** Stripe client_secret etc. when using an inline widget instead of redirect. */
  clientSecret?: string;
  /** Provider-side expiration timestamp (UTC). */
  expiresAt?: Date;
}

/** Normalized verification result regardless of provider. */
export interface GatewayPaymentVerification {
  paymentId: string;
  status: PaymentStatus;
  amountReceived: Millimes;
  rawPayload: unknown;
}

/**
 * Each gateway adapter implements this shape. Adapters throw with a clear
 * "configuration missing" message when their required env vars are unset,
 * so the failure is obvious in dev / staging.
 */
export interface PaymentGateway {
  readonly method: PaymentMethod;
  createPaymentIntent(
    input: GatewayPaymentIntent,
  ): Promise<GatewayPaymentResponse>;
  verifyPayment(paymentId: string): Promise<GatewayPaymentVerification>;
}

export class PaymentGatewayUnavailableError extends Error {
  constructor(method: PaymentMethod, missing: string[]) {
    super(
      `Payment gateway ${method} not configured — missing env: ${missing.join(", ")}`,
    );
    this.name = "PaymentGatewayUnavailableError";
  }
}
