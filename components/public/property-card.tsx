"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart, Waves } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PublicPropertyCard as Property } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  ratio?: "1/1" | "4/5" | "5/6";
}

/**
 * Airbnb-style property card — square photo, inline carousel, heart save,
 * neat info row. The heart is purely UI for now (no auth wiring).
 */
export function PropertyCard({ property, ratio = "5/6" }: PropertyCardProps) {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const photos = property.photos.length > 0 ? property.photos : [];
  const href =
    property.type === "CHALET"
      ? `/chalets/${property.slug}`
      : `/bungalows/${property.slug}`;

  const aspectClass = {
    "1/1": "aspect-square",
    "4/5": "aspect-[4/5]",
    "5/6": "aspect-[5/6]",
  }[ratio];

  function move(delta: number) {
    setIndex(
      (i) =>
        (i + delta + Math.max(photos.length, 1)) % Math.max(photos.length, 1),
    );
  }

  /** Cards show prices in TND with at most one decimal — millimes precision
   *  belongs on invoices / vouchers, not in browsing. */
  const tnd = property.basePrice / 1000;
  const priceLabel = Number.isInteger(tnd)
    ? tnd.toLocaleString("fr-FR")
    : tnd.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

  const features: string[] = [];
  if (property.hasPrivatePool) features.push("Piscine privée");
  if (property.beachfront) features.push("Pieds dans l'eau");
  else if (property.seaView) features.push("Vue mer");

  return (
    <article className="group">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-bone",
          aspectClass,
        )}
      >
        <Link
          href={href}
          className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={property.name}
        />
        {photos.length > 0 ? (
          photos.map((p, i) => (
            <Image
              key={p.url}
              src={p.url}
              alt={p.alt ?? property.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={cn(
                "object-cover transition-all duration-500",
                i === index ? "opacity-100 scale-100" : "opacity-0 scale-105",
                "group-hover:scale-[1.03]",
              )}
            />
          ))
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Photo à venir
          </div>
        )}

        {/* Carousel controls — only on hover, only if 2+ photos */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                move(-1);
              }}
              className="absolute left-3 top-1/2 z-10 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-charcoal opacity-0 shadow-md backdrop-blur-sm transition-all hover:scale-105 group-hover:opacity-100"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                move(1);
              }}
              className="absolute right-3 top-1/2 z-10 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-charcoal opacity-0 shadow-md backdrop-blur-sm transition-all hover:scale-105 group-hover:opacity-100"
              aria-label="Photo suivante"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {photos.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full transition-all",
                    i === index ? "w-1.5 bg-white" : "bg-white/60",
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Save heart (UI only for now) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSaved((v) => !v);
          }}
          className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center text-white/95 drop-shadow-md transition-transform hover:scale-110"
          aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
        >
          <Heart
            className={cn(
              "size-6 transition-colors",
              saved ? "fill-clay stroke-clay" : "fill-charcoal/30 stroke-white",
            )}
            strokeWidth={2}
          />
        </button>

        {property.beachfront && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground shadow-sm">
            <Waves className="size-3" /> Pieds dans l&apos;eau
          </span>
        )}
      </div>

      <Link href={href} className="block">
        <div className="mt-3 space-y-0.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-heading text-base font-medium text-foreground">
              {property.name}
            </h3>
            <span className="shrink-0 text-sm text-muted-foreground">
              {property.type === "CHALET" ? "Chalet" : "Bungalow"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Jusqu&apos;à {property.capacity} voyageurs · {property.bedrooms}{" "}
            chambre{property.bedrooms > 1 ? "s" : ""}
          </p>
          {features.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {features.join(" · ")}
            </p>
          )}
          <p className="pt-1 text-[15px]">
            <span className="font-semibold text-foreground">
              {priceLabel} TND
            </span>
            <span className="text-muted-foreground"> · par nuit</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
