import type { PaymentMethod } from "@prisma/client";
import { flouciGateway } from "./flouci";
import { stripeGateway } from "./stripe";
import { konnectGateway } from "./konnect";
import { isGatewayMethod, type PaymentGateway } from "./types";

/**
 * Unified payment gateway router.
 *
 * Manual payments (CASH/CARD/TRANSFER/OTHER) are recorded directly via
 * `Payment.create()` from the reservation Server Action; they don't go
 * through this module.
 *
 * Gateway payments (STRIPE/FLOUCI/KONNECT) go through this router. The
 * caller picks the method via the Quick Book form and the router dispatches
 * to the right adapter.
 */

const REGISTRY: Partial<Record<PaymentMethod, PaymentGateway>> = {
  FLOUCI: flouciGateway,
  STRIPE: stripeGateway,
  KONNECT: konnectGateway,
};

export function getPaymentGateway(method: PaymentMethod): PaymentGateway {
  if (!isGatewayMethod(method)) {
    throw new Error(`Method ${method} is a manual payment, not a gateway`);
  }
  const gateway = REGISTRY[method];
  if (!gateway) {
    throw new Error(`No adapter registered for gateway ${method}`);
  }
  return gateway;
}

export { isGatewayMethod, GATEWAY_METHODS, MANUAL_METHODS } from "./types";
export type {
  GatewayPaymentIntent,
  GatewayPaymentResponse,
  GatewayPaymentVerification,
  PaymentGateway,
} from "./types";
