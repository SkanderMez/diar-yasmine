import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  getListingHeroPhoto,
  getPropertyPriceRange,
  listFilterableAmenities,
  listPublicProperties,
  type PublicPropertySort,
} from "@/lib/queries";
import { ListingPageHero } from "@/components/public/listings/listing-page-hero";
import { FloatingFilterBar } from "@/components/public/listings/floating-filter-bar";
import { ListingSidebarFilters } from "@/components/public/listings/listing-sidebar-filters";
import { ListingToolbar } from "@/components/public/listings/listing-toolbar";
import { ListingCard } from "@/components/public/listings/listing-card";
import { ListingEmptyState } from "@/components/public/listings/listing-empty-state";
import { FadeIn } from "@/components/public/fade-in";

export const metadata: Metadata = {
  title: "Tous les hébergements",
  description:
    "21 chalets et bungalows à Tazarka — disponibilités en temps réel.",
};

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommandé" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "capacity", label: "Capacité" },
];

const SORT_VALUES = new Set(SORT_OPTIONS.map((o) => o.value));

function parseSort(value: string | undefined): PublicPropertySort | undefined {
  if (!value || !SORT_VALUES.has(value)) return undefined;
  return value as PublicPropertySort;
}

/**
 * Unified search page — same sidebar layout as /chalets and /bungalows,
 * but queries both property types at once. Triggered from the home hero
 * BookingSearch when "Tous les hébergements" is picked.
 */
export default async function SearchPage({
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

  // null type → both chalets + bungalows in one query.
  const [properties, filterableAmenities, priceRange, heroPhoto] =
    await Promise.all([
      listPublicProperties(null, {
        minCapacity,
        hasPrivatePool,
        seaView,
        beachfront,
        minPriceMillimes,
        maxPriceMillimes,
        checkIn: sp.checkIn,
        checkOut: sp.checkOut,
        amenitySlugs,
        sort: parseSort(sp.sort),
      }),
      listFilterableAmenities(),
      getPropertyPriceRange(),
      getListingHeroPhoto("CHALET"),
    ]);

  const priceMinTnd = Math.floor((priceRange?.min ?? 0) / 1000);
  const priceMaxTnd = Math.ceil((priceRange?.max ?? 1000_000) / 1000);
  const dateLabel =
    sp.checkIn && sp.checkOut
      ? `du ${sp.checkIn} au ${sp.checkOut}`
      : undefined;

  return (
    <main className="flex-1 bg-ivory text-foreground">
      <ListingPageHero
        photoUrl={heroPhoto?.url ?? null}
        photoAlt={heroPhoto?.alt ?? "Diar Yasmine"}
        breadcrumb={[
          { href: "/", label: "Accueil" },
          { href: "/search", label: "Tous les hébergements" },
        ]}
        eyebrowScript="21 hébergements en bord de mer"
        title={
          <>
            Tous les <em className="heading-em-light">hébergements</em>
          </>
        }
        lead="Chalets bord de mer et bungalows jardin — filtrez par dates, voyageurs, équipements pour trouver votre refuge."
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
            resultCount={properties.length}
            filterableAmenities={filterableAmenities}
            priceMinTnd={priceMinTnd}
            priceMaxTnd={priceMaxTnd}
          />

          <div>
            <ListingToolbar
              resultCount={properties.length}
              label={`hébergement${properties.length === 1 ? "" : "s"}`}
              dateLabel={dateLabel}
              sortOptions={SORT_OPTIONS}
            />

            {properties.length === 0 ? (
              <ListingEmptyState
                title="Aucun hébergement ne correspond"
                body="Essayez d'élargir vos critères, ou contactez la réception."
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {properties.map((p, i) => (
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
