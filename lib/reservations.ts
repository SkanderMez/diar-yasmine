"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { writeAudit } from "./audit";
import { generateReservationCode } from "./code";
import { findConflicts, seasonMultiplierForRange } from "./availability";
import { calculateReservationTotal } from "./pricing";
import { parseLocalDate, nightsBetween } from "./date";
import { getSetting } from "./settings";
import {
  createReservationSchema,
  cancelReservationSchema,
  reservationStatusActionSchema,
  type CreateReservationInput,
  type CancelReservationInput,
  type ReservationStatusActionInput,
} from "./schemas/reservation";
import {
  createPaymentSchema,
  type CreatePaymentInput,
} from "./schemas/payment";

/**
 * Reservation Server Actions.
 *
 * - Server-side RBAC: every action checks the session role.
 * - Every mutation writes an AuditLog row within the same transaction.
 * - The DB EXCLUDE GIST constraint on Reservation is the ultimate guard
 *   against double-booking; our app-level checks just produce friendlier
 *   error messages.
 * - revalidatePath is called at the end so calendar / dashboard re-fetch.
 */

class ReservationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "ReservationError";
  }
}

const MUTATING_ROLES = ["ADMIN", "MANAGER", "RECEPTION"] as const;
type MutatingRole = (typeof MUTATING_ROLES)[number];

async function requireStaff(): Promise<{ id: string; role: MutatingRole }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ReservationError(
      "Authentification requise",
      "UNAUTHENTICATED",
      401,
    );
  }
  if (!MUTATING_ROLES.includes(session.user.role as MutatingRole)) {
    throw new ReservationError("Accès en lecture seule", "FORBIDDEN", 403);
  }
  return { id: session.user.id, role: session.user.role as MutatingRole };
}

/**
 * Resolve the staff user id for createReservation: DIRECT_WEB (public
 * funnel) is allowed anonymously and falls through to a logged-in staff
 * member if there happens to be one; every other source requires a
 * MUTATING staff role. Returns null for anonymous public bookings.
 */
async function resolveStaffForReservation(
  source: CreateReservationInput["source"],
): Promise<string | null> {
  if (source === "DIRECT_WEB") {
    const session = await auth();
    return session?.user?.id ?? null;
  }
  const staff = await requireStaff();
  return staff.id;
}

function initialStatusForSource(
  source: CreateReservationInput["source"],
): "PENDING" | "CONFIRMED" {
  // Public web reservations stay pending until payment is confirmed.
  // Everything else (walk-in/phone/partner/OTA) is recorded as confirmed.
  return source === "DIRECT_WEB" ? "PENDING" : "CONFIRMED";
}

