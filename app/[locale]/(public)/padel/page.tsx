import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import {
  Briefcase,
  Car,
  Clock,
  Globe,
  Home,
  MapPin,
  Plane,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/public/fade-in";
import { listPublicProperties } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Expériences",
  description:
    "Padel, plage, jardins, services et alentours — toutes les expériences à vivre à Diar Yasmine Tazarka.",
};

type Service = {
  icon: React.ReactNode;
  title: string;
  body: string;
  price: string;
};

const SERVICES: ReadonlyArray<Service> = [
  {
    icon: <Home className="size-7" strokeWidth={1.5} />,
    title: "Ménage quotidien",
    body: "Service complet : ménage, changement de linge, réapprovisionnement des essentiels.",
    price: "80 TND / jour",
  },
  {
    icon: <UtensilsCrossed className="size-7" strokeWidth={1.5} />,
    title: "Room service",
    body: "Petit-déjeuner, déjeuner, dîner livré sur votre terrasse, 7h–23h.",
    price: "à la carte",
  },
  {
    icon: <Car className="size-7" strokeWidth={1.5} />,
    title: "Location de voiture",
    body: "Citadines, SUV, cabriolets. Livraison directe au domaine.",
    price: "à partir de 240 TND / jour",
  },
  {
    icon: <Clock className="size-7" strokeWidth={1.5} />,
    title: "Conciergerie 24h",
    body: "Réservations restaurant, taxi, médecin, baby-sitter — d'un coup de fil.",
    price: "inclus",
  },
  {
    icon: <Plane className="size-7" strokeWidth={1.5} />,
    title: "Transfert aéroport",
    body: "Aller-retour Tunis-Carthage, véhicule premium avec chauffeur privé.",
    price: "240 TND aller",
  },
  {
    icon: <Briefcase className="size-7" strokeWidth={1.5} />,
    title: "Excursions sur mesure",
    body: "Médina de Tunis, Carthage, Cap Bon, sortie en bateau privé, dégustations.",
    price: "sur demande",
  },
] as const;

type Poi = {
  name: string;
  distance: string;
  body: string;
  image: string;
};

const POIS: ReadonlyArray<Poi> = [
  {
    name: "Médina de Tunis",
    distance: "1h",
    body: "Capitale millénaire, souks et palais.",
    image:
      "https://images.unsplash.com/photo-1551641145-bca91d6e9bbe?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Sidi Bou Saïd",
    distance: "1h",
    body: "Bleu et blanc face à la baie.",
    image:
      "https://images.unsplash.com/photo-1592431913823-7af6b323da1f?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Hammamet",
    distance: "30 min",
    body: "Médina, plages, port.",
    image:
      "https://images.unsplash.com/photo-1583425426098-c4e58b6b6f43?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Korbous",
    distance: "35 min",
    body: "Sources thermales et calanques.",
    image:
      "https://images.unsplash.com/photo-1545569310-2c5ada3957a4?w=800&q=80&auto=format&fit=crop",
  },
] as const;

