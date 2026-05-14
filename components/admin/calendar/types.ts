import type { ReservationSource, ReservationStatus } from "@prisma/client";

/**
 * Channel buckets used by the timeline bars + filter chips.
 * - "direct" rolls up DIRECT_WEB, PHONE, PARTNER and OTHER (the maquette
 *   shows 5 chips; OTAs map 1:1 and walk-in is its own bucket).
 */
export type ChannelKey = "direct" | "booking" | "airbnb" | "expedia" | "walkin";

export const CHANNEL_KEYS: ChannelKey[] = [
  "direct",
  "booking",
  "airbnb",
  "expedia",
  "walkin",
];

export const CHANNEL_LABEL: Record<ChannelKey, string> = {
  direct: "Direct",
  booking: "Booking",
  airbnb: "Airbnb",
  expedia: "Expedia",
  walkin: "Walk-in",
};

export const CHANNEL_MARK: Record<
  ChannelKey,
  { label: string; title: string }
> = {
  direct: { label: "DY", title: "Direct · Diar Yasmine" },
  booking: { label: "B.", title: "Booking.com" },
  airbnb: { label: "A", title: "Airbnb" },
  expedia: { label: "Ex", title: "Expedia" },
  walkin: { label: "W", title: "Walk-in" },
};

export function channelKeyFromSource(source: ReservationSource): ChannelKey {
  switch (source) {
    case "BOOKING":
      return "booking";
    case "AIRBNB":
      return "airbnb";
    case "EXPEDIA":
      return "expedia";
    case "WALK_IN":
      return "walkin";
    case "DIRECT_WEB":
    case "PHONE":
    case "PARTNER":
    case "OTHER":
    default:
      return "direct";
  }
}

/** Payment buckets for the small colored dot on each bar. */
export type PaymentBucket = "paid" | "deposit" | "unpaid" | "refunded";

export function paymentBucket(
  total: number,
  paidAmount: number,
): PaymentBucket {
  if (total <= 0) return "unpaid";
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= total) return "paid";
  return "deposit";
}

export const PAYMENT_LABEL: Record<PaymentBucket, string> = {
  paid: "Payée",
  deposit: "Acompte",
  unpaid: "Non payée",
  refunded: "Remboursée",
};

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: "Option",
  CONFIRMED: "Confirmée",
  CHECKED_IN: "Check-in",
  CHECKED_OUT: "Check-out",
  CANCELLED: "Annulée",
  NO_SHOW: "No-show",
};
