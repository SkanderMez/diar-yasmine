"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { writeAudit } from "./audit";

/**
 * Amenity catalog admin actions.
 *
 * Only ADMIN and MANAGER can mutate the catalog. Every action writes an
 * audit log row tagged `amenity.*`. The `filterable` flag controls whether
 * the amenity appears in the public listing sidebar.
 */

const slugRegex = /^[a-z0-9-]+$/;

const amenitySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(slugRegex, "Slug: lettres minuscules, chiffres, tirets uniquement"),
  labelFr: z.string().min(1).max(100),
  labelEn: z.string().max(100).optional().nullable(),
  labelAr: z.string().max(100).optional().nullable(),
  icon: z.string().max(60).optional().nullable(),
  category: z.string().max(60).optional().nullable(),
  filterable: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

async function requireAdminOrManager() {
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new Error("forbidden");
  }
  return session.user.id as string;
}

export async function createAmenity(formData: FormData) {
  const userId = await requireAdminOrManager();
  const parsed = amenitySchema.parse({
    slug: formData.get("slug"),
    labelFr: formData.get("labelFr"),
    labelEn: formData.get("labelEn") || null,
    labelAr: formData.get("labelAr") || null,
    icon: formData.get("icon") || null,
    category: formData.get("category") || null,
    filterable: formData.get("filterable") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 100),
  });

  const created = await prisma.amenity.create({ data: parsed });

  await writeAudit({
    userId,
    action: "amenity.created",
    entity: "Amenity",
    entityId: created.id,
    diff: { after: parsed },
  });

  revalidatePath("/admin/amenities");
  return { id: created.id };
}

export async function updateAmenity(id: string, formData: FormData) {
  const userId = await requireAdminOrManager();
  const parsed = amenitySchema.parse({
    slug: formData.get("slug"),
    labelFr: formData.get("labelFr"),
    labelEn: formData.get("labelEn") || null,
    labelAr: formData.get("labelAr") || null,
    icon: formData.get("icon") || null,
    category: formData.get("category") || null,
    filterable: formData.get("filterable") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 100),
  });

  const before = await prisma.amenity.findUnique({ where: { id } });
  if (!before) throw new Error("not_found");

  await prisma.amenity.update({ where: { id }, data: parsed });

  await writeAudit({
    userId,
    action: "amenity.updated",
    entity: "Amenity",
    entityId: id,
    diff: { before, after: parsed },
  });

  revalidatePath("/admin/amenities");
  revalidatePath("/chalets");
  revalidatePath("/bungalows");
}

/**
 * Toggle the `filterable` flag inline from the list page. Keeps the rest
 * of the row intact.
 */
export async function toggleAmenityFilterable(id: string, next: boolean) {
  const userId = await requireAdminOrManager();
  const before = await prisma.amenity.findUnique({ where: { id } });
  if (!before) throw new Error("not_found");
  await prisma.amenity.update({
    where: { id },
    data: { filterable: next },
  });
  await writeAudit({
    userId,
    action: "amenity.filterable_toggled",
    entity: "Amenity",
    entityId: id,
    diff: { before: before.filterable, after: next },
  });
  revalidatePath("/admin/amenities");
  revalidatePath("/chalets");
  revalidatePath("/bungalows");
}

export async function deleteAmenity(id: string) {
  const userId = await requireAdminOrManager();
  const before = await prisma.amenity.findUnique({
    where: { id },
    include: { _count: { select: { properties: true } } },
  });
  if (!before) throw new Error("not_found");
  if (before._count.properties > 0) {
    throw new Error("in_use");
  }
  await prisma.amenity.delete({ where: { id } });
  await writeAudit({
    userId,
    action: "amenity.deleted",
    entity: "Amenity",
    entityId: id,
    diff: { before },
  });
  revalidatePath("/admin/amenities");
}
