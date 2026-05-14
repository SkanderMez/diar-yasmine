import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/public/fade-in";

interface WorldPhoto {
  url: string;
  alt: string | null;
}

interface TwoWorldsProps {
  chaletsCount: number;
  bungalowsCount: number;
  chaletPhoto?: WorldPhoto | null;
  bungalowPhoto?: WorldPhoto | null;
}

interface WorldSideProps {
  href: "/chalets" | "/bungalows";
  count: number;
  title: string;
  description: string;
  cta: string;
  photo?: WorldPhoto | null;
  fallbackAlt: string;
}

function WorldSide({
  href,
  count,
  title,
  description,
  cta,
  photo,
  fallbackAlt,
}: WorldSideProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-turquoise focus-visible:ring-offset-2"
    >
      {photo ? (
        <Image
          src={photo.url}
          alt={photo.alt ?? fallbackAlt}
          fill
          sizes="(max-width: 820px) 100vw, 50vw"
          className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
          priority={false}
        />
      ) : (
        <div className="absolute inset-0 bg-primary/40" aria-hidden />
      )}

      {/* Dark gradient overlay — opacity changes on hover */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-gradient-to-b from-primary/5 to-primary/70 opacity-100 transition-opacity duration-500 ease-out group-hover:opacity-[0.7]"
      />

      <div className="relative z-[2] flex min-h-[90vh] flex-col justify-end p-8 text-ivory sm:p-16">
        <div className="mb-2 font-script text-2xl text-turquoise-light">
          {count} hébergements
        </div>
        <h3 className="mb-3 font-heading text-3xl text-ivory sm:text-4xl">
          {title}
        </h3>
        <p className="mb-6 max-w-[360px] text-[1.05rem] text-ivory/90">
          {description}
        </p>
        <span className="inline-flex w-fit items-center gap-2 border-b border-current pb-1 font-medium text-ivory transition-[gap] duration-300 ease-out group-hover:gap-3">
          {cta}
          <ArrowRight className="size-4" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

/**
 * Two-worlds split — full-bleed (edge-to-edge), no container.
 * Above the split: centered eyebrow + h2 + lead inside the page container.
 */
export function TwoWorlds({
  chaletsCount,
  bungalowsCount,
  chaletPhoto,
  bungalowPhoto,
}: TwoWorldsProps) {
  return (
    <section>
      <div className="container-x py-20 pb-16 text-center sm:pt-24">
        <FadeIn>
          <p className="eyebrow">Le domaine</p>
          <h2 className="heading-display mx-auto mt-4 max-w-[720px] text-4xl text-foreground sm:text-5xl">
            Deux univers, <span className="heading-em">une même âme</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[580px] text-[1.05rem] text-charcoal-soft">
            À gauche, le rythme du ressac. À droite, l&apos;ombre des
            bougainvilliers. Choisissez votre tempo.
          </p>
        </FadeIn>
      </div>

      <div className="grid min-h-[90vh] grid-cols-1 md:grid-cols-2">
        <WorldSide
          href="/chalets"
          count={chaletsCount}
          title="Les Chalets de la Méditerranée"
          description="Pieds dans l'eau. Bois et verre. Piscines privées. L'architecture s'efface devant la mer."
          cta="Découvrir les chalets"
          photo={chaletPhoto}
          fallbackAlt="Les Chalets de la Méditerranée"
        />
        <WorldSide
          href="/bungalows"
          count={bungalowsCount}
          title="Les Bungalows du jardin"
          description="À sept minutes de la mer. Bougainvilliers, pierre, bois exotique. Le calme méditerranéen à l'état pur."
          cta="Découvrir les bungalows"
          photo={bungalowPhoto}
          fallbackAlt="Les Bungalows du jardin"
        />
      </div>
    </section>
  );
}
