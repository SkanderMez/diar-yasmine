import type { PublicPropertyDetail } from "@/lib/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://diaryasmine.tn";

/**
 * schema.org JSON-LD for the home page. Describes the umbrella
 * LodgingBusiness with general info.
 */
export function HomeJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Diar Yasmine Tazarka Plage",
    description:
      "21 chalets et bungalows familiaux en bord de mer méditerranéenne, Tazarka, Cap Bon, Tunisie.",
    url: SITE_URL,
    image: `${SITE_URL}/brand/og-default.svg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tazarka",
      addressRegion: "Cap Bon",
      addressCountry: "TN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 36.5919,
      longitude: 10.8156,
    },
    priceRange: "€€",
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: "Private pool",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Beachfront",
        value: true,
      },
      { "@type": "LocationFeatureSpecification", name: "Wi-Fi", value: true },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Per-property JSON-LD (used on /chalets/[slug] and /bungalows/[slug]).
 * schema.org/LodgingBusiness with the unit's price + photos.
 */
export function PropertyJsonLd({
  property,
}: {
  property: PublicPropertyDetail;
}) {
  const segment = property.type === "CHALET" ? "chalets" : "bungalows";
  const url = `${SITE_URL}/fr/${segment}/${property.slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: `Diar Yasmine — ${property.name}`,
    description: property.descriptionFr,
    url,
    image: property.photos.map((p) => p.url).slice(0, 6),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tazarka",
      addressRegion: "Cap Bon",
      addressCountry: "TN",
    },
    numberOfRooms: property.bedrooms,
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: property.capacity,
    },
    petsAllowed: false,
    priceRange: `${Math.round(property.basePrice / 1000)} TND / nuit`,
    amenityFeature: [
      property.hasPrivatePool && {
        "@type": "LocationFeatureSpecification",
        name: "Private pool",
        value: true,
      },
      property.beachfront && {
        "@type": "LocationFeatureSpecification",
        name: "Beachfront",
        value: true,
      },
      property.seaView && {
        "@type": "LocationFeatureSpecification",
        name: "Sea view",
        value: true,
      },
    ].filter(Boolean),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
