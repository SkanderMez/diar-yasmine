import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  getPropertyPriceRange,
  listFilterableAmenities,
  listPublicProperties,
} from "@/lib/queries";
import { ListingPageHero } from "@/components/public/listings/listing-page-hero";
import { FloatingFilterBar } from "@/components/public/listings/floating-filter-bar";
import { ListingSidebarFilters } from "@/components/public/listings/listing-sidebar-filters";
import { ListingToolbar } from "@/components/public/listings/listing-toolbar";
import { ListingCard } from "@/components/public/listings/listing-card";
import { ListingEmptyState } from "@/components/public/listings/listing-empty-state";
import { FadeIn } from "@/components/public/fade-in";

export const metadata: Metadata = {
  title: "Bungalows jardin",
  description:
    "Nos bungalows méditerranéens à 7 minutes à pied de la plage, jardin paisible, piscine privée pour la plupart.",
};

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommandé" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "capacity", label: "Capacité" },
  { value: "rating", label: "Mieux notés" },
];

export default async function BungalowsListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    guests?: string;
    pool?: string;
    seaView?: string;
    beachfront?: string;
    minPrice?: string;
    maxPrice?: string;
    checkIn?: string;
    checkOut?: string;
    amenities?: string;
    capacity?: string;
    sort?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const guestsParam = sp.guests ? Number(sp.guests) : undefined;
  const capacityParam = sp.capacity ? Number(sp.capacity) : undefined;
  const minCapacity =
    guestsParam && capacityParam
      ? Math.max(guestsParam, capacityParam)
      : (guestsParam ?? capacityParam);
  const hasPrivatePool = sp.pool === "1" ? true : undefined;
  const seaView = sp.seaView === "1" ? true : undefined;
  const beachfront =
    sp.beachfront === "1" ? true : sp.beachfront === "0" ? false : undefined;
  const minPriceMillimes = sp.minPrice ? Number(sp.minPrice) * 1000 : undefined;
  const maxPriceMillimes = sp.maxPrice ? Number(sp.maxPrice) * 1000 : undefined;
  const amenitySlugs = sp.amenities
    ? sp.amenities.split(",").filter(Boolean)
    : undefined;

  const [bungalows, filterableAmenities, priceRange] = await Promise.all([
    listPublicProperties("BUNGALOW", {
      minCapacity,
      hasPrivatePool,
      seaView,
      beachfront,
      minPriceMillimes,
      maxPriceMillimes,
      checkIn: sp.checkIn,
      checkOut: sp.checkOut,
      amenitySlugs,
    }),
    listFilterableAmenities(),
    getPropertyPriceRange("BUNGALOW"),
  ]);

  const priceMinTnd = Math.floor((priceRange?.min ?? 0) / 1000);
  const priceMaxTnd = Math.ceil((priceRange?.max ?? 1000_000) / 1000);

  const heroPhoto =
    bungalows.find((b) => b.photos.length > 0)?.photos[0] ?? null;
  const dateLabel =
    sp.checkIn && sp.checkOut
      ? `du ${sp.checkIn} au ${sp.checkOut}`
      : undefined;

  return (
    <main className="flex-1 bg-ivory text-foreground">
      <ListingPageHero
        photoUrl={heroPhoto?.url ?? null}
        photoAlt={heroPhoto?.alt ?? "Bungalows Diar Yasmine"}
        breadcrumb={[
          { href: "/", label: "Accueil" },
          { href: "/bungalows", label: "Les Bungalows" },
        ]}
        eyebrowScript="12 hébergements au cœur des jardins"
        title={
          <>
            Les Bungalows du <em className="heading-em-light">jardin</em>
          </>
        }
        lead="Bougainvilliers, pierre, bois exotique. La sérénité méditerranéenne, à 7 minutes à pied de la mer."
      />

      <FloatingFilterBar
        initialCheckIn={sp.checkIn}
        initialCheckOut={sp.checkOut}
        initialGuests={guestsParam}
        initialMaxPrice={sp.maxPrice ? Number(sp.maxPrice) : undefined}
        sortOptions={SORT_OPTIONS}
      />

      <section className="container-x section-y">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-12">
          <ListingSidebarFilters
            resultCount={bungalows.length}
            filterableAmenities={filterableAmenities}
            priceMinTnd={priceMinTnd}
            priceMaxTnd={priceMaxTnd}
          />

          <div>
            <ListingToolbar
              resultCount={bungalows.length}
              label={`bungalow${bungalows.length === 1 ? "" : "s"}`}
              dateLabel={dateLabel}
              sortOptions={SORT_OPTIONS}
              view="grid"
            />

            {bungalows.length === 0 ? (
              <ListingEmptyState
                title="Aucun bungalow ne correspond"
                body="Essayez d'élargir vos critères, ou explorez l'ensemble de nos hébergements."
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {bungalows.map((p, i) => (
                  <FadeIn
                    key={p.id}
                    delay={
                      i % 3 === 0
                        ? undefined
                        : i % 3 === 1
                          ? "delay-100"
                          : "delay-200"
                    }
                  >
                    <ListingCard property={p} />
                  </FadeIn>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
