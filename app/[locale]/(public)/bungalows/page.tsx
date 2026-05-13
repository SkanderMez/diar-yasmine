import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { listPublicProperties } from "@/lib/queries";
import { PropertyCard } from "@/components/public/property-card";
import { ListingFiltersSidebar } from "@/components/public/listing-filters-sidebar";
import { FadeIn } from "@/components/public/fade-in";

export const metadata: Metadata = {
  title: "Bungalows jardin",
  description:
    "Nos bungalows méditerranéens à 7 minutes à pied de la plage, jardin paisible, piscine privée pour la plupart.",
};

export default async function BungalowsListingPage({
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
    checkIn?: string;
    checkOut?: string;
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

  const bungalows = await listPublicProperties("BUNGALOW", {
    minCapacity,
    hasPrivatePool,
    seaView,
    beachfront,
    minPriceMillimes,
    maxPriceMillimes,
    checkIn: sp.checkIn,
    checkOut: sp.checkOut,
  });

  const heroPhoto =
    bungalows.find((b) => b.photos.length > 0)?.photos[0] ?? null;

  return (
    <main className="flex-1 bg-ivory text-foreground">
      <section className="relative h-[55vh] min-h-[420px] w-full overflow-hidden">
        {heroPhoto && (
          <Image
            src={heroPhoto.url}
            alt={heroPhoto.alt ?? "Bungalows Diar Yasmine"}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-charcoal/10 to-charcoal/70" />
        <div className="container-x relative flex h-full flex-col justify-end pb-14 text-ivory">
          <FadeIn className="space-y-3">
            <p className="font-script text-3xl text-clay-light sm:text-4xl">
              Jardin parfumé
            </p>
            <h1 className="heading-display text-[clamp(2.75rem,8vw,6.5rem)] text-ivory">
              Bungalows
            </h1>
            <p className="max-w-2xl text-ivory/85 sm:text-lg">
              Nos bungalows ouvrent sur un jardin paisible de jasmin et de
              bougainvillier, à 7 minutes à pied de la plage.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="container-x py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-12">
          <ListingFiltersSidebar resultCount={bungalows.length} />

          <div>
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl text-foreground sm:text-3xl">
                  {bungalows.length} bungalow{bungalows.length === 1 ? "" : "s"}{" "}
                  disponible{bungalows.length === 1 ? "" : "s"}
                </h2>
                {sp.checkIn && sp.checkOut && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Du {sp.checkIn} au {sp.checkOut} · disponibilité en temps
                    réel
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Trié par défaut
              </span>
            </div>

            {bungalows.length === 0 ? (
              <FadeIn className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <h3 className="font-heading text-2xl text-foreground">
                  Aucun bungalow ne correspond
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  Essayez d&apos;élargir vos critères, ou appelez la réception
                  au{" "}
                  <a
                    href="tel:+21698000000"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    +216 98 000 000
                  </a>
                  .
                </p>
              </FadeIn>
            ) : (
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {bungalows.map((p, i) => (
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
        </div>
      </section>
    </main>
  );
}
