import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, Sparkles, Star, Waves } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { listPublicProperties } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/public/property-card";
import { BookingSearch } from "@/components/public/booking-search";
import { FadeIn } from "@/components/public/fade-in";
import { StatsStrip } from "@/components/public/stats-strip";
import { ExperiencesGrid } from "@/components/public/experiences-grid";
import { Testimonials } from "@/components/public/testimonials";
import { MapPreview } from "@/components/public/map-preview";
import { PressStrip } from "@/components/public/press-strip";
import { HomeJsonLd } from "@/components/public/json-ld";

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

  const showcaseChalets = chalets
    .filter((c) => c.photos.length > 0)
    .slice(0, 6);
  const heroPhoto = chalets[0]?.photos[0] ?? null;
  const editorialPhoto = chalets[1]?.photos[0] ?? null;
  const editorialPhoto2 =
    chalets[2]?.photos[1] ?? chalets[2]?.photos[0] ?? null;
  const chaletPreview = chalets[3]?.photos[0] ?? chalets[0]?.photos[0] ?? null;
  const bungalowPreview =
    bungalows.find((b) => b.photos.length > 0)?.photos[0] ?? null;
  const padelBg = chalets[4]?.photos[0] ?? null;

  return (
    <main className="flex-1">
      <HomeJsonLd />

      {/* HERO */}
      <section className="relative flex h-[100svh] min-h-[680px] w-full flex-col justify-end overflow-hidden">
        {heroPhoto && (
          <Image
            src={heroPhoto.url}
            alt={heroPhoto.alt ?? "Diar Yasmine"}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 via-charcoal/10 to-charcoal/80" />

        <div className="container-x relative pb-16 pt-44 sm:pb-24 lg:pb-32">
          <div className="space-y-5 text-ivory">
            <FadeIn>
              <p className="font-script text-3xl text-clay-light sm:text-4xl">
                Tazarka Plage · Cap Bon
              </p>
            </FadeIn>
            <FadeIn delay="delay-100">
              <h1 className="heading-display text-[clamp(3.5rem,12vw,10rem)] text-ivory">
                Diar Yasmine
              </h1>
            </FadeIn>
            <FadeIn delay="delay-200">
              <p className="max-w-2xl text-base text-ivory/85 sm:text-xl">
                21 chalets et bungalows familiaux, à deux pas de la
                Méditerranée. Piscines privées, jardins parfumés, réception
                bienveillante. Réservez en direct.
              </p>
            </FadeIn>
          </div>

          <FadeIn delay="delay-300" className="mt-12">
            <BookingSearch />
          </FadeIn>

          <FadeIn
            delay="delay-300"
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ivory/80"
          >
            <span className="flex items-center gap-2">
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5 fill-clay-light text-clay-light"
                  />
                ))}
              </span>
              4.9 / 5 · 137 séjours en 2025
            </span>
            <span className="hidden sm:inline">·</span>
            <span>Réservation directe, sans commission</span>
            <span className="hidden sm:inline">·</span>
            <span>Réception 7j/7</span>
          </FadeIn>
        </div>

        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.3em] text-ivory/60 md:flex">
          <span>Découvrir</span>
          <span className="h-10 w-px bg-ivory/30" />
        </div>
      </section>

      {/* STATS */}
      <StatsStrip />

      {/* EDITORIAL */}
      <section className="bg-ivory">
        <div className="container-x section-y-lg">
          <div className="grid items-center gap-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <FadeIn className="space-y-6">
                <p className="eyebrow">Notre maison</p>
                <h2 className="heading-display text-4xl text-foreground sm:text-5xl">
                  Un bord de mer comme un secret de famille
                </h2>
                <p className="text-foreground/75">
                  Diar Yasmine est née d&apos;une envie simple : offrir aux
                  familles un coin de Méditerranée qu&apos;elles n&apos;auront
                  pas envie de quitter. Pas un hôtel, pas une résidence — une
                  vraie maison ouverte sur la plage et le jardin.
                </p>
                <p className="text-foreground/75">
                  Vingt-et-un hébergements, tous différents, tous pensés pour le
                  long séjour comme le week-end éclair.
                </p>
                <div className="pt-2">
                  <Button asChild variant="outline" shape="pill" size="lg">
                    <Link href="/about">
                      Découvrir notre histoire <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </FadeIn>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {editorialPhoto && (
                  <FadeIn className="relative aspect-[3/4] overflow-hidden rounded-3xl">
                    <Image
                      src={editorialPhoto.url}
                      alt={editorialPhoto.alt ?? "Diar Yasmine"}
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </FadeIn>
                )}
                {editorialPhoto2 && (
                  <FadeIn
                    delay="delay-200"
                    className="relative mt-12 aspect-[3/4] overflow-hidden rounded-3xl"
                  >
                    <Image
                      src={editorialPhoto2.url}
                      alt={editorialPhoto2.alt ?? "Diar Yasmine"}
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </FadeIn>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TWO UNIVERSES */}
      <section className="bg-sand">
        <div className="container-x section-y">
          <FadeIn className="mb-14 max-w-2xl">
            <p className="eyebrow">Deux univers</p>
            <h2 className="mt-3 heading-display text-4xl text-foreground sm:text-5xl">
              Le bord de mer ou le jardin
            </h2>
          </FadeIn>

          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <UniverseCard
              href="/chalets"
              eyebrow="Pieds dans l'eau"
              title="Chalets"
              description="9 chalets bois et verre, piscine privée, vue mer directe."
              icon={<Waves className="size-4" />}
              imageUrl={chaletPreview?.url}
              imageAlt={chaletPreview?.alt ?? "Chalet"}
              count={chalets.length}
            />
            <UniverseCard
              href="/bungalows"
              eyebrow="Jardin parfumé"
              title="Bungalows"
              description="12 bungalows à 7 minutes de la plage, jasmin et bougainvillier."
              icon={<Sparkles className="size-4" />}
              imageUrl={bungalowPreview?.url}
              imageAlt={bungalowPreview?.alt ?? "Bungalow"}
              count={bungalows.length}
            />
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      {showcaseChalets.length > 0 && (
        <section className="bg-ivory">
          <div className="container-x section-y">
            <FadeIn className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="eyebrow">Sélection de chalets</p>
                <h2 className="mt-3 heading-display text-4xl text-foreground sm:text-5xl">
                  Comme un avant-goût
                </h2>
              </div>
              <Button asChild variant="ghost" shape="pill" className="gap-2">
                <Link href="/chalets">
                  Voir les {chalets.length} chalets{" "}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </FadeIn>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {showcaseChalets.slice(0, 6).map((p, i) => (
                <FadeIn
                  key={p.id}
                  delay={
                    i === 0
                      ? undefined
                      : i === 1
                        ? "delay-100"
                        : i === 2
                          ? "delay-200"
                          : "delay-300"
                  }
                >
                  <PropertyCard property={p} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EXPERIENCES */}
      <ExperiencesGrid />

      {/* PADEL */}
      <section className="relative overflow-hidden bg-deep">
        {padelBg && (
          <Image
            src={padelBg.url}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-deep via-deep/70 to-deep/40" />
        <div className="container-x relative section-y text-ivory">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <FadeIn className="lg:col-span-7">
              <p className="font-script text-3xl text-clay-light">À deux pas</p>
              <h2 className="mt-3 heading-display text-4xl text-ivory sm:text-6xl">
                Deux courts de padel
              </h2>
              <p className="mt-5 max-w-xl text-ivory/85">
                Padels Méditerranée — courts professionnels accessibles à pied
                depuis Diar Yasmine, vitrés sur les quatre côtés, éclairés pour
                les sessions du soir.
              </p>
            </FadeIn>
            <FadeIn delay="delay-100" className="lg:col-span-5 lg:text-right">
              <Button
                asChild
                shape="pill"
                size="lg"
                className="gap-2 bg-ivory text-charcoal hover:bg-white"
              >
                <Link href="/padel">
                  Découvrir le padel <ArrowRight className="size-4" />
                </Link>
              </Button>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* MAP */}
      <MapPreview />

      {/* PRESS */}
      <PressStrip />

      {/* FINAL CTA */}
      <section className="bg-bone">
        <div className="container-x section-y text-center">
          <FadeIn className="mx-auto max-w-3xl space-y-6">
            <p className="font-script text-3xl text-clay sm:text-4xl">
              Et vous, votre séjour ?
            </p>
            <h2 className="heading-display text-4xl text-foreground sm:text-6xl">
              Réservez en direct, plus simplement
            </h2>
            <p className="mx-auto max-w-xl text-foreground/75">
              Pas d&apos;intermédiaire, pas de commission. Notre équipe vous
              prépare l&apos;arrivée et reste joignable pendant tout le séjour.
            </p>
            <div className="pt-4">
              <Button asChild size="xl" shape="pill" className="gap-2">
                <Link href="/book">
                  Réserver maintenant <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}

function UniverseCard({
  href,
  eyebrow,
  title,
  description,
  icon,
  imageUrl,
  imageAlt,
  count,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  imageUrl?: string;
  imageAlt: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[5/6] overflow-hidden rounded-3xl bg-charcoal md:aspect-[4/5]"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/40 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-8 text-ivory sm:p-10">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-ivory/15 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] backdrop-blur-sm">
          {icon} {eyebrow}
        </span>
        <div className="flex items-baseline gap-3">
          <h3 className="heading-display text-5xl sm:text-7xl">{title}</h3>
          <span className="text-sm text-ivory/70">{count}</span>
        </div>
        <p className="max-w-sm text-sm text-ivory/85 sm:text-base">
          {description}
        </p>
        <span className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-clay-light">
          Découvrir
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
