import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./prisma";

/**
 * Audit log helper.
 *
 * Call this from every mutation on Reservation, Payment, Property, Guest,
 * and Setting. The PR template's Definition-of-Done checks for it.
 *
 * Accepts an optional Prisma client so callers running inside a transaction
 * can write the audit row in the same transaction:
 *
 *   await prisma.$transaction(async (tx) => {
 *     const r = await tx.reservation.create({ ... });
 *     await writeAudit({ ... }, tx);
 *   });
 */

export interface AuditEvent {
  userId?: string | null;
  /** Dot-namespaced action, e.g. "reservation.created", "payment.received". */
  action: string;
  /** "Reservation" | "Payment" | "Guest" | "Property" | "Setting" | ... */
  entity: string;
  entityId: string;
  /** Free-form. Typical: { before: {...}, after: {...} } or { fields: [...] }. */
  diff: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function writeAudit(
  event: AuditEvent,
  client: Pick<PrismaClient, "auditLog"> = defaultPrisma,
): Promise<void> {
  await client.auditLog.create({
    data: {
      userId: event.userId ?? null,
      action: event.action,
      entity: event.entity,
      entityId: event.entityId,
      diff: event.diff,
      ipAddress: event.ipAddress ?? null,
      userAgent: event.userAgent ?? null,
    },
  });
}
