import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { listPublicProperties } from "@/lib/queries";
import { PropertyCard } from "@/components/public/property-card";

export const metadata: Metadata = {
  title: "Bungalows",
  description:
    "Nos bungalows méditerranéens à 7 minutes à pied de la plage, jardin paisible, piscine privée pour la plupart.",
};

export default async function BungalowsListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const bungalows = await listPublicProperties("BUNGALOW");

  return (
    <main className="flex-1">
      <section className="bg-sand py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            Jardin méditerranéen
          </p>
          <h1 className="mt-3 text-4xl font-medium text-foreground sm:text-5xl">
            Bungalows
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Nos bungalows ouvrent sur un jardin paisible, à 7 minutes à pied de
            la plage. La plupart disposent d&apos;une piscine privée. Parfaits
            pour les courts comme les longs séjours.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {bungalows.length === 0 ? (
          <p className="text-muted-foreground">Aucun bungalow disponible.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bungalows.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