export async function createReservation(input: unknown) {
  const parsed = createReservationSchema.parse(input);
  // DIRECT_WEB allows anonymous (public funnel); all other sources require staff.
  const staffId = await resolveStaffForReservation(parsed.source);

  const checkIn = parseLocalDate(parsed.checkInDate);
  const checkOut = parseLocalDate(parsed.checkOutDate);
  const nights = nightsBetween(checkIn, checkOut);

  // Friendly preflight — the DB EXCLUDE GIST constraint is still the
  // authoritative check inside the transaction below.
  const conflicts = await findConflicts({
    propertyId: parsed.propertyId,
    checkIn,
    checkOut,
  });
  if (conflicts.length > 0) {
    throw new ReservationError(
      `Hébergement indisponible : ${conflicts.length} conflit(s) sur ces dates`,
      "PROPERTY_UNAVAILABLE",
      409,
    );
  }

  const property = await prisma.property.findUnique({
    where: { id: parsed.propertyId },
    select: {
      id: true,
      name: true,
      basePrice: true,
      cleaningFee: true,
      status: true,
      deletedAt: true,
    },
  });
  if (!property || property.deletedAt || property.status !== "ACTIVE") {
    throw new ReservationError(
      "Hébergement introuvable ou inactif",
      "PROPERTY_NOT_FOUND",
      404,
    );
  }

  const seasonMultiplierBp = await seasonMultiplierForRange(checkIn, checkOut);
  const taxRate = await getSetting("tax.rate");

  const breakdown = calculateReservationTotal({
    property: {
      basePrice: property.basePrice,
      cleaningFee: property.cleaningFee,
    },
    nights,
    extras: parsed.extras,
    discount: parsed.discount,
    seasonMultiplierBp,
    taxRate,
  });

  // Cleaning fee is folded into the stored `extras` JSON so the voucher
  // can render every line item from a single source of truth.
  const storedExtras = [
    ...(property.cleaningFee > 0
      ? [
          {
            label: "Frais de ménage",
            amount: property.cleaningFee,
            category: "cleaning",
          },
        ]
      : []),
    ...parsed.extras.map((e) => ({
      label: e.label,
      amount: e.amount,
      category: e.category,
    })),
  ];
  const storedExtrasTotal = breakdown.cleaningFee + breakdown.extrasTotal;

  const code = await generateReservationCode(checkIn);

  const result = await prisma.$transaction(async (tx) => {
    // Resolve guest — either existing (by id or by phone) or create a new one.
    let guestId = parsed.guestId;
    if (!guestId) {
      if (!parsed.guest) {
        throw new ReservationError(
          "Données client manquantes",
          "GUEST_REQUIRED",
          400,
        );
      }
      const existing = await tx.guest.findUnique({
        where: { phone: parsed.guest.phone },
      });
      if (existing) {
        guestId = existing.id;
        // Backfill missing details from the form (non-destructive).
        await tx.guest.update({
          where: { id: existing.id },
          data: {
            firstName: existing.firstName || parsed.guest.firstName,
            lastName: existing.lastName || parsed.guest.lastName,
            email: existing.email ?? parsed.guest.email,
            whatsapp: existing.whatsapp ?? parsed.guest.whatsapp,
            country: existing.country ?? parsed.guest.country,
          },
        });
      } else {
        const newGuest = await tx.guest.create({
          data: {
            firstName: parsed.guest.firstName,
            lastName: parsed.guest.lastName,
            phone: parsed.guest.phone,
            email: parsed.guest.email,
            whatsapp: parsed.guest.whatsapp,
            country: parsed.guest.country,
            idDocument: parsed.guest.idDocument,
            notes: parsed.guest.notes,
          },
        });
        guestId = newGuest.id;
        await writeAudit(
          {
            userId: staffId,
            action: "guest.created",
            entity: "Guest",
            entityId: newGuest.id,
            diff: {
              after: {
                phone: parsed.guest.phone,
                source:
                  parsed.source === "DIRECT_WEB"
                    ? "public_funnel"
                    : "quick_book",
              },
            },
          },
          tx,
        );
      }
    }

    const reservation = await tx.reservation.create({
      data: {
        code,
        propertyId: property.id,
        guestId,
        createdById: staffId,
        checkIn,
        checkOut,
        nights: breakdown.nights,
        adults: parsed.adults,
        children: parsed.children,
        basePrice: breakdown.basePrice,
        discountType: parsed.discount.type,
        discountValue: parsed.discount.value,
        discountAmount: breakdown.discountAmount,
        extras: storedExtras as Prisma.InputJsonValue,
        extrasTotal: storedExtrasTotal,
        subtotal: breakdown.subtotal,
        tax: breakdown.tax,
        total: breakdown.total,
        paidAmount: 0,
        status: initialStatusForSource(parsed.source),
        source: parsed.source,
        internalNotes: parsed.internalNotes,
        guestRequests: parsed.guestRequests,
      },
    });

    let payment = null;
    if (parsed.payment && parsed.payment.amount > 0) {
      payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          amount: parsed.payment.amount,
          method: parsed.payment.method,
          status: "SUCCEEDED",
          reference: parsed.payment.reference,
          receivedById: staffId,
        },
      });
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { paidAmount: { increment: parsed.payment.amount } },
      });
      await writeAudit(
        {
          userId: staffId,
          action: "payment.received",
          entity: "Payment",
          entityId: payment.id,
          diff: {
            after: {
              reservationId: reservation.id,
              amount: parsed.payment.amount,
              method: parsed.payment.method,
            },
          },
        },
        tx,
      );
    }

    await writeAudit(
      {
        userId: staffId,
        action: "reservation.created",
        entity: "Reservation",
        entityId: reservation.id,
        diff: {
          after: {
            code,
            propertyId: property.id,
            guestId,
            source: parsed.source,
            nights: breakdown.nights,
            total: breakdown.total,
          },
        },
      },
      tx,
    );

    return { reservation, code, paymentId: payment?.id ?? null };
  });

  revalidatePath("/[locale]/admin/calendar");
  revalidatePath("/[locale]/admin/reservations");
  revalidatePath(`/[locale]/admin/reservations/${result.code}`);

  return {
    id: result.reservation.id,
    code: result.code,
    total: result.reservation.total,
    paymentId: result.paymentId,
  };
}

