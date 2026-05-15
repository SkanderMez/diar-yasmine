"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PublicPropertyCard } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface AccommodationCarouselProps {
  properties: PublicPropertyCard[];
}

interface PropertyTeaserCardProps {
  property: PublicPropertyCard;
}

function PropertyTeaserCard({ property }: PropertyTeaserCardProps) {
  const [saved, setSaved] = useState(false);
  const photo = property.photos[0];
  const href =
    property.type === "CHALET"
      ? `/chalets/${property.slug}`
      : `/bungalows/${property.slug}`;
  const typeLabel = property.type === "CHALET" ? "Chalet" : "Bungalow";

  // Card-image badges — top-left (limited to one strong tag)
  const imageBadge: { label: string; cls: string } | null = property.beachfront
    ? {
        label: "Front de mer",
        cls: "bg-primary text-ivory",
      }
    : null;

  // Card-body badges — pool + sea/garden
  const bodyBadges: { label: string; cls: string }[] = [];
  if (property.hasPrivatePool) {
    bodyBadges.push({
      label: "Piscine privée",
      cls: "bg-turquoise/15 text-primary",
    });
  }
  if (property.seaView) {
    bodyBadges.push({ label: "Vue mer", cls: "bg-primary/10 text-primary" });
  } else if (!property.beachfront) {
    bodyBadges.push({
      label: "Jardin",
      cls: "bg-olive/20 text-[#4d5e3f]",
    });
  }

  // TND with at most one decimal, like the existing property-card.
  const tnd = property.basePrice / 1000;
  const priceLabel = Number.isInteger(tnd)
    ? tnd.toLocaleString("fr-FR")
    : tnd.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

  const rating = property.rating;

  const metaParts: string[] = [
    typeLabel,
    `${property.capacity} voyageurs`,
    `${property.bedrooms} chambre${property.bedrooms > 1 ? "s" : ""}`,
  ];

  return (
    <article className="group overflow-hidden rounded-[16px] border border-line-soft bg-white transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-sand">
          {photo ? (
            <Image
              src={photo.url}
              alt={photo.alt ?? property.name}
              fill
              sizes="360px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Photo à venir
            </div>
          )}

          {imageBadge && (
            <div className="absolute left-3 top-3 z-10 flex gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.72rem] font-medium tracking-wide",
                  imageBadge.cls,
                )}
              >
                {imageBadge.label}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSaved((v) => !v);
            }}
            aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
            className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-colors hover:bg-sand"
          >
            <Heart
              className={cn(
                "size-4 transition-colors",
                saved && "fill-bougainvillier stroke-bougainvillier",
              )}
              strokeWidth={2}
            />
          </button>
        </div>

        <div className="p-5">
          {bodyBadges.length > 0 && (
            <div className="mb-2 flex gap-1.5">
              {bodyBadges.map((b) => (
                <span
                  key={b.label}
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[0.72rem] font-medium tracking-wide",
                    b.cls,
                  )}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          <h3 className="font-heading text-[1.35rem] font-normal text-foreground">
            {property.name}
          </h3>
          <div className="mt-1 text-[0.85rem] text-muted-foreground">
            {metaParts.join(" · ")}
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="card-price-amount font-heading text-[1.5rem] text-primary">
                {priceLabel}
              </span>
              <span className="card-price-unit text-[0.8rem] text-muted-foreground">
                TND / nuit
              </span>
            </div>
            {rating ? (
              <div className="flex items-center gap-1 text-[0.85rem] text-foreground">
                <Star className="size-3.5 fill-gold stroke-gold" />
                {rating.avg.toFixed(1)}
                <span className="text-muted-foreground">({rating.count})</span>
              </div>
            ) : (
              <span className="text-[0.78rem] text-muted-foreground">
                Nouveau
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function AccommodationCarousel({
  properties,
}: AccommodationCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function scroll(delta: number) {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  if (properties.length === 0) return null;

  return (
    <section className="bg-ivory">
      <div className="container-x-wide section-y">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-[680px]">
            <p className="eyebrow">Nos hébergements</p>
            <h2 className="heading-display mt-3 text-4xl text-foreground sm:text-5xl">
              Choisissez votre <span className="heading-em">refuge</span>
            </h2>
            <p className="mt-3 text-[1.05rem] text-charcoal-soft">
              Chaque maison porte un nom. Chaque nom porte une histoire. Chaque
              histoire vous attend.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scroll(-380)}
              aria-label="Précédent"
              className="inline-flex size-11 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-colors hover:bg-sand"
            >
              <ChevronLeft className="size-[18px]" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => scroll(380)}
              aria-label="Suivant"
              className="inline-flex size-11 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-colors hover:bg-sand"
            >
              <ChevronRight className="size-[18px]" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            ref={trackRef}
            className="scroll-snap-x scrollbar-hidden flex gap-5 overflow-x-auto pb-4"
          >
            {properties.map((property) => (
              <div
                key={property.id}
                className="w-[360px] shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <PropertyTeaserCard property={property} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
