import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
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
  title: "Chalets bord de mer",
  description:
    "Nos 9 chalets en bord de mer à Tazarka, tous avec piscine privée et vue mer directe.",
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

export default async function ChaletsListingPage({
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

  const [chalets, filterableAmenities, priceRange] = await Promise.all([
    listPublicProperties("CHALET", {
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
    getPropertyPriceRange("CHALET"),
  ]);

  // Fallback bounds when the catalog is empty (shouldn't happen in prod
  // since the seed always has properties, but keep the filter sensible).
  const priceMinTnd = Math.floor((priceRange?.min ?? 0) / 1000);
  const priceMaxTnd = Math.ceil((priceRange?.max ?? 1000_000) / 1000);

  const heroPhoto = chalets[0]?.photos[0] ?? null;
  const dateLabel =
    sp.checkIn && sp.checkOut
      ? `du ${sp.checkIn} au ${sp.checkOut}`
      : undefined;

  return (
    <main className="flex-1 bg-ivory text-foreground">
      <ListingPageHero
        photoUrl={heroPhoto?.url ?? null}
        photoAlt={heroPhoto?.alt ?? "Chalets Diar Yasmine"}
        breadcrumb={[
          { href: "/", label: "Accueil" },
          { href: "/chalets", label: "Les Chalets" },
        ]}
        eyebrowScript="9 hébergements pieds dans l'eau"
        title={
          <>
            Les Chalets de la <em className="heading-em-light">Méditerranée</em>
          </>
        }
        lead="Bois, verre, piscines privées. Pour ceux qui veulent que le ressac fasse partie du séjour."
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
            resultCount={chalets.length}
            filterableAmenities={filterableAmenities}
            priceMinTnd={priceMinTnd}
            priceMaxTnd={priceMaxTnd}
          />

          <div>
            <ListingToolbar
              resultCount={chalets.length}
              label={`chalet${chalets.length === 1 ? "" : "s"}`}
              dateLabel={dateLabel}
              sortOptions={SORT_OPTIONS}
            />

            {chalets.length === 0 ? (
              <ListingEmptyState
                title="Aucun chalet ne correspond"
                body="Essayez d'élargir vos critères, ou explorez l'ensemble de nos hébergements."
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {chalets.map((p, i) => (
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
