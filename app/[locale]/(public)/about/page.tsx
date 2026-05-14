import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listPublicProperties } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/public/fade-in";

export const metadata: Metadata = {
  title: "Notre histoire",
  description:
    "Diar Yasmine Tazarka — une histoire de famille devenue refuge collectif, 21 maisons posées entre la mer et le jardin.",
};

type TeamMember = {
  initial: string;
  name: string;
  role: string;
  bio: string;
  gradient: string;
};

const TEAM: ReadonlyArray<TeamMember> = [
  {
    initial: "A",
    name: "Amine Khlif",
    role: "Fondateur",
    bio: "Né à Tazarka, il a passé 20 ans entre Paris et Tunis avant de revenir construire ce qu'il aurait aimé trouver.",
    gradient: "from-primary to-turquoise",
  },
  {
    initial: "Y",
    name: "Yasmine Ben Ali",
    role: "Directrice de l'expérience",
    bio: "Architecte d'intérieur, elle a dessiné chaque maison en pensant aux familles qu'elle voudrait y accueillir.",
    gradient: "from-bougainvillier to-bougainvillier-light",
  },
  {
    initial: "K",
    name: "Karim Hadj",
    role: "Chef de cuisine",
    bio: "15 ans dans des hôtels 5 étoiles. À Diar Yasmine, il cuisine pour vous comme pour sa propre famille.",
    gradient: "from-olive to-olive-light",
  },
] as const;

type Value = {
  num: string;
  title: string;
  body: string;
};

const VALUES: ReadonlyArray<Value> = [
  {
    num: "01",
    title: "Le silence",
    body: "Pas de musique d'ascenseur. Pas de buffet bruyant. La musique, c'est le ressac. Tout est conçu pour que vous l'entendiez.",
  },
  {
    num: "02",
    title: "L'attention",
    body: "Les détails qu'on ne demande pas : un verre d'eau infusée à l'arrivée, le panier de bienvenue, les serviettes de plage chaque matin.",
  },
  {
    num: "03",
    title: "L'authentique",
    body: "Tout est local : la pierre, le bois, les artisans, les fournisseurs. Pas de chaîne, pas de standardisation. Tunisie partout.",
  },
] as const;

type TimelineEntry = {
  year: string;
  title: string;
  body: string;
};

