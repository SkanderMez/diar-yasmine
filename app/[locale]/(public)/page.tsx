import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, Sparkles, Waves } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { listPublicProperties } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/public/property-card";
import { HomeJsonLd } from "@/components/public/json-ld";

export default async function HomePage({
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

  // Photogenic showcase: 3 chalets with hero photos.
  const showcase = chalets.filter((c) => c.photos.length > 0).slice(0, 3);
  const hero = chalets[0]?.photos[0] ?? bungalows[0]?.photos[0] ?? null;
  const chaletPreview = chalets[0]?.photos[0] ?? null;
  const bungalowPreview =
    bungalows.find((b) => b.photos.length > 0)?.photos[0] ?? null;

  return (
    <main className="flex-1">
      <HomeJsonLd />
      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="relative h-[80vh] min-h-[560px] w-full overflow-hidden">
        {hero ? (
          <Image
            src={hero.url}
            alt={hero.alt ?? "Diar Yasmine Tazarka Plage"}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary to-primary-light" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        <div className="relative mx-auto flex h-full max-w-5xl flex-col items-start justify-end px-4 pb-20 text-ivory sm:px-6 sm:pb-28">
          <p className="font-script text-xl text-primary-light sm:text-2xl">
            Tazarka Plage · Cap Bon
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-medium leading-tight sm:text-6xl">
            Diar Yasmine
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ivory/90 sm:text-base">
            21 chalets et bungalows en bord de mer méditerranéenne. Piscines
            privées, jardins parfumés, ambiance familiale. Un séjour direct,
            sans intermédiaire.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="default" className="gap-2">
              <Link href="/book">
                Réserver maintenant <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="default"
              variant="outline"
              className="border-ivory/40 bg-ivory/10 text-ivory hover:bg-ivory/20 backdrop-blur"
            >
              <Link href="/chalets">Découvrir les chalets</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Two universes ──────────────────────────────────────── */}
      <section className="bg-ivory py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              Deux univers
            </p>
            <h2 className="mt-3 text-3xl font-medium text-foreground sm:text-4xl">
              Le bord de mer ou le jardin
            </h2>
          </header>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <UniverseCard
              href="/chalets"
              title="Chalets"
              tagline="Pieds dans l'eau"
              description="9 chalets bois et verre avec piscine privée et vue mer directe."
              icon={<Waves className="size-5" />}
              imageUrl={chaletPreview?.url}
              imageAlt={chaletPreview?.alt ?? "Chalets en bord de mer"}
            />
            <UniverseCard
              href="/bungalows"
              title="Bungalows"
              tagline="Jardin méditerranéen"
              description="12 bungalows à 7 minutes à pied de la plage, parfumés de jasmin."
              icon={<Sparkles className="size-5" />}
              imageUrl={bungalowPreview?.url}
              imageAlt={bungalowPreview?.alt ?? "Bungalows dans le jardin"}
            />
          </div>
        </div>
      </section>

      {/* ─── Showcase ───────────────────────────────────────────── */}
      {showcase.length > 0 && (
        <section className="bg-sand py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary">
                  Aperçu
                </p>
                <h2 className="mt-3 text-3xl font-medium text-foreground sm:text-4xl">
                  Quelques chalets
                </h2>
              </div>
              <Button asChild variant="ghost" className="gap-2">
                <Link href="/chalets">
                  Voir les 9 chalets <ArrowRight className="size-4" />
                </Link>
              </Button>
            </header>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {showcase.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Padel teaser ───────────────────────────────────────── */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary-light">
              À côté
            </p>
            <h2 className="mt-2 text-3xl font-medium">2 terrains de padel</h2>
            <p className="mt-2 max-w-md text-primary-foreground/80">
              Padels Méditerranée — courts professionnels accessibles à pied
              depuis Diar Yasmine.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link href="/padel">En savoir plus</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function UniverseCard({
  href,
  title,
  tagline,
  description,
  icon,
  imageUrl,
  imageAlt,
}: {
  href: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  imageUrl?: string;
  imageAlt: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[5/4] overflow-hidden rounded-2xl bg-sand"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 space-y-2 p-6 text-ivory">
        <span className="inline-flex items-center gap-2 rounded-full bg-ivory/15 px-3 py-1 text-xs uppercase tracking-widest backdrop-blur">
          {icon} {tagline}
        </span>
        <h3 className="text-3xl font-medium">{title}</h3>
        <p className="text-sm text-ivory/85">{description}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-light">
          Voir{" "}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
