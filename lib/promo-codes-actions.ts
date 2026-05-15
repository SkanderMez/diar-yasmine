"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { writeAudit } from "./audit";
import type { PromoCodeKind, PropertyType } from "@prisma/client";

class PromoCodeActionError extends Error {
  constructor(
    message: string,
    public errCode:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "INVALID_INPUT"
      | "CODE_INACTIVE"
      | "CODE_EXPIRED"
      | "CODE_EXHAUSTED"
      | "MIN_NIGHTS"
      | "WRONG_TYPE"
      | "ALREADY_APPLIED",
    public status = 400,
  ) {
    super(message);
    this.name = "PromoCodeActionError";
  }
}

async function requireManager(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new PromoCodeActionError(
      "Authentification requise",
      "UNAUTHENTICATED",
      401,
    );
  }
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    throw new PromoCodeActionError(
      "Réservé à l'administration",
      "FORBIDDEN",
      403,
    );
  }
  return { id: session.user.id };
}

const upsertSchema = z.object({
  id: z.string().optional(),
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/, "Lettres majuscules, chiffres, - et _ seulement"),
  label: z.string().trim().max(120).optional(),
  kind: z.enum(["PERCENT", "FIXED"]),
  /** PERCENT: 0-100, FIXED: TND (will be converted to millimes). */
  value: z.number().min(0),
  minNights: z.number().int().min(0).max(60).default(0),
  propertyType: z.enum(["CHALET", "BUNGALOW"]).nullable().optional(),
  maxUses: z.number().int().min(0).default(0),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  active: z.boolean().default(true),
});

export async function upsertPromoCode(
  input: z.infer<typeof upsertSchema>,
): Promise<{ ok: true; id: string }> {
  const parsed = upsertSchema.parse(input);
  const staff = await requireManager();

  if (parsed.kind === "PERCENT" && parsed.value > 100) {
    throw new PromoCodeActionError(
      "Le pourcentage ne peut dépasser 100",
      "INVALID_INPUT",
    );
  }

  // Persist FIXED values in millimes.
  const storedValue =
    parsed.kind === "FIXED"
      ? Math.round(parsed.value * 1000)
      : Math.round(parsed.value);

  const data = {
    code: parsed.code.toUpperCase(),
    label: parsed.label?.length ? parsed.label : null,
    kind: parsed.kind as PromoCodeKind,
    value: storedValue,
    minNights: parsed.minNights,
    propertyType: (parsed.propertyType ?? null) as PropertyType | null,
    maxUses: parsed.maxUses,
    validFrom: parsed.validFrom
      ? new Date(`${parsed.validFrom}T00:00:00Z`)
      : null,
    validTo: parsed.validTo ? new Date(`${parsed.validTo}T23:59:59Z`) : null,
    active: parsed.active,
  };

  if (parsed.id) {
    const before = await prisma.promoCode.findUnique({
      where: { id: parsed.id },
    });
    if (!before) {
      throw new PromoCodeActionError("Code introuvable", "NOT_FOUND", 404);
    }
    const after = await prisma.promoCode.update({
      where: { id: parsed.id },
      data,
    });
    await writeAudit({
      userId: staff.id,
      action: "promo_code.updated",
      entity: "PromoCode",
      entityId: after.id,
      diff: { before, after: data },
    });
    revalidatePath("/admin/promo-codes");
    return { ok: true, id: after.id };
  }

  const created = await prisma.promoCode.create({
    data: { ...data, createdById: staff.id },
  });
  await writeAudit({
    userId: staff.id,
    action: "promo_code.created",
    entity: "PromoCode",
    entityId: created.id,
    diff: { after: data },
  });
  revalidatePath("/admin/promo-codes");
  return { ok: true, id: created.id };
}

const togglePromoSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export async function togglePromoCode(
  input: z.infer<typeof togglePromoSchema>,
): Promise<{ ok: true }> {
  const parsed = togglePromoSchema.parse(input);
  const staff = await requireManager();

  await prisma.promoCode.update({
    where: { id: parsed.id },
    data: { active: parsed.active },
  });
  await writeAudit({
    userId: staff.id,
    action: parsed.active ? "promo_code.activated" : "promo_code.deactivated",
    entity: "PromoCode",
    entityId: parsed.id,
    diff: { after: { active: parsed.active } },
  });
  revalidatePath("/admin/promo-codes");
  return { ok: true };
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function deletePromoCode(
  input: z.infer<typeof deleteSchema>,
): Promise<{ ok: true }> {
  const parsed = deleteSchema.parse(input);
  const staff = await requireManager();

  const usedCount = await prisma.promoRedemption.count({
    where: { promoCodeId: parsed.id },
  });
  if (usedCount > 0) {
    // Deactivate instead of deleting to preserve audit linkage.
    await prisma.promoCode.update({
      where: { id: parsed.id },
      data: { active: false },
    });
    await writeAudit({
      userId: staff.id,
      action: "promo_code.archived",
      entity: "PromoCode",
      entityId: parsed.id,
      diff: { after: { active: false, archived: true } },
    });
  } else {
    await prisma.promoCode.delete({ where: { id: parsed.id } });
    await writeAudit({
      userId: staff.id,
      action: "promo_code.deleted",
      entity: "PromoCode",
      entityId: parsed.id,
      diff: {},
    });
  }

  revalidatePath("/admin/promo-codes");
  return { ok: true };
}

/**
 * Public-funnel helper. Looks up the code and validates it against the
 * candidate booking (nights, property type). Returns the millimes
 * discount that should be applied to the stay. Does NOT persist a
 * redemption — that is done atomically when the reservation is created.
 */
const previewSchema = z.object({
  code: z.string().trim().min(1).max(40),
  nights: z.number().int().min(1),
  propertyType: z.enum(["CHALET", "BUNGALOW"]),
  basePriceMillimes: z.number().int().min(0),
});

export async function previewPromoCode(
  input: z.infer<typeof previewSchema>,
): Promise<{
  ok: true;
  promoCodeId: string;
  amountMillimes: number;
  label: string | null;
}> {
  const parsed = previewSchema.parse(input);
  const now = new Date();

  const promo = await prisma.promoCode.findUnique({
    where: { code: parsed.code.toUpperCase() },
  });
  if (!promo) {
    throw new PromoCodeActionError("Code inconnu", "NOT_FOUND", 404);
  }
  if (!promo.active) {
    throw new PromoCodeActionError("Code désactivé", "CODE_INACTIVE", 409);
  }
  if (promo.validFrom && promo.validFrom > now) {
    throw new PromoCodeActionError(
      "Code pas encore valide",
      "CODE_EXPIRED",
      409,
    );
  }
  if (promo.validTo && promo.validTo < now) {
    throw new PromoCodeActionError("Code expiré", "CODE_EXPIRED", 409);
  }
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    throw new PromoCodeActionError("Code épuisé", "CODE_EXHAUSTED", 409);
  }
  if (promo.minNights > 0 && parsed.nights < promo.minNights) {
    throw new PromoCodeActionError(
      `Code valable à partir de ${promo.minNights} nuits`,
      "MIN_NIGHTS",
      409,
    );
  }
  if (promo.propertyType && promo.propertyType !== parsed.propertyType) {
    throw new PromoCodeActionError(
      `Code réservé aux ${promo.propertyType === "CHALET" ? "chalets" : "bungalows"}`,
      "WRONG_TYPE",
      409,
    );
  }

  const amount =
    promo.kind === "PERCENT"
      ? Math.round((parsed.basePriceMillimes * promo.value) / 100)
      : Math.min(promo.value, parsed.basePriceMillimes);

  return {
    ok: true,
    promoCodeId: promo.id,
    amountMillimes: amount,
    label: promo.label,
  };
}
