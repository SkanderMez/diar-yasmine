import { z } from "zod";
import { guestInputSchema } from "./guest";

/**
 * Reservation Zod schemas — shared between Quick Book form and Server Actions.
 *
 * Money fields use Int millimes. Dates from the form are YYYY-MM-DD strings;
 * the Server Action converts them via lib/date.parseLocalDate before storing.
 */

export const reservationSourceSchema = z.enum([
  "DIRECT_WEB",
  "WALK_IN",
  "PHONE",
  "PARTNER",
  "BOOKING",
  "AIRBNB",
  "EXPEDIA",
  "OTHER",
]);

export const reservationStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
  "NO_SHOW",
]);

export const discountTypeSchema = z.enum(["NONE", "PERCENT", "FIXED"]);

export const paymentMethodSchema = z.enum([
  "CASH",
  "CARD",
  "TRANSFER",
  "STRIPE",
  "FLOUCI",
  "KONNECT",
  "OTHER",
]);

export const reservationExtraSchema = z.object({
  label: z.string().trim().min(1).max(80),
  amount: z.number().int().nonnegative(), // millimes
  category: z.string().max(40).optional(),
});

export const reservationDiscountSchema = z.object({
  type: discountTypeSchema.default("NONE"),
  value: z.number().int().nonnegative().default(0),
});

/**
 * Input for creating a reservation via Quick Book or the public funnel.
 *
 * `guestId` lets staff pick an existing Guest by autocomplete; if absent,
 * `guest` is required so the Server Action creates one in the same tx.
 */
export const createReservationSchema = z
  .object({
    propertyId: z.string().min(1),
    checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
    checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
    adults: z.number().int().min(1).max(20),
    children: z.number().int().min(0).max(20).default(0),

    guestId: z.string().optional(),
    guest: guestInputSchema.optional(),

    source: reservationSourceSchema,
    extras: z.array(reservationExtraSchema).default([]),
    discount: reservationDiscountSchema.default({ type: "NONE", value: 0 }),

    // Optional immediate payment + voucher delivery (Phase 2.B Quick Book).
    payment: z
      .object({
        amount: z.number().int().nonnegative(),
        method: paymentMethodSchema,
        reference: z.string().max(120).optional(),
      })
      .optional(),

    voucherChannel: z
      .enum(["NONE", "EMAIL", "SMS", "WHATSAPP", "PRINT"])
      .default("NONE"),

    internalNotes: z.string().max(2000).optional(),
    guestRequests: z.string().max(2000).optional(),
  })
  .refine((data) => data.guestId || data.guest, {
    message: "guestId or guest details required",
    path: ["guest"],
  })
  .refine((data) => data.checkOutDate > data.checkInDate, {
    message: "checkOutDate must be after checkInDate",
    path: ["checkOutDate"],
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const cancelReservationSchema = z.object({
  id: z.string().min(1),
  reason: z.string().max(400).optional(),
});

export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;

export const reservationStatusActionSchema = z.object({
  id: z.string().min(1),
  status: reservationStatusSchema,
});

export type ReservationStatusActionInput = z.infer<
  typeof reservationStatusActionSchema
>;
