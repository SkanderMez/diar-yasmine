import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { listPublicProperties } from "@/lib/queries";
import { BookingSearch } from "@/components/public/booking-search";
import { FadeIn } from "@/components/public/fade-in";
import { TwoWorlds } from "@/components/public/home/two-worlds";
import { AccommodationCarousel } from "@/components/public/home/accommodation-carousel";
import { StatsBanner } from "@/components/public/home/stats-banner";
import { HomeExperiences } from "@/components/public/home/home-experiences";
import { HomeTestimonials } from "@/components/public/home/home-testimonials";
import { LocationCard } from "@/components/public/home/location-card";
import { FinalCta } from "@/components/public/home/final-cta";
import { HomeJsonLd } from "@/components/public/json-ld";

/**
 * Public home — pixel-match of the maquette `home.html`.
 *
 * Section flow: Hero with booking widget → Two worlds split → Accommodation
 * carousel → Stats banner → Experiences asymmetric grid → Testimonials →
 * Location card → Final CTA strip.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [chalets, bungalows] = await Promise.all([
    listPublicProperties("CHALET"),
    listPublicProperties("BUNGALOW"),
  ]);

  /* Pick photos for the hero + the two-worlds split, falling back gracefully
   * when the seed data is partial. */
  const heroPhoto = chalets[0]?.photos[0] ?? null;
  const chaletPreview = chalets[1]?.photos[0] ?? chalets[0]?.photos[0] ?? null;
  const bungalowPreview =
    bungalows.find((b) => b.photos.length > 0)?.photos[0] ?? null;
  const finalCtaPhoto = chalets[2]?.photos[0]?.url ?? null;

  const carouselProperties = [...chalets, ...bungalows]
    .filter((p) => p.photos.length > 0)
    .slice(0, 8);

  return (
    <main className="flex-1">
      <HomeJsonLd />

      {/* HERO */}
      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-16 text-ivory">
        <div className="absolute inset-0 z-0">
          {heroPhoto && (
            <Image
              src={heroPhoto.url}
              alt={heroPhoto.alt ?? "Diar Yasmine Tazarka Plage"}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(14,90,107,0.25)] from-0% via-transparent via-30% to-[rgba(14,90,107,0.55)] to-100%" />
        </div>

        <div className="container-x relative z-10">
          <FadeIn>
            <p className="font-script text-2xl font-semibold text-turquoise-light sm:text-3xl">
              Tazarka Plage · Côte tunisienne
            </p>
            <h1 className="heading-display mt-2 max-w-4xl text-[clamp(3rem,7vw,6rem)] text-ivory">
              Un refuge entre{" "}
              <em className="not-italic font-normal text-turquoise-light italic">
                mer
              </em>{" "}
              et jardin
            </h1>
            <p className="mt-4 max-w-xl text-lg text-[rgba(250,247,242,0.92)]">
              21 logements d&apos;exception, deux univers, une même obsession :
              faire de vos vacances un souvenir suspendu.
            </p>
          </FadeIn>

          <FadeIn delay="delay-200" className="mt-10 max-w-4xl">
            <BookingSearch />
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ivory/75 md:flex">
          Découvrir
          <svg width="20" height="36" viewBox="0 0 20 36" fill="none">
            <rect
              x="0.5"
              y="0.5"
              width="19"
              height="35"
              rx="9.5"
              stroke="currentColor"
              strokeOpacity="0.5"
            />
            <rect x="9" y="7" width="2" height="6" rx="1" fill="currentColor">
              <animate
                attributeName="y"
                values="7;15;7"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;0.2;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </rect>
          </svg>
        </div>
      </section>

      {/* TWO WORLDS */}
      <TwoWorlds
        chaletsCount={chalets.length}
        bungalowsCount={bungalows.length}
        chaletPhoto={chaletPreview}
        bungalowPhoto={bungalowPreview}
      />

      {/* ACCOMMODATION CAROUSEL */}
      <section className="bg-ivory section-y">
        <AccommodationCarousel properties={carouselProperties} />
      </section>

      {/* STATS BANNER */}
      <StatsBanner
        stats={[
          { value: "21", label: "Hébergements" },
          { value: "7 min", label: "À pied de la plage" },
          { value: "2", label: "Terrains de padel" },
          { value: "4.9/5", label: "Note moyenne" },
        ]}
      />

      {/* EXPERIENCES */}
      <HomeExperiences
        experiences={[
          {
            eyebrow: "Mer & plage",
            title: "La plage privée",
            body: "Transats, parasols, paddle, snorkeling. Le sable fin de Tazarka commence où finit la terrasse.",
            imageUrl: chalets[3]?.photos[0]?.url ?? heroPhoto?.url ?? "",
          },
          {
            eyebrow: "Sport",
            title: "Padel",
            body: "Deux terrains, partenariat padelsmed.com.",
            imageUrl:
              "https://images.unsplash.com/photo-1632158284029-2c6938f3df00?w=1200&q=80",
          },
          {
            eyebrow: "Quotidien",
            title: "Services",
            body: "Ménage, conciergerie, room service, location de voitures.",
            imageUrl:
              bungalowPreview?.url ??
              chaletPreview?.url ??
              heroPhoto?.url ??
              "",
          },
        ]}
      />

      {/* TESTIMONIALS */}
      <HomeTestimonials
        items={[
          {
            initials: "SK",
            name: "Sarah Khlif",
            location: "Tunis",
            period: "Séjour juillet 2025",
            quote:
              "Une parenthèse rare. Le chalet Albatros, c'est la mer pour seul horizon — et un confort qui se fait oublier.",
          },
          {
            initials: "MD",
            name: "Marc Delaunay",
            location: "Paris",
            period: "Séjour septembre 2025",
            quote:
              "Le bungalow Bougainvillier nous a réconciliés avec la côte du Cap Bon. Discret, élégant, frais le soir.",
          },
          {
            initials: "LB",
            name: "Lina Ben Hadj",
            location: "Hammamet",
            period: "Séjour avril 2025",
            quote:
              "Le service padel + chalet, c'est l'option qu'on cherchait. Petits-déjeuners au bord de l'eau, terrain à 50m. Reviendrons.",
          },
        ]}
      />

      {/* LOCATION */}
      <LocationCard />

      {/* FINAL CTA */}
      <FinalCta photoUrl={finalCtaPhoto ?? undefined} />
    </main>
  );
}
