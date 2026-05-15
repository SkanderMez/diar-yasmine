import { setRequestLocale } from "next-intl/server";
import { listReviewsForModeration } from "@/lib/queries";
import { ReviewsModeration } from "@/components/admin/reviews/reviews-moderation";

export const dynamic = "force-dynamic";

type StatusFilter = "PENDING" | "PUBLISHED" | "REJECTED" | "ALL";

function parseStatus(raw: string | undefined): StatusFilter {
  if (raw === "PUBLISHED" || raw === "REJECTED" || raw === "ALL") return raw;
  return "PENDING";
}

export default async function AdminReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const status = parseStatus(sp.status);

  const rows = await listReviewsForModeration(status);

  return <ReviewsModeration rows={rows} status={status} />;
}
