import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { findPublicProperty } from "@/lib/queries";
import { getSetting } from "@/lib/settings";
import { PropertyDetail } from "@/components/public/property-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await findPublicProperty(slug);
  if (!property || property.type !== "CHALET") return { title: "Chalet" };
  return {
    title: property.name,
    description: property.descriptionFr.slice(0, 160),
  };
}

export default async function ChaletDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [property, taxRate] = await Promise.all([
    findPublicProperty(slug),
    getSetting("tax.rate"),
  ]);
  if (!property || property.type !== "CHALET") notFound();

  return <PropertyDetail property={property} taxRate={taxRate} />;
}
