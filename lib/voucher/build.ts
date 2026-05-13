import QRCode from "qrcode";
import { prisma } from "../prisma";
import { env } from "../env";
import { getSetting } from "../settings";
import type { VoucherData, VoucherExtra, VoucherPayment } from "./template";

/**
 * Build the VoucherData payload for a given reservation code.
 *
 * Server-only — reads the reservation, guest, property, payments, and
 * generates the verification QR. Throws if the reservation is missing
 * or soft-deleted.
 */
export async function buildVoucherData(code: string): Promise<VoucherData> {
  const reservation = await prisma.reservation.findUnique({
    where: { code },
    include: {
      guest: true,
      property: { select: { name: true, type: true } },
      payments: {
        where: { status: "SUCCEEDED" },
        orderBy: { receivedAt: "asc" },
        select: { amount: true, method: true, receivedAt: true },
      },
    },
  });

  if (!reservation || reservation.deletedAt) {
    throw new Error(`Réservation introuvable : ${code}`);
  }

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const verifyUrl = `${siteUrl}/verify/${reservation.code}`;
  const qrPngDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: { dark: "#006378", light: "#faf7f2" },
  });

  const termsFr =
    (await getSetting("voucher.terms_fr").catch(() => "")) || undefined;

  // `Reservation.extras` is a Prisma Json column carrying entries created
  // by the Server Action with our known shape ({label, amount, category}).
  // Trust-but-narrow: we cast through unknown and skip rows missing
  // either field.
  const extras: VoucherExtra[] = Array.isArray(reservation.extras)
    ? (reservation.extras as unknown as VoucherExtra[]).filter(
        (e) => typeof e?.label === "string" && typeof e?.amount === "number",
      )
    : [];

  const payments: VoucherPayment[] = reservation.payments.map((p) => ({
    amount: p.amount,
    method: p.method,
    receivedAt: p.receivedAt,
  }));

  return {
    code: reservation.code,
    qrPngDataUrl,
    propertyName: reservation.property.name,
    propertyType: reservation.property.type,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    nights: reservation.nights,
    adults: reservation.adults,
    children: reservation.children,
    guestFirstName: reservation.guest.firstName,
    guestLastName: reservation.guest.lastName,
    guestPhone: reservation.guest.phone,
    guestEmail: reservation.guest.email,
    basePrice: reservation.basePrice,
    discountAmount: reservation.discountAmount,
    extras,
    extrasTotal: reservation.extrasTotal,
    subtotal: reservation.subtotal,
    tax: reservation.tax,
    total: reservation.total,
    paidAmount: reservation.paidAmount,
    payments,
    guestRequests: reservation.guestRequests,
    internalNotes: reservation.internalNotes,
    termsFr,
    contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@diaryasmine.tn",
    contactPhone: env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "+216 XX XXX XXX",
    contactAddress: "Tazarka, Cap Bon, Tunisie",
    generatedAt: new Date(),
  };
}
