import { prisma } from "./prisma";

/**
 * Server-only read helpers used by admin layouts and Server Components.
 * NOT Server Actions — these are plain functions you call from a Server
 * Component, no `"use server"` directive needed.
 */

/**
 * List the active properties for the Quick Book unit picker and the
 * calendar grid. Sorted: chalets first (alphabetical), then bungalows.
 */
export async function listActiveProperties() {
  const properties = await prisma.property.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      capacity: true,
      basePrice: true,
      cleaningFee: true,
      hasPrivatePool: true,
      seaView: true,
      beachfront: true,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return properties;
}

export type ActiveProperty = Awaited<
  ReturnType<typeof listActiveProperties>
>[number];
