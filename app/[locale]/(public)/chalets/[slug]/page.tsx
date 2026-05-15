import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  findPublicProperty,
  getPropertyRatingSummary,
  listPublicProperties,
  listPublishedReviewsForProperty,
} from "@/lib/queries";
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

  const [property, taxRate, allChalets] = await Promise.all([
    findPublicProperty(slug),
    getSetting("tax.rate"),
    listPublicProperties("CHALET"),
  ]);
  if (!property || property.type !== "CHALET") notFound();

  const [ratingSummary, publishedReviews] = await Promise.all([
    getPropertyRatingSummary(property.id),
    listPublishedReviewsForProperty(property.id, 6),
  ]);

  const similarProperties = allChalets
    .filter((p) => p.id !== property.id)
    .slice(0, 3);

  return (
    <PropertyDetail
      property={property}
      taxRate={taxRate}
      similarProperties={similarProperties}
      ratingSummary={ratingSummary}
      publishedReviews={publishedReviews}
    />
  );
}
