import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

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

  return (
    <main className="flex-1 bg-ivory">
      <section className="bg-sand py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Notre histoire
          </p>
          <h1 className="mt-3 text-4xl font-medium text-foreground sm:text-5xl">
            Diar Yasmine
          </h1>
        </div>
      </section>

      <article className="mx-auto max-w-3xl space-y-6 px-4 py-16 text-base leading-relaxed text-foreground/85 sm:px-6">
        <p>
          Diar Yasmine, c&apos;est d&apos;abord un nom — celui d&apos;une fleur
          qui parfume les jardins de Tazarka tout l&apos;été. C&apos;est ensuite
          un lieu : 21 chalets et bungalows posés entre la plage et un jardin
          méditerranéen, au cœur du Cap Bon.
        </p>
        <p>
          Nous avons conçu nos hébergements comme nous aurions aimé en trouver :
          spacieux, ouverts sur l&apos;extérieur, avec piscine privée pour la
          plupart, et toujours pensés pour les familles. Les{" "}
          <strong>chalets</strong> offrent une vue mer directe et l&apos;accès à
          la plage en quelques pas ; les <strong>bungalows</strong> ouvrent sur
          un jardin paisible à 7 minutes à pied du sable.
        </p>
        <p>
          La réception est ouverte tous les jours. Nous parlons français, arabe,
          anglais. Nos équipes vivent à Tazarka et connaissent chaque recoin de
          la région — n&apos;hésitez pas à demander des conseils pour vos
          excursions, vos restaurants ou simplement une recette locale.
        </p>
        <p>
          Réservez en direct depuis ce site : c&apos;est plus rapide, moins cher
          pour vous, et nous permet de mieux préparer votre arrivée.
        </p>
      </article>
    </main>
  );
}
