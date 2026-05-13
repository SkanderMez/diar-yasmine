"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "./prisma";

/**
 * Quick Book guest autocomplete.
 *
 * Searches Guest by phone digits or name prefix. Returns at most 8 rows.
 * Excludes soft-deleted guests. Sorted: phone-match first, then name.
 */

const searchSchema = z.object({
  query: z.string().trim().min(2).max(80),
});

export async function searchGuests(rawQuery: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentification requise");
  }
  const { query } = searchSchema.parse({ query: rawQuery });
  const digits = query.replace(/[^0-9+]/g, "");

  const guests = await prisma.guest.findMany({
    where: {
      deletedAt: null,
      OR: [
        digits.length >= 2 ? { phone: { contains: digits } } : undefined,
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ].filter(Boolean) as never,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      whatsapp: true,
      country: true,
    },
    take: 8,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return guests;
}