export default async function ExperiencesPage({
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
  const beachPhoto = chalets[0]?.photos[0] ?? null;
  const gardenPhoto = bungalows[0]?.photos[0] ?? null;

  return (
    <main className="flex-1 bg-ivory text-charcoal">
      {/* Light-bg hero */}
      <section className="bg-sand pt-24">
        <div className="container-x py-16 text-center sm:py-20">
          <FadeIn className="mx-auto max-w-3xl space-y-3">
            <p className="font-script text-2xl text-primary sm:text-3xl">
              Vivre Diar Yasmine
            </p>
            <h1 className="heading-display mx-auto max-w-3xl text-[clamp(2.25rem,5vw,3.75rem)] text-charcoal">
              Au-delà du séjour,{" "}
              <em className="heading-em">des expériences à vivre</em>
            </h1>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-charcoal-soft sm:text-lg">
              Sport, mer, sérénité. Tout est à 100 mètres. Tout est inclus. Tout
              vous attend.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Padel feature — olive dark band */}
      <section className="bg-ivory">
        <div className="container-x section-y">
          <FadeIn className="relative grid grid-cols-1 items-center gap-12 overflow-hidden rounded-2xl bg-olive p-8 text-ivory sm:p-12 lg:grid-cols-2 lg:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 size-[400px] rounded-full border-[80px] border-white/5"
            />

            {/* Court graphic */}
            <div className="relative order-2 lg:order-1">
              <div className="relative aspect-[5/4] overflow-hidden rounded-lg bg-gradient-to-b from-[#6a7d5c] to-[#4d5e3f] shadow-[var(--shadow-xl)]">
                <svg
                  viewBox="0 0 500 400"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden
                >
                  <rect
                    x="40"
                    y="40"
                    width="420"
                    height="320"
                    fill="none"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="3"
                  />
                  <line
                    x1="40"
                    y1="120"
                    x2="460"
                    y2="120"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                  />
                  <line
                    x1="40"
                    y1="280"
                    x2="460"
                    y2="280"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                  />
                  <line
                    x1="250"
                    y1="120"
                    x2="250"
                    y2="280"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                  />
                  <line
                    x1="40"
                    y1="200"
                    x2="460"
                    y2="200"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="3"
                    strokeDasharray="4,4"
                  />
                  <circle cx="350" cy="170" r="6" fill="#C9A85B" />
                  <circle
                    cx="150"
                    cy="140"
                    r="10"
                    fill="rgba(255,255,255,0.7)"
                  />
                  <circle
                    cx="350"
                    cy="250"
                    r="10"
                    fill="rgba(255,255,255,0.7)"
                  />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="relative order-1 lg:order-2">
              <p className="text-xs font-medium tracking-[0.2em] text-ivory/85 uppercase">
                Sport
              </p>
              <h2 className="heading-display mt-3 text-4xl text-ivory sm:text-5xl">
                Deux terrains de padel,{" "}
                <em
                  className="not-italic"
                  style={{
                    fontStyle: "italic",
                    color: "rgba(245,239,230,0.7)",
                    fontWeight: 400,
                  }}
                >
                  à votre porte
                </em>
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-ivory/85 sm:text-lg">
                Deux terrains intégrés au domaine, gazon synthétique de
                compétition, éclairage LED, vestiaires. Réservation directe à la
                conciergerie, ou en ligne via padelsmed.com.
              </p>

              {/* Stats row */}
              <dl className="mt-8 flex flex-wrap gap-8 border-t border-ivory/20 pt-6">
                <Stat label="Terrains" value="2" />
                <Stat label="/ heure" value="60 TND" />
                <Stat label="Dernier créneau" value="22h" />
              </dl>

              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  shape="pill"
                  className="bg-ivory text-olive hover:bg-white hover:text-olive"
                >
                  <a
                    href="https://padelsmed.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="size-4" />
                    Réserver un terrain
                  </a>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Editorial — Plage */}
      <section className="bg-ivory">
        <div className="container-x py-16 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <FadeIn className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
              {beachPhoto && (
                <Image
                  src={beachPhoto.url}
                  alt={beachPhoto.alt ?? "La plage de Tazarka"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
            </FadeIn>
            <FadeIn delay="delay-100">
              <p className="eyebrow">Mer & plage</p>
              <h2 className="heading-display mt-3 text-3xl text-charcoal sm:text-4xl">
                La plage <em className="heading-em">privée</em>
              </h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-charcoal-soft sm:text-[1.05rem]">
                <p>
                  La plage de Tazarka commence là où finit la terrasse des
                  chalets. Pour les bungalows, comptez sept minutes à pied, à
                  travers les bougainvilliers. Eau cristalline, fond sableux,
                  pente douce — idéal pour les enfants comme pour la nage en eau
                  libre.
                </p>
                <p>
                  Transats, parasols, paddleboard et matériel de snorkeling sont
                  à votre disposition, gratuitement. Le snack-bar de la plage
                  sert mezzés, salades et grillades de 11h à 19h.
                </p>
              </div>
              <dl className="mt-8 flex flex-wrap gap-8 border-t border-line-soft pt-6">
                <EditorialStat value="800 m" label="De plage" />
                <EditorialStat value="11h–19h" label="Snack-bar" />
                <EditorialStat value="Gratuit" label="Transats" />
              </dl>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Editorial — Jardins (reversed) */}
      <section className="bg-sand">
        <div className="container-x py-16 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <FadeIn className="order-2 lg:order-1">
              <p className="eyebrow">Nature</p>
              <h2 className="heading-display mt-3 text-3xl text-charcoal sm:text-4xl">
                Les <em className="heading-em">jardins</em>
              </h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-charcoal-soft sm:text-[1.05rem]">
                <p>
                  Bougainvilliers, lauriers-roses, oliviers centenaires, jasmin.
                  Le domaine s&apos;est construit autour des plantes — pas
                  l&apos;inverse. Vingt-cinq variétés méditerranéennes composent
                  un parc qui se promène autant qu&apos;il se contemple.
                </p>
                <p>
                  Notre jardinier fait visiter le domaine tous les jeudis matin,
                  à 10h. Il connaît chaque arbre par son prénom.
                </p>
              </div>
              <dl className="mt-8 flex flex-wrap gap-8 border-t border-line-soft pt-6">
                <EditorialStat value="3 ha" label="De jardin" />
                <EditorialStat value="25" label="Variétés" />
                <EditorialStat value="Jeudi 10h" label="Visite guidée" />
              </dl>
            </FadeIn>
            <FadeIn
              delay="delay-100"
              className="relative order-1 aspect-[4/5] overflow-hidden rounded-2xl bg-white lg:order-2"
            >
              {gardenPhoto && (
                <Image
                  src={gardenPhoto.url}
                  alt={gardenPhoto.alt ?? "Les jardins de Diar Yasmine"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-ivory">
        <div className="container-x section-y">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Services & conciergerie</p>
            <h2 className="heading-display mt-3 text-4xl text-charcoal sm:text-5xl">
              Services
            </h2>
            <p className="mt-4 text-base text-charcoal-soft sm:text-lg">
              Tout ce que vous n&apos;aurez pas à demander deux fois.
            </p>
          </FadeIn>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <FadeIn
                key={s.title}
                delay={
                  i === 0
                    ? undefined
                    : i === 1
                      ? "delay-75"
                      : i === 2
                        ? "delay-100"
                        : i === 3
                          ? "delay-150"
                          : i === 4
                            ? "delay-200"
                            : "delay-300"
                }
                className="rounded-lg border border-line-soft bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line hover:shadow-[var(--shadow-md)]"
              >
                <span className="mb-4 inline-flex size-12 items-center justify-center rounded-md bg-sand text-primary">
                  {s.icon}
                </span>
                <h3 className="font-heading text-lg text-charcoal">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-[0.92rem] leading-relaxed text-charcoal-soft">
                  {s.body}
                </p>
                <p className="mt-3 inline-block rounded-full bg-sand px-3 py-1 font-heading text-sm text-primary">
                  {s.price}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Aux alentours */}
      <section className="bg-sand">
        <div className="container-x section-y">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Aux alentours</p>
            <h2 className="heading-display mt-3 text-4xl text-charcoal sm:text-5xl">
              À découvrir <em className="heading-em">autour</em>
            </h2>
          </FadeIn>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {POIS.map((poi, i) => (
              <FadeIn
                key={poi.name}
                delay={
                  i === 0
                    ? undefined
                    : i === 1
                      ? "delay-75"
                      : i === 2
                        ? "delay-100"
                        : "delay-150"
                }
                className="overflow-hidden rounded-lg border border-line-soft bg-white"
              >
                <div className="aspect-[4/3] overflow-hidden bg-sand">
                  {/* Using plain <img> to avoid Next/Image domain restrictions */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={poi.image}
                    alt={poi.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <p className="flex items-center gap-1 text-[0.75rem] font-semibold tracking-[0.1em] text-bougainvillier uppercase">
                    <MapPin className="size-3" />
                    {poi.distance}
                  </p>
                  <h4 className="mt-1 font-heading text-lg text-charcoal">
                    {poi.name}
                  </h4>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {poi.body}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-heading text-3xl leading-none text-ivory">{value}</dd>
      <p className="mt-1 text-xs text-ivory/80">{label}</p>
    </div>
  );
}

function EditorialStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-sm">
      <dt className="sr-only">{label}</dt>
      <dd className="block font-heading text-2xl text-primary">{value}</dd>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
