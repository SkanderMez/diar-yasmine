"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { FadeIn } from "./fade-in";

const TESTIMONIALS = [
  {
    quote:
      "Trois étés de suite. Les enfants connaissent chaque coin du jardin et l'équipe nous accueille comme une famille. Rare de trouver autant de simplicité élégante.",
    name: "Sarah & Khalil",
    origin: "Tunis · 3 séjours",
  },
  {
    quote:
      "Un coup de cœur immédiat. La piscine privée donne sur la mer, le silence est total, et le café du matin arrive sous notre véranda. On reviendra.",
    name: "Marie L.",
    origin: "Paris · juillet 2025",
  },
  {
    quote:
      "Diar Yasmine c'est l'antithèse du grand resort. On se sent chez nous, mais avec une équipe attentive en arrière-plan. Parfait pour décrocher.",
    name: "Hatem B.",
    origin: "Sfax · août 2025",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const t = TESTIMONIALS[index]!;

  function go(delta: number) {
    setIndex((i) => (i + delta + TESTIMONIALS.length) % TESTIMONIALS.length);
  }

  return (
    <section className="bg-deep text-ivory">
      <div className="container-x section-y-lg">
        <div className="mx-auto max-w-4xl">
          <FadeIn className="space-y-10 text-center">
            <Quote className="mx-auto size-8 text-clay-light" />
            <p className="font-heading text-3xl leading-[1.3] sm:text-5xl">
              {t.quote}
            </p>
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-clay-light">
                {t.name}
              </p>
              <p className="text-sm text-ivory/60">{t.origin}</p>
            </div>
          </FadeIn>

          <div className="mt-16 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => go(-1)}
              className="inline-flex size-12 items-center justify-center rounded-full border border-white/20 text-ivory transition-colors hover:border-clay-light hover:text-clay-light"
              aria-label="Témoignage précédent"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? "w-10 bg-clay-light"
                      : "w-1.5 bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Aller au témoignage ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              className="inline-flex size-12 items-center justify-center rounded-full border border-white/20 text-ivory transition-colors hover:border-clay-light hover:text-clay-light"
              aria-label="Témoignage suivant"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