const TIMELINE: ReadonlyArray<TimelineEntry> = [
  {
    year: "2019",
    title: "Les premiers chalets",
    body: "Albatros, Aquarius, Azur. Trois maisons posées sur le sable, en bois clair et verre. La photo de famille devant le portail un dimanche d'avril.",
  },
  {
    year: "2021",
    title: "L'expansion",
    body: "Corail, Dune, Flamand, Lagune, Marine, Océan rejoignent le bord de mer. Le domaine compte désormais 9 chalets pieds dans l'eau.",
  },
  {
    year: "2022",
    title: "Les bungalows du jardin",
    body: "De l'autre côté du chemin, 12 bungalows naissent au cœur du jardin. Bougainvillier, Lavande, Géranium, Néroli — chaque maison porte le nom de la plante qui l'entoure.",
  },
  {
    year: "2024",
    title: "Padel Méditerranée",
    body: "Deux terrains de padel professionnels ouvrent, partenariat avec padelsmed.com. Le domaine devient destination sport-mer.",
  },
  {
    year: "2026",
    title: "Aujourd'hui",
    body: "21 hébergements, 4.9/5 de moyenne, plus de 3 000 avis. Une équipe de 18 personnes. Mais toujours le même esprit : recevoir des amis qui n'en sont pas encore.",
  },
] as const;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const chalets = await listPublicProperties("CHALET");
  const heroPhoto = chalets[0]?.photos[0] ?? null;

  return (
    <main className="flex-1 bg-ivory text-charcoal">
      {/* Centered hero — script + h1 + lead */}
      <section className="pt-24">
        <div className="container-x pt-16 pb-10 text-center sm:pt-20 sm:pb-12">
          <FadeIn className="mx-auto max-w-3xl space-y-4">
            <p className="font-script text-2xl text-primary sm:text-3xl">
              Depuis 2019
            </p>
            <h1 className="heading-display mx-auto max-w-3xl text-[clamp(2.5rem,5vw,4rem)] text-charcoal">
              Une histoire de <em className="heading-em">famille</em>, deux pas
              dans <em className="heading-em">la mer</em>
            </h1>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-charcoal-soft">
              Diar Yasmine n&apos;a pas commencé comme un projet hôtelier.
              C&apos;est devenu, par hasard et par soin, un lieu où l&apos;on
              revient. Voici comment.
            </p>
          </FadeIn>
        </div>

        {/* Wide 21:9 photo */}
        <FadeIn delay="delay-100" className="container-x-wide">
          <div className="relative mx-auto aspect-[21/9] w-full overflow-hidden rounded-2xl bg-sand">
            {heroPhoto && (
              <Image
                src={heroPhoto.url}
                alt={heroPhoto.alt ?? "Diar Yasmine vue d'ensemble"}
                fill
                sizes="(max-width: 1440px) 100vw, 1440px"
                priority
                className="object-cover"
              />
            )}
          </div>
        </FadeIn>
      </section>

      {/* The story — centered narrow column */}
      <section className="section-y">
        <div className="container-x">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-6">L&apos;origine</p>
            <h2 className="heading-display mb-8 text-4xl text-charcoal sm:text-5xl">
              Un terrain familial, devenu{" "}
              <em className="heading-em">refuge collectif</em>
            </h2>
            <div className="space-y-5 text-left font-heading text-lg leading-[1.75] font-light text-charcoal-soft sm:text-xl">
              <p>
                Au départ, il y avait un terrain de quelques hectares à Tazarka,
                posé entre la route et la mer. Une maison, deux oliviers, et
                l&apos;idée qu&apos;un jour, peut-être, on y construirait
                quelque chose.
              </p>
              <p>
                Le « quelque chose » est arrivé en 2019 — d&apos;abord trois
                chalets, puis cinq, puis neuf. Et parce que tout le monde
                voulait revenir, les bungalows sont nés derrière, dans le
                jardin. Aujourd&apos;hui Diar Yasmine, ce sont 21 maisons, deux
                terrains de padel, et une équipe qui connaît la plupart des
                clients par leur prénom.
              </p>
              <p>
                Nous n&apos;avons jamais voulu construire un hôtel. Nous avons
                voulu construire un endroit où nos amis viendraient passer leurs
                vacances. C&apos;est ce qu&apos;on essaie de faire ressentir,
                chaque jour, à chacun de nos invités.
              </p>
            </div>
            <div className="divider-ornate">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M12 2C8 8 4 10 4 14a8 8 0 0016 0c0-4-4-6-8-12z" />
              </svg>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Values — 3 numerals */}
      <section className="bg-sand">
        <div className="container-x section-y">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Ce qui nous tient à cœur</p>
            <h2 className="heading-display mt-3 text-4xl text-charcoal sm:text-5xl">
              Trois principes,{" "}
              <em className="heading-em">jamais négociables</em>
            </h2>
          </FadeIn>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v, i) => (
              <FadeIn
                key={v.num}
                delay={
                  i === 0 ? undefined : i === 1 ? "delay-100" : "delay-200"
                }
                className="rounded-2xl bg-white p-8 shadow-[var(--shadow-xs)]"
              >
                <span className="font-script text-6xl leading-none font-light text-primary">
                  {v.num}
                </span>
                <h3 className="mt-4 font-heading text-2xl text-charcoal">
                  {v.title}
                </h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-charcoal-soft">
                  {v.body}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-y">
        <div className="container-x">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Notre parcours</p>
            <h2 className="heading-display mt-3 text-4xl text-charcoal sm:text-5xl">
              Sept ans, à <em className="heading-em">pas mesurés</em>
            </h2>
          </FadeIn>

          <div className="relative mx-auto mt-12 max-w-2xl pl-8">
            <div
              aria-hidden
              className="absolute top-2 bottom-2 left-2 w-px bg-line"
            />
            <ol className="space-y-12">
              {TIMELINE.map((entry, i) => (
                <FadeIn
                  as="li"
                  key={entry.year}
                  delay={
                    i === 0
                      ? undefined
                      : i === 1
                        ? "delay-75"
                        : i === 2
                          ? "delay-100"
                          : i === 3
                            ? "delay-150"
                            : "delay-200"
                  }
                  className="relative"
                >
                  <span
                    aria-hidden
                    className="absolute top-1 -left-[28px] block size-[17px] rounded-full border-4 border-ivory bg-turquoise"
                  />
                  <p className="font-heading text-2xl text-primary">
                    {entry.year}
                  </p>
                  <h3 className="mt-1 font-sans text-base font-semibold text-charcoal">
                    {entry.title}
                  </h3>
                  <p className="mt-1.5 max-w-xl text-[0.95rem] leading-relaxed text-charcoal-soft">
                    {entry.body}
                  </p>
                </FadeIn>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Team — 3 cards */}
      <section className="bg-sand">
        <div className="container-x section-y">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">L&apos;équipe</p>
            <h2 className="heading-display mt-3 text-4xl text-charcoal sm:text-5xl">
              Ceux qui rendent{" "}
              <em className="heading-em">tout cela possible</em>
            </h2>
          </FadeIn>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((m, i) => (
              <FadeIn
                key={m.name}
                delay={
                  i === 0 ? undefined : i === 1 ? "delay-100" : "delay-200"
                }
                className="text-center"
              >
                <div
                  className={`mx-auto flex aspect-square size-40 items-center justify-center rounded-full bg-gradient-to-br font-heading text-6xl font-light text-ivory ${m.gradient}`}
                  aria-hidden
                >
                  {m.initial}
                </div>
                <h3 className="mt-5 font-heading text-xl text-charcoal">
                  {m.name}
                </h3>
                <p className="mt-1 text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
                  {m.role}
                </p>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-charcoal-soft">
                  {m.bio}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Dark CTA */}
      <section className="bg-primary-900 text-ivory">
        <div className="container-x section-y text-center">
          <FadeIn className="mx-auto max-w-3xl space-y-6">
            <p className="font-script text-2xl text-turquoise-light sm:text-3xl">
              Le prochain chapitre
            </p>
            <h2 className="heading-display text-4xl text-ivory sm:text-5xl">
              À votre tour de venir{" "}
              <em
                className="not-italic"
                style={{
                  fontStyle: "italic",
                  color: "var(--color-turquoise-light)",
                  fontWeight: 400,
                }}
              >
                l&apos;écrire
              </em>
            </h2>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                asChild
                size="lg"
                shape="pill"
                className="bg-ivory text-primary-900 hover:bg-white hover:text-primary-900"
              >
                <Link href="/book">Réserver</Link>
              </Button>
              <Button
                asChild
                size="lg"
                shape="pill"
                variant="outline"
                className="border-ivory/60 bg-transparent text-ivory hover:border-ivory hover:bg-ivory/10 hover:text-ivory"
              >
                <Link href="/chalets">Découvrir nos hébergements</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
