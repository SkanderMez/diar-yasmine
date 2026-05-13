import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { listPublicProperties } from "@/lib/queries";
import { PropertyCard } from "@/components/public/property-card";
import { ListingFilters } from "@/components/public/listing-filters";
import { FadeIn } from "@/components/public/fade-in";

export const metadata: Metadata = {
  title: "Chalets bord de mer",
  description:
    "Nos 9 chalets en bord de mer à Tazarka, tous avec piscine privée et vue mer directe.",
};

export default async function ChaletsListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    guests?: string;
    pool?: string;
    seaView?: string;
    beachfront?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const minCapacity = sp.guests ? Number(sp.guests) : undefined;
  const hasPrivatePool = sp.pool === "1" ? true : undefined;
  const seaView = sp.seaView === "1" ? true : undefined;
  const beachfront = sp.beachfront === "1" ? true : undefined;
  const minPriceMillimes = sp.minPrice ? Number(sp.minPrice) * 1000 : undefined;
  const maxPriceMillimes = sp.maxPrice ? Number(sp.maxPrice) * 1000 : undefined;

  const chalets = await listPublicProperties("CHALET", {
    minCapacity,
    hasPrivatePool,
    seaView,
    beachfront,
    minPriceMillimes,
    maxPriceMillimes,
  });

  const heroPhoto = chalets[0]?.photos[0] ?? null;

  return (
    <main className="flex-1">
      {/* Hero — editorial photo + script eyebrow */}
      <section className="relative h-[60vh] min-h-[480px] w-full overflow-hidden">
        {heroPhoto && (
          <Image
            src={heroPhoto.url}
            alt={heroPhoto.alt ?? "Chalets Diar Yasmine"}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-charcoal/15 to-charcoal/70" />
        <div className="container-x relative flex h-full flex-col justify-end pb-16">
          <FadeIn className="space-y-4 text-ivory">
            <p className="font-script text-3xl text-honey sm:text-4xl">
              Pieds dans l&apos;eau
            </p>
            <h1 className="heading-display text-[clamp(3rem,9vw,7rem)] text-ivory">
              Chalets
            </h1>
            <p className="max-w-2xl text-ivory/85 sm:text-lg">
              9 chalets bois et verre, tous équipés d&apos;une piscine privée et
              offrant une vue mer directe. L&apos;intimité maximale, la plage à
              portée de pas.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Filter bar */}
      <ListingFilters resultCount={chalets.length} />

      {/* Grid */}
      <section className="bg-ivory">
        <div className="container-x section-y">
          {chalets.length === 0 ? (
            <FadeIn className="mx-auto max-w-2xl rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <h2 className="heading-display text-2xl text-foreground">
                Aucun chalet ne correspond
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Essayez d&apos;élargir vos critères. Notre équipe peut aussi
                trouver mieux : appelez-nous au{" "}
                <a
                  href="tel:+21698000000"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  +216 98 000 000
                </a>
                .
              </p>
            </FadeIn>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {chalets.map((p, i) => (
                <FadeIn
                  key={p.id}
                  delay={
                    i % 3 === 0
                      ? undefined
                      : i % 3 === 1
                        ? "delay-100"
                        : "delay-200"
                  }
                >
                  <PropertyCard property={p} />
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
