import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { listPublicProperties } from "@/lib/queries";
import { PropertyCard } from "@/components/public/property-card";

export const metadata: Metadata = {
  title: "Chalets",
  description:
    "Nos 9 chalets en bord de mer à Tazarka, tous avec piscine privée et vue mer directe.",
};

export default async function ChaletsListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const chalets = await listPublicProperties("CHALET");

  return (
    <main className="flex-1">
      <section className="bg-sand py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">
            Pieds dans l&apos;eau
          </p>
          <h1 className="mt-3 text-4xl font-medium text-foreground sm:text-5xl">
            Chalets
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Nos 9 chalets bois et verre, tous équipés d&apos;une piscine privée
            et offrant une vue mer directe. Idéaux pour les couples et les
            familles cherchant l&apos;intimité avec la plage à portée de pas.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {chalets.length === 0 ? (
          <p className="text-muted-foreground">Aucun chalet disponible.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {chalets.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
