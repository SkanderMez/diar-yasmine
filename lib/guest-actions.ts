"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { writeAudit } from "./audit";

class GuestActionError extends Error {
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
    this.name = "GuestActionError";
  }
}

async function requireStaff(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new GuestActionError(
      "Authentification requise",
      "UNAUTHENTICATED",
      401,
    );
  }
  if (!["ADMIN", "MANAGER", "RECEPTION"].includes(session.user.role)) {
    throw new GuestActionError("Permissions insuffisantes", "FORBIDDEN", 403);
  }
  return { id: session.user.id };
}

const toggleVipSchema = z.object({
  guestId: z.string().min(1),
  isVip: z.boolean(),
});

export async function setGuestVip(
  input: z.infer<typeof toggleVipSchema>,
): Promise<{ ok: true; isVip: boolean }> {
  const parsed = toggleVipSchema.parse(input);
  const staff = await requireStaff();

  const before = await prisma.guest.findUnique({
    where: { id: parsed.guestId },
    select: { isVip: true },
  });
  if (!before) {
    throw new GuestActionError("Voyageur introuvable", "NOT_FOUND", 404);
  }

  const after = await prisma.guest.update({
    where: { id: parsed.guestId },
    data: { isVip: parsed.isVip },
    select: { isVip: true },
  });

  await writeAudit({
    userId: staff.id,
    action: parsed.isVip ? "guest.vip_set" : "guest.vip_unset",
    entity: "Guest",
    entityId: parsed.guestId,
    diff: { before: { isVip: before.isVip }, after: { isVip: after.isVip } },
  });

  revalidatePath("/admin/clients");

  return { ok: true, isVip: after.isVip };
}

const updateTagsSchema = z.object({
  guestId: z.string().min(1),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
});

export async function setGuestTags(
  input: z.infer<typeof updateTagsSchema>,
): Promise<{ ok: true; tags: string[] }> {
  const parsed = updateTagsSchema.parse(input);
  const staff = await requireStaff();

  const before = await prisma.guest.findUnique({
    where: { id: parsed.guestId },
    select: { tags: true },
  });
  if (!before) {
    throw new GuestActionError("Voyageur introuvable", "NOT_FOUND", 404);
  }

  // Deduplicate, preserve order.
  const seen = new Set<string>();
  const nextTags = parsed.tags.filter((t) => {
    const key = t.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const after = await prisma.guest.update({
    where: { id: parsed.guestId },
    data: { tags: nextTags },
    select: { tags: true },
  });

  await writeAudit({
    userId: staff.id,
    action: "guest.tags_updated",
    entity: "Guest",
    entityId: parsed.guestId,
    diff: { before: { tags: before.tags }, after: { tags: after.tags } },
  });

  revalidatePath("/admin/clients");

  return { ok: true, tags: after.tags };
}
