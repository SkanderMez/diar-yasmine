import { setRequestLocale } from "next-intl/server";
import { listPromoCodes } from "@/lib/queries";
import { PromoCodesClient } from "@/components/admin/promo-codes/promo-codes-client";

export const dynamic = "force-dynamic";

export default async function PromoCodesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rows = await listPromoCodes();

  return <PromoCodesClient rows={rows} />;
}
