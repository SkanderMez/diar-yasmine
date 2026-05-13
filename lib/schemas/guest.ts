import { z } from "zod";

/**
 * Shared Guest Zod schemas (client + server).
 *
 * Phone is the required, unique identifier (per CLAUDE.md "Auth model").
 * Email is optional everywhere — many walk-in guests don't have one.
 */

const tunisianPhoneRegex = /^\+?[0-9 \-().]{6,20}$/;

export const guestInputSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  phone: z
    .string()
    .trim()
    .min(6, "Téléphone trop court")
    .max(20)
    .regex(tunisianPhoneRegex, "Format de téléphone invalide"),
  email: z
    .string()
    .trim()
    .email("Email invalide")
    .max(120)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  country: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  idDocument: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type GuestInput = z.infer<typeof guestInputSchema>;

/** Used to find an existing Guest before creating a new one (Quick Book autocomplete). */
export const guestSearchSchema = z.object({
  query: z.string().trim().min(2).max(80),
});

export type GuestSearchInput = z.infer<typeof guestSearchSchema>;
