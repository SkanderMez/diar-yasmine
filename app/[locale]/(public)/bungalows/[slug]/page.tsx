import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { addMonths } from "date-fns";
import {
  findPublicProperty,
  getPropertyRatingSummary,
  listPublicProperties,
  listPublishedReviewsForProperty,
  listReservedRangesForProperty,
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
  if (!property || property.type !== "BUNGALOW") return { title: "Bungalow" };
  return {
    title: property.name,
    description: property.descriptionFr.slice(0, 160),
  };
}

export default async function BungalowDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [property, taxRate, allBungalows] = await Promise.all([
    findPublicProperty(slug),
    getSetting("tax.rate"),
    listPublicProperties("BUNGALOW"),
  ]);
  if (!property || property.type !== "BUNGALOW") notFound();

  const now = new Date();
  const availabilityHorizon = addMonths(now, 18);
  const [ratingSummary, publishedReviews, unavailableRanges] =
    await Promise.all([
      getPropertyRatingSummary(property.id),
      listPublishedReviewsForProperty(property.id, 6),
      listReservedRangesForProperty(property.id, now, availabilityHorizon),
    ]);

  const similarProperties = allBungalows
    .filter((p) => p.id !== property.id)
    .slice(0, 3);

  return (
    <PropertyDetail
      property={property}
      taxRate={taxRate}
      similarProperties={similarProperties}
      ratingSummary={ratingSummary}
      publishedReviews={publishedReviews}
      unavailableRanges={unavailableRanges}
    />
  );
}
