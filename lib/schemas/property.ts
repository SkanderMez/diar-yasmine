import { z } from "zod";

/**
 * Property admin schemas (create / update). Shared between the admin
 * form (react-hook-form) and the Server Actions.
 */

export const propertyTypeSchema = z.enum(["CHALET", "BUNGALOW"]);
export const propertyStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
]);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const baseFields = {
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(slugRegex, "Slug invalide (a-z, 0-9, -)"),
  type: propertyTypeSchema,
  status: propertyStatusSchema.default("ACTIVE"),
  capacity: z.coerce.number().int().min(1).max(40),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(0).max(20),
  hasPrivatePool: z.coerce.boolean().default(false),
  seaView: z.coerce.boolean().default(false),
  beachfront: z.coerce.boolean().default(false),
  sizeM2: z.coerce.number().int().min(0).max(2000).optional(),
  descriptionFr: z.string().trim().min(1).max(4000),
  descriptionEn: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  descriptionAr: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  // Prices in millimes (Int). Forms convert from TND on submit.
  basePrice: z.coerce.number().int().nonnegative().max(100_000_000),
  cleaningFee: z.coerce.number().int().nonnegative().max(10_000_000).default(0),
  minStay: z.coerce.number().int().min(1).max(60).default(1),
  amenitySlugs: z.array(z.string().min(1)).default([]),
};

export const createPropertySchema = z.object(baseFields);
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = z.object({
  id: z.string().min(1),
  ...baseFields,
});
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
