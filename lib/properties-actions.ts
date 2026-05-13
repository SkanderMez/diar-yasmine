"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { writeAudit } from "./audit";
import {
  createPropertySchema,
  updatePropertySchema,
  type CreatePropertyInput,
  type UpdatePropertyInput,
} from "./schemas/property";

/**
 * Property administration Server Actions.
 *
 * All mutations are ADMIN/MANAGER only (RECEPTION can't edit properties).
 * Each action writes an audit row in the same transaction as the mutation.
 */

class PropertyActionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "PropertyActionError";
  }
}

async function requireEditor(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new PropertyActionError(
      "Authentification requise",
      "UNAUTHENTICATED",
      401,
    );
  }
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    throw new PropertyActionError(
      "Réservé à l'administration",
      "FORBIDDEN",
      403,
    );
  }
  return { id: session.user.id };
}

async function setAmenities(
  tx: import("@prisma/client").Prisma.TransactionClient,
  propertyId: string,
  amenitySlugs: string[],
): Promise<void> {
  // Resolve slugs → ids, then sync the join table.
  const amenities = amenitySlugs.length
    ? await tx.amenity.findMany({
        where: { slug: { in: amenitySlugs } },
        select: { id: true, slug: true },
      })
    : [];
  await tx.propertyAmenity.deleteMany({ where: { propertyId } });
  if (amenities.length > 0) {
    await tx.propertyAmenity.createMany({
      data: amenities.map((a) => ({ propertyId, amenityId: a.id })),
      skipDuplicates: true,
    });
  }
}

export async function createProperty(input: CreatePropertyInput) {
  const parsed = createPropertySchema.parse(input);
  const staff = await requireEditor();

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.property.findUnique({
      where: { slug: parsed.slug },
      select: { id: true },
    });
    if (existing) {
      throw new PropertyActionError(
        `Le slug "${parsed.slug}" est déjà utilisé`,
        "SLUG_TAKEN",
        409,
      );
    }
    const property = await tx.property.create({
      data: {
        slug: parsed.slug,
        name: parsed.name,
        type: parsed.type,
        status: parsed.status,
        capacity: parsed.capacity,
        bedrooms: parsed.bedrooms,
        bathrooms: parsed.bathrooms,
        hasPrivatePool: parsed.hasPrivatePool,
        seaView: parsed.seaView,
        beachfront: parsed.beachfront,
        sizeM2: parsed.sizeM2,
        descriptionFr: parsed.descriptionFr,
        descriptionEn: parsed.descriptionEn,
        descriptionAr: parsed.descriptionAr,
        basePrice: parsed.basePrice,
        cleaningFee: parsed.cleaningFee,
        minStay: parsed.minStay,
      },
    });
    await setAmenities(tx, property.id, parsed.amenitySlugs);
    await writeAudit(
      {
        userId: staff.id,
        action: "property.created",
        entity: "Property",
        entityId: property.id,
        diff: {
          after: {
            slug: property.slug,
            name: property.name,
            type: property.type,
          },
        },
      },
      tx,
    );
    return property;
  });

  revalidatePath("/[locale]/admin/properties");
  revalidatePath("/[locale]/admin/calendar");
  return { id: result.id, slug: result.slug };
}

export async function updateProperty(input: UpdatePropertyInput) {
  const parsed = updatePropertySchema.parse(input);
  const staff = await requireEditor();

  const result = await prisma.$transaction(async (tx) => {
    const before = await tx.property.findUnique({
      where: { id: parsed.id },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        basePrice: true,
        cleaningFee: true,
      },
    });
    if (!before) {
      throw new PropertyActionError(
        "Hébergement introuvable",
        "NOT_FOUND",
        404,
      );
    }
    if (before.slug !== parsed.slug) {
      const slugTaken = await tx.property.findUnique({
        where: { slug: parsed.slug },
        select: { id: true },
      });
      if (slugTaken && slugTaken.id !== parsed.id) {
        throw new PropertyActionError(
          `Le slug "${parsed.slug}" est déjà utilisé`,
          "SLUG_TAKEN",
          409,
        );
      }
    }
    const updated = await tx.property.update({
      where: { id: parsed.id },
      data: {
        slug: parsed.slug,
        name: parsed.name,
        type: parsed.type,
        status: parsed.status,
        capacity: parsed.capacity,
        bedrooms: parsed.bedrooms,
        bathrooms: parsed.bathrooms,
        hasPrivatePool: parsed.hasPrivatePool,
        seaView: parsed.seaView,
        beachfront: parsed.beachfront,
        sizeM2: parsed.sizeM2,
        descriptionFr: parsed.descriptionFr,
        descriptionEn: parsed.descriptionEn,
        descriptionAr: parsed.descriptionAr,
        basePrice: parsed.basePrice,
        cleaningFee: parsed.cleaningFee,
        minStay: parsed.minStay,
      },
    });
    await setAmenities(tx, updated.id, parsed.amenitySlugs);
    await writeAudit(
      {
        userId: staff.id,
        action: "property.updated",
        entity: "Property",
        entityId: updated.id,
        diff: {
          before: {
            name: before.name,
            slug: before.slug,
            status: before.status,
            basePrice: before.basePrice,
            cleaningFee: before.cleaningFee,
          },
          after: {
            name: updated.name,
            slug: updated.slug,
            status: updated.status,
            basePrice: updated.basePrice,
            cleaningFee: updated.cleaningFee,
          },
        },
      },
      tx,
    );
    return updated;
  });

  revalidatePath("/[locale]/admin/properties");
  revalidatePath("/[locale]/admin/calendar");
  revalidatePath(`/[locale]/chalets/${result.slug}`);
  revalidatePath(`/[locale]/bungalows/${result.slug}`);
  return { id: result.id, slug: result.slug };
}

export async function softDeleteProperty(input: { id: string }) {
  const staff = await requireEditor();
  const result = await prisma.$transaction(async (tx) => {
    const property = await tx.property.findUnique({
      where: { id: input.id },
      select: { id: true, slug: true, deletedAt: true },
    });
    if (!property)
      throw new PropertyActionError("Introuvable", "NOT_FOUND", 404);
    if (property.deletedAt) return property;

    const active = await tx.reservation.count({
      where: {
        propertyId: input.id,
        deletedAt: null,
        status: { notIn: ["CANCELLED", "NO_SHOW", "CHECKED_OUT"] },
      },
    });
    if (active > 0) {
      throw new PropertyActionError(
        `Impossible : ${active} réservation(s) active(s) sur cet hébergement`,
        "HAS_ACTIVE_RESERVATIONS",
        409,
      );
    }

    const updated = await tx.property.update({
      where: { id: input.id },
      data: { deletedAt: new Date(), status: "INACTIVE" },
      select: { id: true, slug: true },
    });
    await writeAudit(
      {
        userId: staff.id,
        action: "property.soft_deleted",
        entity: "Property",
        entityId: updated.id,
        diff: { after: { slug: updated.slug } },
      },
      tx,
    );
    return updated;
  });

  revalidatePath("/[locale]/admin/properties");
  return result;
}

export async function deletePropertyPhoto(input: { photoId: string }) {
  const staff = await requireEditor();
  const photo = await prisma.photo.delete({
    where: { id: input.photoId },
    select: { id: true, propertyId: true, url: true },
  });
  await writeAudit({
    userId: staff.id,
    action: "property.photo_deleted",
    entity: "Photo",
    entityId: photo.id,
    diff: { after: { url: photo.url } },
  });
  revalidatePath("/[locale]/admin/properties");
  return photo;
}
