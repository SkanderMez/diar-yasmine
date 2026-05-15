import { setRequestLocale } from "next-intl/server";
import { listAllSupplements } from "@/lib/queries";
import { SupplementsClient } from "@/components/admin/supplements/supplements-client";

export const dynamic = "force-dynamic";

export default async function SupplementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rows = await listAllSupplements();

  return <SupplementsClient rows={rows} />;
}
