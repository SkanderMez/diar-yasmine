import type { ChannelType, Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { writeAudit } from "../audit";
import { generateReservationCode } from "../code";
import { logger } from "../logger";
import { parseICalFeed, type ParsedICalEvent } from "./ical";

/**
 * Channel sync — pulls iCal feeds from OTAs and reconciles them into the
 * local DB.
 *
 * Phase 5 MVP scope:
 *   - Fetches every ChannelSync row that has a URL configured.
 *   - Creates/updates Reservation rows keyed by externalId (= iCal UID).
 *   - Marks reservations CANCELLED when they vanish from the upstream feed.
 *   - Always associates an "OTA placeholder" Guest per channel so the
 *     foreign-key invariant holds even without guest details from the OTA.
 *
 * Out of scope (future): real-time push from Booking via the official API,
 * partial sync per property, full reservation details (guest contact),
 * conflict UI (calendar warning if overlap detected with a DIRECT_WEB
 * reservation).
 */

interface SyncSummary {
  channel: ChannelType;
  propertyId: string;
  fetched: number;
  created: number;
  updated: number;
  cancelled: number;
  error?: string;
}

const CHANNEL_TO_SOURCE: Record<
  ChannelType,
  "BOOKING" | "AIRBNB" | "EXPEDIA" | "OTHER"
> = {
  BOOKING: "BOOKING",
  AIRBNB: "AIRBNB",
  EXPEDIA: "EXPEDIA",
  OTHER: "OTHER",
};

const PLACEHOLDER_PHONE_PREFIX = "+000000";

async function ensureOTAPlaceholderGuest(
  tx: Prisma.TransactionClient,
  channel: ChannelType,
): Promise<string> {
  const phone = `${PLACEHOLDER_PHONE_PREFIX}${channel}`;
  const existing = await tx.guest.findUnique({
    where: { phone },
    select: { id: true },
  });
  if (existing) return existing.id;
  const guest = await tx.guest.create({
    data: {
      firstName: channel,
      lastName: "Guest",
      phone,
      notes: `Placeholder guest for ${channel} OTA imports. Real guest details land via the OTA's official API in Phase 5.5.`,
    },
    select: { id: true },
  });
  return guest.id;
}

export async function syncChannel(syncId: string): Promise<SyncSummary> {
  const sync = await prisma.channelSync.findUnique({
    where: { id: syncId },
    select: { id: true, channel: true, propertyId: true, url: true },
  });
  if (!sync || !sync.url) {
    throw new Error(`ChannelSync ${syncId} has no URL`);
  }

  const summary: SyncSummary = {
    channel: sync.channel,
    propertyId: sync.propertyId,
    fetched: 0,
    created: 0,
    updated: 0,
    cancelled: 0,
  };

  try {
    const response = await fetch(sync.url, {
      headers: { "User-Agent": "DiarYasminePMS/1.0" },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const body = await response.text();
    const events = parseICalFeed(body);
    summary.fetched = events.length;

    await prisma.$transaction(async (tx) => {
      const guestId = await ensureOTAPlaceholderGuest(tx, sync.channel);
      const externalIds = new Set(events.map((e) => e.uid));

      for (const event of events) {
        const r = await applyEvent(tx, sync, guestId, event);
        if (r === "created") summary.created++;
        if (r === "updated") summary.updated++;
      }

      // Cancel local reservations whose externalId disappeared upstream.
      const stale = await tx.reservation.findMany({
        where: {
          propertyId: sync.propertyId,
          source: CHANNEL_TO_SOURCE[sync.channel],
          externalId: { not: null, notIn: Array.from(externalIds) },
          status: { notIn: ["CANCELLED", "NO_SHOW", "CHECKED_OUT"] },
          deletedAt: null,
        },
        select: { id: true, code: true, externalId: true },
      });
      for (const r of stale) {
        await tx.reservation.update({
          where: { id: r.id },
          data: { status: "CANCELLED" },
        });
        await writeAudit(
          {
            action: "reservation.cancelled_via_channel_sync",
            entity: "Reservation",
            entityId: r.id,
            diff: { channel: sync.channel, externalId: r.externalId },
          },
          tx,
        );
        summary.cancelled++;
      }

      await tx.channelSync.update({
        where: { id: sync.id },
        data: {
          lastSyncAt: new Date(),
          status: "IDLE",
          log: { ...summary, ranAt: new Date().toISOString() },
        },
      });
    });
  } catch (err) {
    summary.error = err instanceof Error ? err.message : String(err);
    logger.error(
      { err, channel: sync.channel, propertyId: sync.propertyId },
      "channel sync failed",
    );
    await prisma.channelSync.update({
      where: { id: sync.id },
      data: {
        lastSyncAt: new Date(),
        status: "ERROR",
        log: { ...summary, ranAt: new Date().toISOString() },
      },
    });
  }

  return summary;
}

async function applyEvent(
  tx: Prisma.TransactionClient,
  sync: { id: string; channel: ChannelType; propertyId: string },
  guestId: string,
  event: ParsedICalEvent,
): Promise<"created" | "updated" | "noop"> {
  // Skip events that don't actually block a date (some OTAs publish
  // STATUS:CANCELLED rows for traceability — they should NOT consume a
  // calendar slot).
  if (event.status === "CANCELLED") return "noop";

  const existing = await tx.reservation.findFirst({
    where: {
      propertyId: sync.propertyId,
      source: CHANNEL_TO_SOURCE[sync.channel],
      externalId: event.uid,
    },
    select: { id: true, checkIn: true, checkOut: true, status: true },
  });

  // Half-open interval: iCal DTEND is the day AFTER the last night, which
  // matches our tstzrange '[)' DB constraint.
  const checkIn = event.start;
  const checkOut = event.end;
  const nights = Math.max(
    1,
    Math.round(
      (checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000),
    ),
  );

  if (existing) {
    const sameRange =
      existing.checkIn.getTime() === checkIn.getTime() &&
      existing.checkOut.getTime() === checkOut.getTime();
    if (sameRange && existing.status !== "CANCELLED") return "noop";
    await tx.reservation.update({
      where: { id: existing.id },
      data: { checkIn, checkOut, nights, status: "CONFIRMED" },
    });
    await writeAudit(
      {
        action: "reservation.updated_via_channel_sync",
        entity: "Reservation",
        entityId: existing.id,
        diff: { channel: sync.channel, externalId: event.uid },
      },
      tx,
    );
    return "updated";
  }

  const code = await generateReservationCode(checkIn);
  const created = await tx.reservation.create({
    data: {
      code,
      propertyId: sync.propertyId,
      guestId,
      checkIn,
      checkOut,
      nights,
      adults: 1,
      children: 0,
      basePrice: 0,
      discountType: "NONE",
      discountValue: 0,
      discountAmount: 0,
      extras: [],
      extrasTotal: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
      paidAmount: 0,
      status: "CONFIRMED",
      source: CHANNEL_TO_SOURCE[sync.channel],
      externalId: event.uid,
      internalNotes: `Imported from ${sync.channel} (${event.summary || "no summary"})`,
    },
  });
  await writeAudit(
    {
      action: "reservation.imported_from_channel",
      entity: "Reservation",
      entityId: created.id,
      diff: { channel: sync.channel, externalId: event.uid, code },
    },
    tx,
  );
  return "created";
}

/**
 * Sync every configured channel. Intended target of the Vercel Cron entry
 * point at /api/cron/sync-channels (15-minute schedule). Returns a list of
 * per-channel summaries so the caller can log / inspect.
 */
export async function syncAllChannels(): Promise<SyncSummary[]> {
  const rows = await prisma.channelSync.findMany({
    where: { url: { not: null } },
    select: { id: true },
  });
  const summaries: SyncSummary[] = [];
  for (const row of rows) {
    summaries.push(await syncChannel(row.id));
  }
  return summaries;
}
