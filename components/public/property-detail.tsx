import {
  Bath,
  Bed,
  ChevronRight,
  Clock,
  MapPin,
  Maximize,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type {
  PublicPropertyCard,
  PublicPropertyDetail,
  PublishedReview,
} from "@/lib/queries";
import { ListingCard } from "./listings/listing-card";
import { PropertyJsonLd } from "./json-ld";
import { PropertyGalleryMagazine } from "./property/property-gallery-magazine";
import { PropertyTabNav } from "./property/property-tab-nav";
import { PropertySpecsGrid } from "./property/property-specs-grid";
import { PropertyStoryCallout } from "./property/property-story-callout";
import { PropertyAmenitiesGrid } from "./property/property-amenities-grid";
import { PropertyMiniCalendar } from "./property/property-mini-calendar";
import { PropertyReviewsSummary } from "./property/property-reviews-summary";
import { PropertyRules } from "./property/property-rules";
import { PropertyBookingSticky } from "./property/property-booking-sticky";

interface PropertyDetailProps {
  property: PublicPropertyDetail;
  taxRate: number;
  similarProperties: PublicPropertyCard[];
  ratingSummary: { avg: number; count: number } | null;
  publishedReviews: PublishedReview[];
  /** Booked half-open windows fetched server-side. */
  unavailableRanges: { checkIn: string; checkOut: string }[];
}

const TAB_ITEMS = [
  { id: "description", label: "Description" },
  { id: "equipements", label: "Équipements" },
  { id: "disponibilites", label: "Disponibilités" },
  { id: "localisation", label: "Localisation" },
  { id: "avis", label: "Avis" },
  { id: "regles", label: "Règles" },
];

/**
 * Editorial property detail page — maquette `albatros.html`. Composes
 * the magazine gallery, sticky tab nav, scroll-spy sections (description,
 * equipements, disponibilites, localisation, avis, regles) and a sticky
 * booking widget on the right.
 */
function expandRangesToDays(
  ranges: { checkIn: string; checkOut: string }[],
): Date[] {
  const out: Date[] = [];
  for (const r of ranges) {
    let d = new Date(r.checkIn);
    const end = new Date(r.checkOut);
    while (d.getTime() < end.getTime()) {
      out.push(new Date(d));
      d = new Date(d.getTime() + 86400000);
    }
  }
  return out;
}

function avatarToneFor(index: number): "primary" | "bougainvillier" | "olive" {
  const tones: ("primary" | "bougainvillier" | "olive")[] = [
    "primary",
    "bougainvillier",
    "olive",
  ];
  return tones[index % tones.length]!;
}

function initialsFor(firstName: string | null | undefined): string {
  if (!firstName) return "V";
  const trimmed = firstName.trim();
  if (!trimmed) return "V";
  return trimmed.slice(0, 1).toUpperCase();
}

export function PropertyDetail({
  property,
  taxRate,
  similarProperties,
  ratingSummary,
  publishedReviews,
  unavailableRanges,
}: PropertyDetailProps) {
  const photos = property.photos.map((p) => ({ url: p.url, alt: p.alt }));
  const listingHref = property.type === "CHALET" ? "/chalets" : "/bungalows";
  const listingLabel =
    property.type === "CHALET" ? "Les Chalets" : "Les Bungalows";
  const typeLabel = property.type === "CHALET" ? "Chalet" : "Bungalow";
  const scriptLabel =
    property.type === "CHALET"
      ? "Chalet pieds dans l'eau"
      : "Bungalow au jardin";

  const specs = [
    {
      icon: <Maximize className="size-6" strokeWidth={1.5} />,
      value: property.sizeM2 ? `${property.sizeM2} m²` : "—",
      label: "Surface",
    },
    {
      icon: <Bed className="size-6" strokeWidth={1.5} />,
      value: String(property.bedrooms),
      label: property.bedrooms > 1 ? "Chambres" : "Chambre",
    },
    {
      icon: <Sparkles className="size-6" strokeWidth={1.5} />,
      value: String(property.capacity),
      label: "Voyageurs",
    },
    {
      icon: <Bath className="size-6" strokeWidth={1.5} />,
      value: String(property.bathrooms),
      label: property.bathrooms > 1 ? "Salles de bain" : "Salle de bain",
    },
  ];

  /* Build the amenities list — real ones from DB, with three "not
   * included" filler examples so the grid feels like the maquette. */
  const amenityItems = [
    ...property.amenities.map((pa) => ({
      label: pa.amenity.labelFr,
      included: true as const,
    })),
    { label: "Animaux acceptés", included: false as const },
    { label: "Parking privé", included: false as const },
    { label: "Service de chef", included: false as const },
  ];

  return (
    <main className="flex-1 bg-ivory pt-24 text-foreground">
      <PropertyJsonLd property={property} />

      {/* Title block */}
      <section className="container-x pt-8 pb-6">
        <nav className="mb-3 flex items-center gap-2 text-[0.85rem] text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Accueil
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href={listingHref} className="hover:text-primary">
            {listingLabel}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-charcoal">{property.name}</span>
        </nav>

        <p className="mb-2 font-script text-2xl text-primary">{scriptLabel}</p>
        <h1
          className="heading-display text-5xl text-charcoal sm:text-6xl"
          style={{ fontWeight: 300 }}
        >
          <em className="heading-em" style={{ fontStyle: "italic" }}>
            {property.name}
          </em>
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.95rem] text-charcoal-soft">
          {ratingSummary ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Star
                  className="size-4 text-gold"
                  fill="currentColor"
                  strokeWidth={0}
                />
                <strong className="font-semibold text-charcoal">
                  {ratingSummary.avg.toFixed(2)}
                </strong>
                <a href="#avis" className="text-charcoal underline">
                  {ratingSummary.count} avis
                </a>
              </span>
              <span className="text-muted-foreground">·</span>
            </>
          ) : null}
          {property.beachfront ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="size-4" />
                Coup de cœur
              </span>
              <span className="text-muted-foreground">·</span>
            </>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" />
            Tazarka Plage, Cap Bon
          </span>
        </div>
      </section>

      {/* Photo gallery */}
      <section className="container-x">
        <PropertyGalleryMagazine photos={photos} propertyName={property.name} />
      </section>

      {/* Sticky tab nav */}
      <PropertyTabNav items={TAB_ITEMS} />

      {/* Main grid */}
      <div className="container-x">
        <div
          className="grid gap-12 py-12 lg:grid-cols-[1.6fr_1fr]"
          style={{ alignItems: "start" }}
        >
          {/* LEFT column */}
          <div>
            {/* Description */}
            <section
              id="description"
              className="border-b border-line-soft py-8"
              style={{ scrollMarginTop: "140px" }}
            >
              <h2 className="font-heading text-[1.75rem] text-charcoal">
                Le {typeLabel.toLowerCase()}{" "}
                <em className="heading-em" style={{ fontStyle: "italic" }}>
                  {property.name}
                </em>
              </h2>
              <p className="mb-6 mt-2 text-[1.05rem] text-charcoal-soft">
                {typeLabel} · {property.capacity} voyageurs ·{" "}
                {property.bedrooms} chambre{property.bedrooms > 1 ? "s" : ""} ·{" "}
                {property.bathrooms} SDB
              </p>

              <PropertySpecsGrid items={specs} />

              <div className="mt-6 space-y-4 whitespace-pre-line text-charcoal-soft">
                {property.descriptionFr}
              </div>
            </section>

            {/* Story callout */}
            <div className="my-8">
              <PropertyStoryCallout
                title={`${property.name} — un refuge bord de mer`}
                body="Pensé comme un cocon où le temps ralentit. Bardage bois clair, lumière douce, terrasse face à la mer : ici, le seul effort est celui de respirer."
              />
            </div>

            {/* Amenities */}
            <section
              id="equipements"
              className="border-b border-line-soft py-8"
              style={{ scrollMarginTop: "140px" }}
            >
              <h2 className="font-heading text-[1.75rem] text-charcoal">
                Ce que propose{" "}
                <em className="heading-em" style={{ fontStyle: "italic" }}>
                  cet hébergement
                </em>
              </h2>
              <p className="mb-6 mt-2 text-[1.05rem] text-charcoal-soft">
                Tout est pensé pour que vous n&apos;ayez rien à penser.
              </p>
              <PropertyAmenitiesGrid items={amenityItems} />
            </section>

            {/* Availability */}
            <section
              id="disponibilites"
              className="border-b border-line-soft py-8"
              style={{ scrollMarginTop: "140px" }}
            >
              <h2 className="font-heading text-[1.75rem] text-charcoal">
                Disponibilités
              </h2>
              <p className="mb-6 mt-2 text-[1.05rem] text-charcoal-soft">
                Sélectionnez vos dates pour voir le tarif exact.
              </p>
              <PropertyMiniCalendar
                unavailableDays={expandRangesToDays(unavailableRanges)}
              />
              <p className="mt-6 text-sm text-muted-foreground">
                Min. {property.minStay} nuit{property.minStay > 1 ? "s" : ""} ·
                Annulation gratuite jusqu&apos;à 7 jours avant l&apos;arrivée.
              </p>
            </section>

            {/* Location */}
            <section
              id="localisation"
              className="border-b border-line-soft py-8"
              style={{ scrollMarginTop: "140px" }}
            >
              <h2 className="font-heading text-[1.75rem] text-charcoal">
                Où vous serez
              </h2>
              <p className="mb-6 mt-2 text-[1.05rem] text-charcoal-soft">
                Tazarka Plage, sur la côte est du Cap Bon. À 80 km de
                Tunis-Carthage, à 45 km de Hammamet.
              </p>
              <div
                className="relative h-[320px] overflow-hidden rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #b8d8d4 0%, #4FB8C4 50%, #0E5A6B 100%)",
                }}
              >
                <svg
                  aria-hidden
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 600 320"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 250 Q 100 230 200 240 T 400 220 T 600 210 L 600 320 L 0 320 Z"
                    fill="rgba(14,90,107,0.25)"
                  />
                  <path
                    d="M 0 200 Q 80 190 160 200 T 320 185 T 480 175 T 600 165"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={1}
                    strokeDasharray="4,6"
                  />
                </svg>
                <div
                  className="absolute size-6 rounded-full border-4 border-white"
                  style={{
                    top: "45%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "var(--color-bougainvillier)",
                    boxShadow: "0 0 0 12px rgba(196,78,122,0.25)",
                  }}
                />
                <div
                  className="absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-[0.85rem] font-medium text-primary shadow-md"
                  style={{ top: "calc(45% - 38px)", left: "50%" }}
                >
                  {property.name}
                </div>
              </div>
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Spot value="2 m" label="Plage" />
                <Spot value="200 m" label="Padel" />
                <Spot value="2 km" label="Centre village" />
                <Spot value="80 km" label="Aéroport" />
              </ul>
            </section>

            {/* Reviews */}
            <section
              id="avis"
              className="border-b border-line-soft py-8"
              style={{ scrollMarginTop: "140px" }}
            >
              {ratingSummary && publishedReviews.length > 0 ? (
                <>
                  <h2 className="flex items-center gap-2 font-heading text-[1.75rem] text-charcoal">
                    <Star
                      className="size-5 text-gold"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                    {ratingSummary.avg.toFixed(2)} ·{" "}
                    <em className="heading-em" style={{ fontStyle: "italic" }}>
                      {ratingSummary.count} avis
                    </em>
                  </h2>
                  <div className="mt-6">
                    <PropertyReviewsSummary
                      overallRating={ratingSummary.avg}
                      totalReviews={ratingSummary.count}
                      criteria={[]}
                      reviews={publishedReviews.map((r, i) => ({
                        author: r.guest?.firstName ?? "Voyageur",
                        initials: initialsFor(r.guest?.firstName),
                        date: r.publishedAt
                          ? new Date(r.publishedAt).toLocaleDateString(
                              "fr-FR",
                              {
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "",
                        rating: r.rating,
                        body: r.comment ?? "",
                        avatarTone: avatarToneFor(i),
                      }))}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-line-soft bg-sand/40 p-8 text-center">
                  <h2 className="font-heading text-[1.5rem] text-charcoal">
                    Pas encore d&apos;avis pour {property.name}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Soyez le premier à partager votre expérience après votre
                    séjour.
                  </p>
                </div>
              )}
            </section>

            {/* Rules */}
            <section
              id="regles"
              className="py-8"
              style={{ scrollMarginTop: "140px" }}
            >
              <h2 className="font-heading text-[1.75rem] text-charcoal">
                À savoir
              </h2>
              <div className="mt-6">
                <PropertyRules
                  sections={[
                    {
                      title: "Règlement intérieur",
                      icon: <Clock className="size-4" />,
                      items: [
                        "Arrivée : 15h – 22h",
                        "Départ avant 11h",
                        "Non-fumeur",
                        "Animaux sur demande",
                        "Fêtes interdites",
                      ],
                    },
                    {
                      title: "Sécurité",
                      icon: <ShieldCheck className="size-4" />,
                      items: [
                        "Détecteur de fumée",
                        "Extincteur",
                        "Trousse de premier secours",
                        "Serrure renforcée",
                      ],
                    },
                    {
                      title: "Annulation",
                      icon: <Sparkles className="size-4" />,
                      items: [
                        "Gratuite jusqu'à J-14",
                        "50 % entre J-14 et J-7",
                        "Non remboursable J-7 → arrivée",
                      ],
                    },
                  ]}
                />
              </div>
            </section>
          </div>

          {/* RIGHT column — sticky booking */}
          <aside>
            <PropertyBookingSticky
              propertyId={property.id}
              propertySlug={property.slug}
              basePrice={property.basePrice}
              cleaningFee={property.cleaningFee}
              capacity={property.capacity}
              taxRate={taxRate}
              rating={
                ratingSummary
                  ? { score: ratingSummary.avg, count: ratingSummary.count }
                  : null
              }
              unavailableRanges={unavailableRanges}
            />
          </aside>
        </div>
      </div>

      {/* Similar properties */}
      {similarProperties.length > 0 && (
        <section className="bg-sand">
          <div className="container-x section-y">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-[680px]">
                <p className="eyebrow">Vous aimerez aussi</p>
                <h2 className="heading-display mt-3 text-4xl text-charcoal sm:text-5xl">
                  Hébergements similaires
                </h2>
              </div>
              <Link
                href={listingHref}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Voir tout →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {similarProperties.map((p) => (
                <ListingCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function Spot({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded-md bg-sand p-4">
      <div className="font-heading text-2xl text-primary">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </li>
  );
}
