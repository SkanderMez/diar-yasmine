import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PropertyForm } from "@/components/admin/properties/property-form";
import { PhotoManager } from "@/components/admin/properties/photo-manager";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [property, amenities] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: {
        amenities: {
          select: { amenityId: true, amenity: { select: { slug: true } } },
        },
        photos: { orderBy: { order: "asc" } },
      },
    }),
    prisma.amenity.findMany({
      select: {
        slug: true,
        labelFr: true,
        category: true,
        filterable: true,
      },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { labelFr: "asc" }],
    }),
  ]);

  if (!property || property.deletedAt) notFound();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Édition
        </p>
        <h1 className="mt-1 text-3xl font-medium text-foreground">
          {property.name}
        </h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Photos
        </h2>
        <PhotoManager
          propertyId={property.id}
          initial={property.photos.map((p) => ({
            id: p.id,
            url: p.url,
            alt: p.alt,
          }))}
        />
      </section>

      <section className="space-y-3 border-t border-border pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Informations
        </h2>
        <PropertyForm
          mode="edit"
          amenities={amenities}
          defaults={{
            id: property.id,
            slug: property.slug,
            name: property.name,
            type: property.type,
            status: property.status,
            capacity: property.capacity,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            hasPrivatePool: property.hasPrivatePool,
            seaView: property.seaView,
            beachfront: property.beachfront,
            sizeM2: property.sizeM2,
            descriptionFr: property.descriptionFr,
            descriptionEn: property.descriptionEn,
            descriptionAr: property.descriptionAr,
            basePrice: property.basePrice,
            cleaningFee: property.cleaningFee,
            minStay: property.minStay,
            amenitySlugs: property.amenities.map((pa) => pa.amenity.slug),
          }}
        />
      </section>
    </div>
  );
}
