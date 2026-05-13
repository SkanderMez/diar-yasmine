import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, Heart, Home, Leaf, MapPin, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { listPublicProperties } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/public/fade-in";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "L'histoire de Diar Yasmine Tazarka Plage — 21 chalets et bungalows familiaux en bord de mer méditerranéenne.",
};

export default async function AboutPage({
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
  const heroPhoto = chalets[0]?.photos[0] ?? null;
  const editorialA = chalets[1]?.photos[0] ?? null;
  const editorialB = bungalows[0]?.photos[0] ?? null;
  const teamPhoto = chalets[2]?.photos[0] ?? null;

  return (
    <main className="flex-1 bg-ivory text-foreground">
      {/* Editorial hero */}
      <section className="relative h-[60vh] min-h-[480px] w-full overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 via-charcoal/15 to-charcoal/70" />
        <div className="container-x relative flex h-full flex-col justify-end pb-16 text-ivory">
          <FadeIn className="max-w-3xl space-y-4">
            <p className="font-script text-3xl text-clay-light sm:text-4xl">
              Notre histoire
            </p>
            <h1 className="heading-display text-[clamp(2.75rem,9vw,7rem)] text-ivory">
              Une maison ouverte
              <br />
              sur la Méditerranée
            </h1>
          </FadeIn>
        </div>
      </section>

      {/* Manifesto */}
      <section className="container-x section-y">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
          <FadeIn className="space-y-6 lg:col-span-7">
            <p className="eyebrow">Diar Yasmine</p>
            <h2 className="heading-display text-4xl text-foreground sm:text-5xl">
              Un nom de fleur,
              <br />
              un coin de Tazarka.
            </h2>
            <div className="space-y-5 text-foreground/75 sm:text-lg">
              <p>
                Diar Yasmine, c&apos;est d&apos;abord un parfum — celui du
                jasmin qui s&apos;ouvre les soirs d&apos;été dans les jardins
                tunisiens. C&apos;est ensuite un lieu : 21 chalets et bungalows
                posés entre la plage et un jardin méditerranéen, au cœur du Cap
                Bon.
              </p>
              <p>
                Nous avons conçu nos hébergements comme nous aurions aimé en
                trouver : spacieux, ouverts sur l&apos;extérieur, avec piscine
                privée pour la plupart, et toujours pensés pour les familles et
                les longs séjours.
              </p>
              <p>
                Les{" "}
                <strong className="font-medium text-foreground">
                  9 chalets
                </strong>{" "}
                offrent une vue mer directe et l&apos;accès à la plage en
                quelques pas. Les{" "}
                <strong className="font-medium text-foreground">
                  12 bungalows
                </strong>{" "}
                ouvrent sur un jardin paisible à 7 minutes à pied du sable.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay="delay-100" className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-4">
              {editorialA && (
                <div className="relative aspect-[3/4] overflow-hidden rounded-3xl">
                  <Image
                    src={editorialA.url}
                    alt={editorialA.alt ?? ""}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              )}
              {editorialB && (
                <div className="relative mt-10 aspect-[3/4] overflow-hidden rounded-3xl">
                  <Image
                    src={editorialB.url}
                    alt={editorialB.alt ?? ""}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-bone">
        <div className="container-x section-y">
          <FadeIn className="max-w-2xl">
            <p className="eyebrow">Notre approche</p>
            <h2 className="mt-3 heading-display text-4xl text-foreground sm:text-5xl">
              Quatre principes simples
            </h2>
          </FadeIn>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-border sm:grid-cols-2 lg:grid-cols-4">
            <Principle
              icon={<Home className="size-5" />}
              title="Une vraie maison"
              body="Pas un hôtel, pas une résidence. Des espaces ouverts, équipés, pensés pour vivre vraiment chez soi."
            />
            <Principle
              icon={<Leaf className="size-5" />}
              title="Jardin et mer"
              body="21 hébergements posés entre un jardin de jasmin et la plage. Pas de bétonnage, pas de promiscuité."
            />
            <Principle
              icon={<Heart className="size-5" />}
              title="Accueil sincère"
              body="Notre équipe vit à Tazarka. Elle parle français, arabe, anglais. Elle connaît chaque restaurant du Cap Bon."
            />
            <Principle
              icon={<Star className="size-5" />}
              title="Réservation directe"
              body="Pas d'intermédiaire, pas de commission cachée. Un prix juste pour un service direct."
            />
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="container-x section-y">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <FadeIn className="space-y-6">
            <p className="eyebrow">Chiffres</p>
            <h2 className="heading-display text-4xl text-foreground sm:text-5xl">
              Trois saisons d&apos;été,
              <br />
              une communauté fidèle.
            </h2>
            <div className="grid grid-cols-2 gap-y-8 pt-4">
              <Stat value="21" label="hébergements" />
              <Stat value="137" label="séjours en 2025" />
              <Stat value="4.9 / 5" label="note moyenne" />
              <Stat value="72%" label="clients fidèles" />
            </div>
          </FadeIn>
          {teamPhoto && (
            <FadeIn
              delay="delay-100"
              className="relative aspect-[4/5] overflow-hidden rounded-3xl"
            >
              <Image
                src={teamPhoto.url}
                alt={teamPhoto.alt ?? "Équipe Diar Yasmine"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </FadeIn>
          )}
        </div>
      </section>

      {/* Location strip */}
      <section className="bg-deep text-ivory">
        <div className="container-x section-y">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <FadeIn className="lg:col-span-7">
              <p className="font-script text-3xl text-clay-light">Cap Bon</p>
              <h2 className="mt-3 heading-display text-4xl sm:text-6xl">
                À 1 heure de Tunis,
                <br />à 5 minutes de la mer.
              </h2>
              <p className="mt-5 max-w-xl text-ivory/80">
                Tazarka est un village du Cap Bon, entre Korba et Nabeul. Plages
                préservées, vignobles, oliveraies. La région produit le jasmin,
                l&apos;harissa, le vin gris. Pour beaucoup, c&apos;est le coin
                préféré de Tunisie.
              </p>
            </FadeIn>
            <FadeIn
              delay="delay-100"
              className="space-y-3 lg:col-span-5 lg:text-right"
            >
              <Spot label="Aéroport Tunis-Carthage" value="1 h 10" />
              <Spot label="Hammamet centre" value="30 min" />
              <Spot label="Plage la plus proche" value="30 sec" />
              <Spot label="Padels Méditerranée" value="à pied" />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x section-y text-center">
        <FadeIn className="mx-auto max-w-3xl space-y-6">
          <p className="font-script text-3xl text-clay">Et vous ?</p>
          <h2 className="heading-display text-4xl text-foreground sm:text-6xl">
            Et si vous veniez l&apos;essayer ?
          </h2>
          <p className="mx-auto max-w-xl text-foreground/75">
            Nos disponibilités, nos tarifs en temps réel — réservez en direct,
            sans intermédiaire, et préparez votre arrivée avec notre équipe.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button asChild size="lg" shape="pill" className="gap-2">
              <Link href="/chalets">
                Voir les chalets <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" shape="pill">
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}

function Principle({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-3 bg-card p-8">
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="font-heading text-xl text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-foreground/70">{body}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="space-y-1">
      <p className="font-heading text-4xl text-foreground sm:text-5xl">
        {value}
      </p>
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function Spot({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/15 py-3 lg:justify-end">
      <span className="text-sm text-ivory/70">
        <MapPin className="mr-1.5 inline size-3" />
        {label}
      </span>
      <span className="font-heading text-xl text-ivory">{value}</span>
    </div>
  );
}
