import { FadeIn } from "./fade-in";

const PRESS = [
  "Condé Nast Traveler",
  "Mr & Mrs Smith",
  "Plum Guide",
  "Boutique Hotels",
  "La Maison du Cap",
];

export function PressStrip() {
  return (
    <section className="bg-ivory">
      <div className="container-x py-16">
        <FadeIn className="mx-auto max-w-md text-center">
          <p className="eyebrow">Sélectionné par</p>
        </FadeIn>
        <FadeIn className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-foreground/40">
          {PRESS.map((name) => (
            <span
              key={name}
              className="font-heading text-xl italic tracking-tight transition-colors hover:text-foreground/70 sm:text-2xl"
            >
              {name}
            </span>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
