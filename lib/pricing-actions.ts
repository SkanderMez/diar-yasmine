"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { writeAudit } from "./audit";
import { setSetting } from "./settings";

/**
 * Pricing Server Actions — seasons, supplements, min-stay rules,
 * publication. ADMIN/MANAGER only; every mutation writes an audit row.
 */

class PricingActionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "PricingActionError";
  }
}

async function requireEditor(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new PricingActionError(
      "Authentification requise",
      "UNAUTHENTICATED",
      401,
    );
  }
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    throw new PricingActionError(
      "Réservé à l'administration",
      "FORBIDDEN",
      403,
    );
  }
  return { id: session.user.id };
}

// =============================================================================
// SEASONS
// =============================================================================

const seasonMultiplierSchema = z.object({
  seasonId: z.string().min(1),
  multiplier: z.number().int().min(0).max(10000),
});

export async function updateSeasonMultiplier(
  input: z.infer<typeof seasonMultiplierSchema>,
) {
  const parsed = seasonMultiplierSchema.parse(input);
  const staff = await requireEditor();

  const before = await prisma.season.findUnique({
    where: { id: parsed.seasonId },
    select: { id: true, name: true, priceMultiplier: true },
  });
  if (!before) {
    throw new PricingActionError("Saison introuvable", "NOT_FOUND", 404);
  }
  if (before.priceMultiplier === parsed.multiplier) {
    return { id: before.id };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.season.update({
      where: { id: parsed.seasonId },
      data: { priceMultiplier: parsed.multiplier },
      select: { id: true, name: true, priceMultiplier: true },
    });
    await writeAudit(
      {
        userId: staff.id,
        action: "season.multiplier_updated",
        entity: "Season",
        entityId: next.id,
        diff: {
          before: { priceMultiplier: before.priceMultiplier },
          after: { priceMultiplier: next.priceMultiplier },
        },
      },
      tx,
    );
    return next;
  });

  revalidatePath("/[locale]/admin/pricing");
  return { id: updated.id };
}

// =============================================================================
// SUPPLEMENTS
// =============================================================================

const supplementsSchema = z.object({
  weekendPct: z.number().int().min(-10000).max(10000),
  tnHolidaysPct: z.number().int().min(-10000).max(10000),
  ramadanPct: z.number().int().min(-10000).max(10000),
  aidPct: z.number().int().min(-10000).max(10000),
});

export type SupplementsInput = z.infer<typeof supplementsSchema>;

export async function updateSupplements(input: SupplementsInput) {
  const parsed = supplementsSchema.parse(input);
  const staff = await requireEditor();

  await setSetting("pricing.weekend_pct", parsed.weekendPct, staff.id);
  await setSetting("pricing.tn_holidays_pct", parsed.tnHolidaysPct, staff.id);
  await setSetting("pricing.ramadan_pct", parsed.ramadanPct, staff.id);
  await setSetting("pricing.aid_pct", parsed.aidPct, staff.id);

  await writeAudit({
    userId: staff.id,
    action: "pricing.supplements_updated",
    entity: "Setting",
    entityId: "pricing.supplements",
    diff: { after: parsed },
  });

  revalidatePath("/[locale]/admin/pricing");
  return { ok: true };
}

// =============================================================================
// MIN-STAY RULES
// =============================================================================

const minStaySchema = z.object({
  minStayLow: z.number().int().min(1).max(30),
  minStayHigh: z.number().int().min(1).max(30),
  minStayPeak: z.number().int().min(1).max(30),
  longstayDiscountPct: z.number().int().min(-10000).max(10000),
  longstayThresholdNights: z.number().int().min(1).max(60),
});

export type MinStayInput = z.infer<typeof minStaySchema>;

export async function updateMinStayRules(input: MinStayInput) {
  const parsed = minStaySchema.parse(input);
  const staff = await requireEditor();

  await setSetting("pricing.min_stay_low", parsed.minStayLow, staff.id);
  await setSetting("pricing.min_stay_high", parsed.minStayHigh, staff.id);
  await setSetting("pricing.min_stay_peak", parsed.minStayPeak, staff.id);
  await setSetting(
    "pricing.longstay_discount_pct",
    parsed.longstayDiscountPct,
    staff.id,
  );
  await setSetting(
    "pricing.longstay_threshold_nights",
    parsed.longstayThresholdNights,
    staff.id,
  );

  await writeAudit({
    userId: staff.id,
    action: "pricing.min_stay_updated",
    entity: "Setting",
    entityId: "pricing.min_stay",
    diff: { after: parsed },
  });

  revalidatePath("/[locale]/admin/pricing");
  return { ok: true };
}

// =============================================================================
// PUBLISH
// =============================================================================

export async function publishPricing() {
  const staff = await requireEditor();
  const now = new Date().toISOString();
  await setSetting("pricing.published_at", now, staff.id);
  await writeAudit({
    userId: staff.id,
    action: "pricing.published",
    entity: "Setting",
    entityId: "pricing.published_at",
    diff: { after: { publishedAt: now } },
  });
  revalidatePath("/[locale]/admin/pricing");
  return { publishedAt: now };
}
