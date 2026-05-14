"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ChannelType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "../prisma";
import { writeAudit } from "../audit";
import { logger } from "../logger";
import { syncAllChannels, syncChannel } from "./sync";

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

const channelEnumSchema = z.enum(["BOOKING", "AIRBNB", "EXPEDIA", "OTHER"]);

const toggleSchema = z.object({
  channel: channelEnumSchema,
  enabled: z.boolean(),
});

/**
 * Toggle a channel on/off. Until the schema gains an explicit
 * `Channel.enabled` flag, this is a stub that writes an audit-log entry
 * so the action is traceable and the UI optimistic switch round-trip
 * stays honest.
 */
export async function toggleChannel(input: unknown) {
  const parsed = toggleSchema.parse(input);
  const staff = await requireEditor();

  await writeAudit({
    userId: staff.id,
    action: "channel.toggled",
    entity: "ChannelSync",
    entityId: parsed.channel,
    diff: { channel: parsed.channel, enabled: parsed.enabled },
  });

  revalidatePath("/[locale]/admin/channels");
  return { channel: parsed.channel, enabled: parsed.enabled };
}

const forceSyncSchema = z.object({ channel: channelEnumSchema });

/**
 * Run an immediate sync for every ChannelSync row attached to `channel`.
 * Aggregates per-listing summaries into a single response so the UI can
 * surface a single toast.
 */
export async function forceSyncChannel(input: unknown) {
  const parsed = forceSyncSchema.parse(input);
  const staff = await requireEditor();

  const rows = await prisma.channelSync.findMany({
    where: { channel: parsed.channel, url: { not: null } },
    select: { id: true },
  });

  await writeAudit({
    userId: staff.id,
    action: "channel.sync_started",
    entity: "ChannelSync",
    entityId: parsed.channel,
    diff: { channel: parsed.channel, count: rows.length },
  });

  const summaries: Awaited<ReturnType<typeof syncChannel>>[] = [];
  for (const row of rows) {
    try {
      summaries.push(await syncChannel(row.id));
    } catch (err) {
      logger.error(
        { err, syncId: row.id },
        "forceSyncChannel: per-row failure",
      );
    }
  }

  const totals = summaries.reduce(
    (acc, s) => ({
      fetched: acc.fetched + s.fetched,
      created: acc.created + s.created,
      updated: acc.updated + s.updated,
      cancelled: acc.cancelled + s.cancelled,
      errors: acc.errors + (s.error ? 1 : 0),
    }),
    { fetched: 0, created: 0, updated: 0, cancelled: 0, errors: 0 },
  );

  await writeAudit({
    userId: staff.id,
    action:
      totals.errors > 0 ? "channel.sync_failed" : "channel.sync_completed",
    entity: "ChannelSync",
    entityId: parsed.channel,
    diff: { channel: parsed.channel, ...totals },
  });

  revalidatePath("/[locale]/admin/channels");
  revalidatePath("/[locale]/admin/calendar");

  return { channel: parsed.channel, ...totals };
}

/**
 * Run the full sync over every configured channel. Wraps
 * `syncAllChannels()` and audits the run so the channel log captures the
 * manual trigger.
 */
export async function forceSyncAll() {
  const staff = await requireEditor();

  await writeAudit({
    userId: staff.id,
    action: "channel.sync_started",
    entity: "ChannelSync",
    entityId: "ALL",
    diff: { channel: "ALL" },
  });

  const summaries = await syncAllChannels();

  const totals = summaries.reduce(
    (acc, s) => ({
      fetched: acc.fetched + s.fetched,
      created: acc.created + s.created,
      updated: acc.updated + s.updated,
      cancelled: acc.cancelled + s.cancelled,
      errors: acc.errors + (s.error ? 1 : 0),
    }),
    { fetched: 0, created: 0, updated: 0, cancelled: 0, errors: 0 },
  );

  await writeAudit({
    userId: staff.id,
    action:
      totals.errors > 0 ? "channel.sync_failed" : "channel.sync_completed",
    entity: "ChannelSync",
    entityId: "ALL",
    diff: { channel: "ALL", ...totals },
  });

  revalidatePath("/[locale]/admin/channels");
  revalidatePath("/[locale]/admin/calendar");

  return totals;
}

// Type-only export kept so callers can type-check the channel param of
// toggleChannel / forceSyncChannel without re-importing from @prisma/client.
export type { ChannelType };
