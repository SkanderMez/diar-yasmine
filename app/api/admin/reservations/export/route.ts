import { NextResponse, type NextRequest } from "next/server";
import { format } from "date-fns";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { millimesToTnd } from "@/lib/money";
import { formatLocalized } from "@/lib/date";

/**
 * CSV export of reservations selected from /admin/reservations.
 *
 * Reads `?ids=a,b,c` from the query string. Staff-only. Streams a UTF-8
 * CSV with the Excel BOM so it opens cleanly in spreadsheets.
 */
export const dynamic = "force-dynamic";

const ALLOWED_ROLES: UserRole[] = ["ADMIN", "MANAGER", "RECEPTION", "VIEWER"];

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",;\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function reservationStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "En option";
    case "CONFIRMED":
      return "Confirmée";
    case "CHECKED_IN":
      return "Check-in";
    case "CHECKED_OUT":
      return "Terminée";
    case "CANCELLED":
      return "Annulée";
    case "NO_SHOW":
      return "No-show";
    default:
      return status;
  }
}

function sourceLabel(source: string): string {
  switch (source) {
    case "DIRECT_WEB":
      return "Direct";
    case "WALK_IN":
      return "Walk-in";
    case "PHONE":
      return "Téléphone";
    case "PARTNER":
      return "Partenaire";
    case "BOOKING":
      return "Booking";
    case "AIRBNB":
      return "Airbnb";
    case "EXPEDIA":
      return "Expedia";
    case "OTHER":
      return "Autre";
    default:
      return source;
  }
}

function paymentLabel(total: number, paid: number): string {
  if (total <= 0 || paid <= 0) return "Non payée";
  if (paid >= total) return "Payée";
  return "Acompte";
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(session.user.role as UserRole)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const idsParam = request.nextUrl.searchParams.get("ids");
  const ids = (idsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ error: "no_ids" }, { status: 400 });
  }

  const reservations = await prisma.reservation.findMany({
    where: { id: { in: ids }, deletedAt: null },
    orderBy: [{ createdAt: "desc" }],
    select: {
      code: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      adults: true,
      children: true,
      total: true,
      paidAmount: true,
      status: true,
      source: true,
      property: { select: { name: true } },
      guest: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          country: true,
        },
      },
    },
  });

  const header = [
    "Référence",
    "Client",
    "Email",
    "Téléphone",
    "Pays",
    "Hébergement",
    "Arrivée",
    "Départ",
    "Nuits",
    "Adultes",
    "Enfants",
    "Total TTC (TND)",
    "Payé (TND)",
    "Paiement",
    "Statut",
    "Source",
  ];

  const lines = [header.map(csvCell).join(",")];
  for (const r of reservations) {
    lines.push(
      [
        r.code,
        `${r.guest.firstName} ${r.guest.lastName}`,
        r.guest.email ?? "",
        r.guest.phone,
        r.guest.country ?? "",
        r.property.name,
        formatLocalized(r.checkIn, "yyyy-MM-dd"),
        formatLocalized(r.checkOut, "yyyy-MM-dd"),
        r.nights,
        r.adults,
        r.children,
        millimesToTnd(r.total).toFixed(3),
        millimesToTnd(r.paidAmount).toFixed(3),
        paymentLabel(r.total, r.paidAmount),
        reservationStatusLabel(r.status),
        sourceLabel(r.source),
      ]
        .map(csvCell)
        .join(","),
    );
  }

  // BOM for Excel UTF-8 detection.
  const body = "﻿" + lines.join("\r\n");
  const filename = `reservations-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
