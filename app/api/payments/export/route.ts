import { NextResponse, type NextRequest } from "next/server";
import { addDays, format, isValid, parseISO, startOfDay } from "date-fns";
import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import { auth } from "@/auth";
import { listPaymentsForRange } from "@/lib/queries";
import { millimesToTnd } from "@/lib/money";

/**
 * CSV export of payments matching the same filter set as /admin/payments.
 * Staff-only. Streams a UTF-8 CSV with the BOM so Excel opens it cleanly.
 */
export const dynamic = "force-dynamic";

const ALL_METHODS: PaymentMethod[] = [
  "CASH",
  "CARD",
  "TRANSFER",
  "STRIPE",
  "FLOUCI",
  "KONNECT",
  "OTHER",
];

const ALL_STATUSES: PaymentStatus[] = [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",;\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const today = startOfDay(new Date());
  const startParsed = sp.get("start") ? parseISO(sp.get("start")!) : today;
  const endParsed = sp.get("end") ? parseISO(sp.get("end")!) : today;
  const start = isValid(startParsed) ? startOfDay(startParsed) : today;
  const endInclusive = isValid(endParsed) ? startOfDay(endParsed) : today;
  const end = addDays(endInclusive, 1);

  const methodParam = sp.get("method");
  const statusParam = sp.get("status");

  const { payments } = await listPaymentsForRange({
    start,
    end,
    method: ALL_METHODS.includes(methodParam as PaymentMethod)
      ? (methodParam as PaymentMethod)
      : undefined,
    status: ALL_STATUSES.includes(statusParam as PaymentStatus)
      ? (statusParam as PaymentStatus)
      : undefined,
    query: sp.get("q") ?? undefined,
  });

  const header = [
    "Date",
    "Réservation",
    "Hébergement",
    "Client",
    "Téléphone",
    "Méthode",
    "Statut",
    "Montant (TND)",
    "Référence",
    "Encaissé par",
    "Notes",
  ];

  const lines = [header.map(csvCell).join(",")];
  for (const p of payments) {
    lines.push(
      [
        format(p.receivedAt, "yyyy-MM-dd HH:mm"),
        p.reservation.code,
        p.reservation.property.name,
        `${p.reservation.guest.firstName} ${p.reservation.guest.lastName}`,
        p.reservation.guest.phone,
        p.method,
        p.status,
        millimesToTnd(p.amount).toFixed(3),
        p.reference ?? "",
        p.receivedBy?.name ?? "",
        p.notes ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }

  // BOM for Excel UTF-8 detection.
  const body = "﻿" + lines.join("\r\n");
  const filename = `payments-${format(start, "yyyyMMdd")}-${format(endInclusive, "yyyyMMdd")}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
