import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, Sparkles, Waves } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { listPublicProperties } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/public/property-card";
import { BookingSearch } from "@/components/public/booking-search";
import { FadeIn } from "@/components/public/fade-in";
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
    .slice(0, 3);
  const heroPhoto = chalets[0]?.photos[0] ?? null;
  const editorialPhoto = chalets[1]?.photos[0] ?? null;
  const chaletPreview = chalets[2]?.photos[0] ?? chalets[0]?.photos[0] ?? null;
  const bungalowPreview =
    bungalows.find((b) => b.photos.length > 0)?.photos[0] ?? null;

  return (
    <main className="flex-1">
      <HomeJsonLd />

      {/* ──────────── HERO ──────────── */}
      <section className="relative -mt-20 flex h-[100svh] min-h-[640px] w-full flex-col justify-end overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-transparent to-charcoal/70" />

        <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-32 sm:pb-24 lg:px-10 lg:pb-32">
          <div className="space-y-6 text-ivory">
            <FadeIn>
              <p className="font-script text-3xl text-primary-light sm:text-4xl">
                Tazarka Plage
              </p>
            </FadeIn>
            <FadeIn delay="delay-100">
              <h1 className="font-heading text-[clamp(3rem,11vw,9rem)] font-normal leading-[0.95] tracking-[-0.04em]">
                Diar Yasmine
              </h1>
            </FadeIn>
            <FadeIn delay="delay-200">
              <p className="max-w-xl text-base text-ivory/85 sm:text-lg">
                21 chalets et bungalows en bord de mer méditerranéenne. Piscines
                privées, jardins parfumés, ambiance familiale.
              </p>
            </FadeIn>
          </div>

          <FadeIn delay="delay-300" className="mt-10 sm:mt-14">
            <BookingSearch />
          </FadeIn>
        </div>
      </section>

      {/* ──────────── EDITORIAL INTRO ──────────── */}
      <section className="bg-ivory">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 sm:py-32 md:grid-cols-2 lg:gap-20 lg:px-10 lg:py-40">
          <FadeIn className="space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              Notre maison
            </p>
            <h2 className="font-heading text-4xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              Un bord de mer comme un secret de famille
            </h2>
            <p className="max-w-prose text-foreground/75">
              Diar Yasmine est née d&apos;une envie simple : offrir aux familles
              un coin de Méditerranée qu&apos;elles n&apos;auront pas envie de
              quitter. Pas un hôtel, pas une résidence — une vraie maison
              ouverte sur la plage et le jardin.
            </p>
            <p className="max-w-prose text-foreground/75">
              Vingt-et-un hébergements, tous différents, tous pensés pour le
              long séjour comme le week-end éclair. Réception bienveillante,
              piscines privées, et la mer à portée de pas.
            </p>
            <div className="pt-2">
              <Button asChild variant="outline" shape="pill" size="lg">
                <Link href="/about">
                  Découvrir notre histoire <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>

          {editorialPhoto && (
            <FadeIn
              offset="y-10"
              className="relative aspect-[4/5] overflow-hidden rounded-3xl"
            >
              <Image
                src={editorialPhoto.url}
                alt={editorialPhoto.alt ?? "Diar Yasmine"}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </FadeIn>
          )}
        </div>
      </section>

      {/* ──────────── TWO UNIVERSES ──────────── */}
      <section className="bg-sand">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-10 lg:py-40">
          <FadeIn className="mb-16 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              Deux univers
            </p>
            <h2 className="mt-3 font-heading text-4xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              Le bord de mer ou le jardin
            </h2>
          </FadeIn>

          <div className="grid gap-8 md:grid-cols-2 md:gap-10">
            <UniverseCard
              href="/chalets"
              eyebrow="Pieds dans l'eau"
              title="Chalets"
              description="9 chalets en bois et verre. Piscine privée. Vue mer directe."
              icon={<Waves className="size-4" />}
              imageUrl={chaletPreview?.url}
              imageAlt={chaletPreview?.alt ?? "Chalet"}
              count={chalets.length}
            />
            <UniverseCard
              href="/bungalows"
              eyebrow="Jardin parfumé"
              title="Bungalows"
              description="12 bungalows à 7 minutes à pied de la plage. Parfumés au jasmin."
              icon={<Sparkles className="size-4" />}
              imageUrl={bungalowPreview?.url}
              imageAlt={bungalowPreview?.alt ?? "Bungalow"}
              count={bungalows.length}
            />
          </div>
        </div>
      </section>

      {/* ──────────── SHOWCASE ──────────── */}
      {showcaseChalets.length > 0 && (
        <section className="bg-ivory">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-10 lg:py-40">
            <FadeIn className="mb-16 flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
                  Sélection
                </p>
                <h2 className="mt-3 font-heading text-4xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                  Quelques chalets, comme un avant-goût
                </h2>
              </div>
              <Button asChild variant="ghost" shape="pill" className="gap-2">
                <Link href="/chalets">
                  Voir les 9 chalets <ArrowRight className="size-4" />
                </Link>
              </Button>
            </FadeIn>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {showcaseChalets.map((p, i) => (
                <FadeIn
                  key={p.id}
                  delay={
                    i === 0 ? undefined : i === 1 ? "delay-100" : "delay-200"
                  }
                >
                  <PropertyCard property={p} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ──────────── PADEL TEASER ──────────── */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-10 px-6 py-20 sm:py-24 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <FadeIn className="max-w-xl space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary-light">
              À deux pas
            </p>
            <h2 className="font-heading text-4xl font-normal leading-[1.05] tracking-tight sm:text-5xl">
              Deux courts de padel
            </h2>
            <p className="text-primary-foreground/85">
              Padels Méditerranée — courts professionnels accessibles à pied
              depuis Diar Yasmine, vitrés sur les quatre côtés, éclairés pour
              les sessions du soir.
            </p>
          </FadeIn>
          <FadeIn delay="delay-100">
            <Button
              asChild
              variant="outline"
              shape="pill"
              size="lg"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:border-primary-foreground/50 hover:bg-primary-foreground/10"
            >
              <Link href="/padel">
                En savoir plus <ArrowRight className="size-4" />
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* ──────────── FINAL CTA ──────────── */}
      <section className="bg-ivory">
        <div className="mx-auto max-w-3xl px-6 py-32 text-center sm:py-40 lg:px-10">
          <FadeIn className="space-y-6">
            <p className="font-script text-3xl text-primary-light sm:text-4xl">
              Et vous, votre séjour ?
            </p>
            <h2 className="font-heading text-4xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Réservez en direct, plus simplement
            </h2>
            <p className="mx-auto max-w-xl text-foreground/75">
              Pas d&apos;intermédiaire, pas de commission. Notre équipe vous
              prépare l&apos;arrivée et reste joignable tout le séjour.
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
      className="group relative block aspect-[5/6] overflow-hidden rounded-3xl bg-sand md:aspect-[4/5]"
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
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-8 text-ivory sm:p-10">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-ivory/15 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] backdrop-blur-sm">
          {icon} {eyebrow}
        </span>
        <div className="flex items-baseline gap-3">
          <h3 className="font-heading text-5xl font-normal sm:text-6xl">
            {title}
          </h3>
          <span className="text-sm text-ivory/70">{count}</span>
        </div>
        <p className="max-w-sm text-sm text-ivory/85 sm:text-base">
          {description}
        </p>
        <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary-light">
          Découvrir
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
