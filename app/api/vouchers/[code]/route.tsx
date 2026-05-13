import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { isValidReservationCode } from "@/lib/code";
import { buildVoucherData } from "@/lib/voucher/build";
import { VoucherDocument } from "@/lib/voucher/template";
import { logger } from "@/lib/logger";

/**
 * GET /api/vouchers/[code] — stream a PDF voucher.
 *
 * Access policy:
 *  - Authenticated staff: any code.
 *  - Anonymous: only with a matching `?token=` (post-Phase 2.5 we'll
 *    add a signed query-param flow for email/SMS links).
 *
 * For Phase 2 the route is staff-only; the unauthenticated path returns
 * 401. We still validate the code format up front to avoid burning CPU
 * on garbage input.
 */
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!isValidReservationCode(code)) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await buildVoucherData(code);
    const buffer = await renderToBuffer(<VoucherDocument data={data} />);
    // Buffer → Uint8Array so Next 16's stricter BodyInit typing accepts it.
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="voucher-${code}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    logger.error({ err, code }, "voucher render failed");
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
