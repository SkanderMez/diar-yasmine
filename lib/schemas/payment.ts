import { z } from "zod";
import { paymentMethodSchema } from "./reservation";

export const paymentStatusSchema = z.enum([
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export const createPaymentSchema = z.object({
  reservationId: z.string().min(1),
  amount: z.number().int().positive(), // millimes
  method: paymentMethodSchema,
  reference: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
