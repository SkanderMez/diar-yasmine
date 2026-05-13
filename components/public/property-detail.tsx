import { ArrowLeft, Bath, Bed, MapPin, Users, Waves } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PublicPropertyDetail } from "@/lib/queries";
import { PropertyGallery } from "./property-gallery";
import { BookingWidget } from "./booking-widget";
import { PropertyJsonLd } from "./json-ld";

interface PropertyDetailProps {
  property: PublicPropertyDetail;
  taxRate: number;
}

export function PropertyDetail({ property, taxRate }: PropertyDetailProps) {
  const photos = property.photos.map((p) => ({ url: p.url, alt: p.alt }));
  const listingHref = property.type === "CHALET" ? "/chalets" : "/bungalows";
  const listingLabel = property.type === "CHALET" ? "Chalets" : "Bungalows";

  const stats: { icon: React.ReactNode; label: string }[] = [
    {
      icon: <Users className="size-4" />,
      label: `${property.capacity} personnes`,
    },
    {
      icon: <Bed className="size-4" />,
      label: `${property.bedrooms} chambres`,
    },
    {
      icon: <Bath className="size-4" />,
      label: `${property.bathrooms} salles de bain`,
    },
    ...(property.sizeM2
      ? [
          {
            icon: <MapPin className="size-4" />,
            label: `${property.sizeM2} m²`,
          },
        ]
      : []),
  ];

  return (
    <main className="flex-1">
      <PropertyJsonLd property={property} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-sm">
          <Link
            href={listingHref}
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour aux {listingLabel}
          </Link>
        </nav>

        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              {listingLabel}
            </p>
            <h1 className="mt-2 text-3xl font-medium text-foreground sm:text-4xl">
              {property.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              <MapPin className="mr-1 inline size-3.5" />
              Tazarka, Cap Bon, Tunisie
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {property.beachfront && (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Waves className="size-3" /> Pieds dans l&apos;eau
              </li>
            )}
            {property.hasPrivatePool && (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                Piscine privée
              </li>
            )}
            {property.seaView && (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                Vue mer
              </li>
            )}
          </ul>
        </header>

        <PropertyGallery photos={photos} propertyName={property.name} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            <section className="space-y-4">
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="rounded-md bg-secondary p-2 text-primary">
                      {s.icon}
                    </span>
                    <span className="text-foreground">{s.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-medium text-foreground">
                Description
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                {property.descriptionFr}
              </p>
            </section>

            {property.amenities.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-medium text-foreground">
                  Équipements
                </h2>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.amenities.map((pa) => (
                    <li
                      key={pa.amenity.slug}
                      className="flex items-center gap-2 text-sm text-foreground/80"
                    >
                      <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-primary"
                      />
                      {pa.amenity.labelFr}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <BookingWidget
            propertyId={property.id}
            propertySlug={property.slug}
            basePrice={property.basePrice}
            cleaningFee={property.cleaningFee}
            capacity={property.capacity}
            taxRate={taxRate}
          />
        </div>
      </div>
    </main>
  );
}