export async function cancelReservation(input: CancelReservationInput) {
  const parsed = cancelReservationSchema.parse(input);
  const staff = await requireStaff();

  const result = await prisma.$transaction(async (tx) => {
    const before = await tx.reservation.findUnique({
      where: { id: parsed.id },
      select: { id: true, status: true, code: true },
    });
    if (!before) {
      throw new ReservationError("Réservation introuvable", "NOT_FOUND", 404);
    }
    if (before.status === "CANCELLED") {
      throw new ReservationError("Déjà annulée", "ALREADY_CANCELLED", 409);
    }

    const updated = await tx.reservation.update({
      where: { id: parsed.id },
      data: { status: "CANCELLED" },
      select: { id: true, code: true, status: true },
    });

    await writeAudit(
      {
        userId: staff.id,
        action: "reservation.cancelled",
        entity: "Reservation",
        entityId: updated.id,
        diff: {
          before: { status: before.status },
          after: { status: "CANCELLED", reason: parsed.reason ?? null },
        },
      },
      tx,
    );

    return updated;
  });

  revalidatePath("/[locale]/admin/calendar");
  revalidatePath("/[locale]/admin/reservations");
  revalidatePath(`/[locale]/admin/reservations/${result.code}`);
  return result;
}

export async function updateReservationStatus(
  input: ReservationStatusActionInput,
) {
  const parsed = reservationStatusActionSchema.parse(input);
  const staff = await requireStaff();

  const result = await prisma.$transaction(async (tx) => {
    const before = await tx.reservation.findUnique({
      where: { id: parsed.id },
      select: { status: true, code: true },
    });
    if (!before) {
      throw new ReservationError("Réservation introuvable", "NOT_FOUND", 404);
    }
    const updated = await tx.reservation.update({
      where: { id: parsed.id },
      data: { status: parsed.status },
      select: { id: true, code: true, status: true },
    });
    await writeAudit(
      {
        userId: staff.id,
        action: `reservation.status_changed`,
        entity: "Reservation",
        entityId: updated.id,
        diff: {
          before: { status: before.status },
          after: { status: parsed.status },
        },
      },
      tx,
    );
    return updated;
  });

  revalidatePath("/[locale]/admin/calendar");
  revalidatePath(`/[locale]/admin/reservations/${result.code}`);
  return result;
}

export async function addPayment(input: CreatePaymentInput) {
  const parsed = createPaymentSchema.parse(input);
  const staff = await requireStaff();

  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: parsed.reservationId },
      select: {
        id: true,
        code: true,
        paidAmount: true,
        total: true,
        deletedAt: true,
      },
    });
    if (!reservation || reservation.deletedAt) {
      throw new ReservationError("Réservation introuvable", "NOT_FOUND", 404);
    }
    if (reservation.paidAmount + parsed.amount > reservation.total) {
      throw new ReservationError(
        "Paiement supérieur au solde restant",
        "OVERPAYMENT",
        400,
      );
    }

    const payment = await tx.payment.create({
      data: {
        reservationId: reservation.id,
        amount: parsed.amount,
        method: parsed.method,
        status: "SUCCEEDED",
        reference: parsed.reference,
        notes: parsed.notes,
        receivedById: staff.id,
      },
    });

    await tx.reservation.update({
      where: { id: reservation.id },
      data: { paidAmount: { increment: parsed.amount } },
    });

    await writeAudit(
      {
        userId: staff.id,
        action: "payment.received",
        entity: "Payment",
        entityId: payment.id,
        diff: {
          after: {
            reservationId: reservation.id,
            amount: parsed.amount,
            method: parsed.method,
          },
        },
      },
      tx,
    );

    return { paymentId: payment.id, reservationCode: reservation.code };
  });

  revalidatePath("/[locale]/admin/payments");
  revalidatePath(`/[locale]/admin/reservations/${result.reservationCode}`);
  return result;
}

// Public helper for the calendar / Quick Book form: surface conflicts for
// a date range so the UI can show them before the user submits.
export async function checkAvailability(input: {
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  excludeReservationId?: string;
}) {
  const dates = z
    .object({
      propertyId: z.string().min(1),
      checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      excludeReservationId: z.string().optional(),
    })
    .parse(input);

  const checkIn = parseLocalDate(dates.checkInDate);
  const checkOut = parseLocalDate(dates.checkOutDate);
  if (checkOut <= checkIn) {
    return {
      available: false,
      reason: "INVALID_RANGE" as const,
      conflicts: [],
    };
  }
  const conflicts = await findConflicts({
    propertyId: dates.propertyId,
    checkIn,
    checkOut,
    excludeReservationId: dates.excludeReservationId,
  });
  return {
    available: conflicts.length === 0,
    reason: conflicts.length === 0 ? null : ("CONFLICT" as const),
    conflicts: conflicts.map((c) => ({
      id: c.id,
      code: c.code,
      checkIn: c.checkIn.toISOString(),
      checkOut: c.checkOut.toISOString(),
      source: c.source,
      guestName: `${c.guest.firstName} ${c.guest.lastName}`,
    })),
  };
}
