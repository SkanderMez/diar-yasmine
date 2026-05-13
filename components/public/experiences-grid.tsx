import {
  ArrowUpRight,
  Bike,
  Coffee,
  Sunrise,
  UtensilsCrossed,
  Waves,
  Wine,
} from "lucide-react";
import { FadeIn } from "./fade-in";

const EXPERIENCES = [
  {
    icon: <Waves className="size-6" />,
    title: "Plage privée",
    description: "Transats, parasols, paddle. Sable doré à 30 secondes.",
  },
  {
    icon: <Bike className="size-6" />,
    title: "Padel & sport",
    description:
      "Deux courts pro à côté. Vélos disponibles pour explorer Cap Bon.",
  },
  {
    icon: <Sunrise className="size-6" />,
    title: "Lever de soleil",
    description: "Yoga & méditation matinaux organisés en haute saison.",
  },
  {
    icon: <UtensilsCrossed className="size-6" />,
    title: "Tables locales",
    description:
      "Notre concierge réserve dans les meilleurs restaurants de Korba & Nabeul.",
  },
  {
    icon: <Coffee className="size-6" />,
    title: "Petit-déjeuner",
    description: "Pâtisseries tunisiennes, fruits du jardin, miel de Cap Bon.",
  },
  {
    icon: <Wine className="size-6" />,
    title: "Caves & vignobles",
    description:
      "Tunisie produit des vins remarquables. Dégustations sur demande.",
  },
];

export function ExperiencesGrid() {
  return (
    <section className="bg-ivory">
      <div className="container-x section-y">
        <FadeIn className="mb-16 max-w-2xl">
          <p className="eyebrow">Expériences</p>
          <h2 className="mt-3 heading-display text-4xl text-foreground sm:text-5xl">
            Au-delà de votre porte
          </h2>
          <p className="mt-4 text-foreground/75">
            Le Cap Bon, c&apos;est une mer de jasmin, des plages préservées, une
            cuisine méditerranéenne riche, des vignobles plus anciens qu&apos;on
            ne croit. Nous vous aidons à en goûter le meilleur.
          </p>
        </FadeIn>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIENCES.map((x, i) => (
            <FadeIn
              key={x.title}
              delay={i < 3 ? undefined : "delay-100"}
              className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:border-honey/30 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-honey/15 text-honey">
                  {x.icon}
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-honey" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-2xl text-foreground">
                  {x.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/70">
                  {x.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
