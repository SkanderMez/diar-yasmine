import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PropertyForm } from "@/components/admin/properties/property-form";

export default async function NewPropertyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const amenities = await prisma.amenity.findMany({
    select: {
      slug: true,
      labelFr: true,
      category: true,
      filterable: true,
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { labelFr: "asc" }],
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-medium text-foreground">
          Nouvel hébergement
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crée un chalet ou un bungalow. Tu pourras ajouter les photos juste
          après.
        </p>
      </header>

      <PropertyForm
        mode="create"
        amenities={amenities}
        defaults={{
          slug: "",
          name: "",
          type: "CHALET",
          status: "ACTIVE",
          capacity: 4,
          bedrooms: 2,
          bathrooms: 1,
          hasPrivatePool: false,
          seaView: false,
          beachfront: false,
          sizeM2: undefined,
          descriptionFr: "",
          basePrice: 0,
          cleaningFee: 0,
          minStay: 1,
          amenitySlugs: [],
        }}
      />
    </div>
  );
}
