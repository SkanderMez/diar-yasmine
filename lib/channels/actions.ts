"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "../prisma";
import { writeAudit } from "../audit";
import { syncChannel } from "./sync";

/**
 * Channel admin Server Actions — ADMIN/MANAGER only.
 */

const upsertSchema = z.object({
  propertyId: z.string().min(1),
  channel: z.enum(["BOOKING", "AIRBNB", "EXPEDIA", "OTHER"]),
  url: z.string().url().nullable(),
});

async function requireEditor(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Authentification requise");
  if (!["ADMIN", "MANAGER"].includes(session.user.role))
    throw new Error("Réservé à l'administration");
  return { id: session.user.id };
}

export async function upsertChannelSync(input: unknown) {
  const parsed = upsertSchema.parse(input);
  const staff = await requireEditor();

  const existing = await prisma.channelSync.findUnique({
    where: {
      channel_propertyId: {
        channel: parsed.channel,
        propertyId: parsed.propertyId,
      },
    },
  });

  const updated = await prisma.channelSync.upsert({
    where: {
      channel_propertyId: {
        channel: parsed.channel,
        propertyId: parsed.propertyId,
      },
    },
    create: {
      channel: parsed.channel,
      propertyId: parsed.propertyId,
      url: parsed.url ?? undefined,
      status: "IDLE",
    },
    update: { url: parsed.url ?? null, status: "IDLE" },
    select: { id: true, channel: true, url: true },
  });

  await writeAudit({
    userId: staff.id,
    action: "channel.updated",
    entity: "ChannelSync",
    entityId: updated.id,
    diff: {
      before: existing ? { url: existing.url } : null,
      after: { channel: updated.channel, url: updated.url },
    },
  });

  revalidatePath("/[locale]/admin/channels");
  return updated;
}

export async function runChannelSyncNow(input: { syncId: string }) {
  await requireEditor();
  const summary = await syncChannel(input.syncId);
  revalidatePath("/[locale]/admin/channels");
  revalidatePath("/[locale]/admin/calendar");
  return summary;
}
