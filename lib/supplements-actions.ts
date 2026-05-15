"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { writeAudit } from "./audit";

class SupplementActionError extends Error {
  constructor(
    message: string,
    public errCode:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "INVALID_INPUT",
    public status = 400,
  ) {
    super(message);
    this.name = "SupplementActionError";
  }
}

async function requireManager(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new SupplementActionError(
      "Authentification requise",
      "UNAUTHENTICATED",
      401,
    );
  }
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    throw new SupplementActionError(
      "Réservé à l'administration",
      "FORBIDDEN",
      403,
    );
  }
  return { id: session.user.id };
}

const upsertSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "kebab-case (a-z, 0-9, -)"),
  labelFr: z.string().trim().min(1).max(120),
  labelEn: z.string().trim().max(120).optional(),
  labelAr: z.string().trim().max(120).optional(),
  /** Price in TND (admin types decimals; converted to millimes here). */
  priceTnd: z.number().min(0),
  category: z.string().trim().max(60).optional(),
  icon: z.string().trim().max(60).optional(),
  sortOrder: z.number().int().min(0).max(9999).default(100),
  active: z.boolean().default(true),
});

export async function upsertSupplement(
  input: z.infer<typeof upsertSchema>,
): Promise<{ ok: true; id: string }> {
  const parsed = upsertSchema.parse(input);
  const staff = await requireManager();

  const data = {
    slug: parsed.slug,
    labelFr: parsed.labelFr,
    labelEn: parsed.labelEn?.length ? parsed.labelEn : null,
    labelAr: parsed.labelAr?.length ? parsed.labelAr : null,
    priceMillimes: Math.round(parsed.priceTnd * 1000),
    category: parsed.category?.length ? parsed.category : null,
    icon: parsed.icon?.length ? parsed.icon : null,
    sortOrder: parsed.sortOrder,
    active: parsed.active,
  };

  if (parsed.id) {
    const before = await prisma.pricingSupplement.findUnique({
      where: { id: parsed.id },
    });
    if (!before) {
      throw new SupplementActionError(
        "Supplément introuvable",
        "NOT_FOUND",
        404,
      );
    }
    const after = await prisma.pricingSupplement.update({
      where: { id: parsed.id },
      data,
    });
    await writeAudit({
      userId: staff.id,
      action: "supplement.updated",
      entity: "PricingSupplement",
      entityId: after.id,
      diff: { before, after: data },
    });
    revalidatePath("/admin/supplements");
    return { ok: true, id: after.id };
  }

  const created = await prisma.pricingSupplement.create({ data });
  await writeAudit({
    userId: staff.id,
    action: "supplement.created",
    entity: "PricingSupplement",
    entityId: created.id,
    diff: { after: data },
  });
  revalidatePath("/admin/supplements");
  return { ok: true, id: created.id };
}

const toggleSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export async function toggleSupplement(
  input: z.infer<typeof toggleSchema>,
): Promise<{ ok: true }> {
  const parsed = toggleSchema.parse(input);
  const staff = await requireManager();

  await prisma.pricingSupplement.update({
    where: { id: parsed.id },
    data: { active: parsed.active },
  });
  await writeAudit({
    userId: staff.id,
    action: parsed.active ? "supplement.activated" : "supplement.deactivated",
    entity: "PricingSupplement",
    entityId: parsed.id,
    diff: { after: { active: parsed.active } },
  });
  revalidatePath("/admin/supplements");
  return { ok: true };
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function deleteSupplement(
  input: z.infer<typeof deleteSchema>,
): Promise<{ ok: true }> {
  const parsed = deleteSchema.parse(input);
  const staff = await requireManager();

  await prisma.pricingSupplement.delete({ where: { id: parsed.id } });
  await writeAudit({
    userId: staff.id,
    action: "supplement.deleted",
    entity: "PricingSupplement",
    entityId: parsed.id,
    diff: {},
  });
  revalidatePath("/admin/supplements");
  return { ok: true };
}
