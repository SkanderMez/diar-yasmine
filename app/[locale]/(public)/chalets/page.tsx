import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { listPublicProperties } from "@/lib/queries";
import { PropertyCard } from "@/components/public/property-card";
import { ListingFiltersSidebar } from "@/components/public/listing-filters-sidebar";
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
    <main className="flex-1 bg-ivory text-foreground">
      {/* Hero — editorial photo */}
      <section className="relative h-[55vh] min-h-[420px] w-full overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-charcoal/10 to-charcoal/70" />
        <div className="container-x relative flex h-full flex-col justify-end pb-14 text-ivory">
          <FadeIn className="space-y-3">
            <p className="font-script text-3xl text-clay-light sm:text-4xl">
              Pieds dans l&apos;eau
            </p>
            <h1 className="heading-display text-[clamp(2.75rem,8vw,6.5rem)] text-ivory">
              Chalets
            </h1>
            <p className="max-w-2xl text-ivory/85 sm:text-lg">
              9 chalets bois et verre, tous équipés d&apos;une piscine privée et
              offrant une vue mer directe.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Sidebar + grid */}
      <section className="container-x py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-12">
          <ListingFiltersSidebar resultCount={chalets.length} />

          <div>
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="font-heading text-2xl text-foreground sm:text-3xl">
                {chalets.length} chalet{chalets.length === 1 ? "" : "s"}{" "}
                disponible{chalets.length === 1 ? "" : "s"}
              </h2>
              <span className="text-xs text-muted-foreground">
                Trié par défaut
              </span>
            </div>

            {chalets.length === 0 ? (
              <FadeIn className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <h3 className="font-heading text-2xl text-foreground">
                  Aucun chalet ne correspond
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
        </div>
      </section>
    </main>
  );
}
