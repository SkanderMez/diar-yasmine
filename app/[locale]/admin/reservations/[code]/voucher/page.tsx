import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import QRCode from "qrcode";
import type { Metadata } from "next";
import { findReservationByCode } from "@/lib/queries";
import { formatLocalized } from "@/lib/date";
import { env } from "@/lib/env";
import { VoucherToolbar } from "@/components/admin/voucher/voucher-toolbar";
import { VoucherPaper } from "@/components/admin/voucher/voucher-paper";

import "@/components/admin/voucher/voucher-print.css";

export const metadata: Metadata = {
  title: "Voucher — Aperçu",
};

/**
 * Admin voucher preview at /admin/reservations/[code]/voucher.
 *
 * Renders the same data as the PDF (built by `lib/voucher/build.ts`) but
 * as HTML — useful for staff to print, screenshot, or email a one-pager
 * before downloading the canonical PDF. The toolbar provides print + send
 * actions; the paper itself is print-styled via `voucher-print.css`.
 */
export default async function VoucherPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  const data = await findReservationByCode(code);
  if (!data) notFound();

  const { reservation } = data;

  // Build a deterministic voucher number from the canonical reservation
  // code so it survives reissues without a DB write. The format mirrors
  // the maquette (VCH-2026-XXXX) using the year of check-in and the
  // last 4 characters of the reservation code (the random suffix).
  const checkInYear = reservation.checkIn.getUTCFullYear();
  const suffix = reservation.code.slice(-4);
  const voucherNumber = `VCH-${checkInYear}-${suffix}`;

  // Mirror the QR options used by the PDF so both surfaces show the same
  // code at the same resolution / palette.
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const verifyUrl = `${siteUrl}/verify/${reservation.code}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: { dark: "#006378", light: "#faf7f2" },
  });

  // "Issued at" — the closest proxy is `updatedAt` (set on every reissue);
  // we fall back to `createdAt` defensively.
  const issuedAt = reservation.updatedAt ?? reservation.createdAt;
  const issuedLabel = formatLocalized(issuedAt, "d MMM yyyy");

  const signatureName = abbreviateSignature(
    reservation.createdBy?.name ?? null,
  );

  return (
    <>
      <VoucherToolbar
        reservationCode={reservation.code}
        voucherNumber={voucherNumber}
        issuedLabel={issuedLabel}
      />
      <VoucherPaper
        reservation={reservation}
        voucherNumber={voucherNumber}
        qrDataUrl={qrDataUrl}
        issuedAt={issuedAt}
        signatureName={signatureName}
      />
    </>
  );
}

/**
 * Turn "Amine Khelifi" into "Amine K." for the voucher signature line.
 * Falls back to "Diar Yasmine" when no name is available.
 */
function abbreviateSignature(name: string | null): string {
  if (!name) return "Diar Yasmine";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0]!.length === 0) return "Diar Yasmine";
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const lastInitial = parts[parts.length - 1]!.charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}
