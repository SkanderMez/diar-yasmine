import { NextResponse, type NextRequest } from "next/server";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { auth } from "@/auth";
import { aggregateReportData } from "@/lib/reports";
import { millimesToTnd } from "@/lib/money";

export const dynamic = "force-dynamic";

function csv(value: string | number): string {
  const s = String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const end = sp.get("end")
    ? new Date(`${sp.get("end")}T00:00:00Z`)
    : startOfMonth(addMonths(new Date(), 1));
  const start = sp.get("start")
    ? new Date(`${sp.get("start")}T00:00:00Z`)
    : startOfMonth(subMonths(end, 12));

  const data = await aggregateReportData({ start, end });

  const lines = [
    [
      "month",
      "revenue_tnd",
      "occupied_nights",
      "available_nights",
      "occupancy_pct",
      "adr_tnd",
      "revpar_tnd",
    ]
      .map(csv)
      .join(","),
  ];
  for (const m of data.monthly) {
    lines.push(
      [
        m.month,
        millimesToTnd(m.revenue).toFixed(3),
        m.occupiedNights,
        m.availableNights,
        (m.occupancyRate * 100).toFixed(1),
        millimesToTnd(m.adr).toFixed(3),
        millimesToTnd(m.revpar).toFixed(3),
      ]
        .map(csv)
        .join(","),
    );
  }

  const filename = `reports-${format(start, "yyyyMMdd")}-${format(addMonths(end, -1), "yyyyMMdd")}.csv`;
  const body = "﻿" + lines.join("\r\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
