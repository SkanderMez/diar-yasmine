"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Users, Waves } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatTND } from "@/lib/money";
import type { PublicPropertyCard as Property } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  /** Forces a specific aspect ratio for grid alignment. Default 4/5. */
  ratio?: "4/5" | "3/4" | "4/3" | "1/1";
}

/**
 * Editorial property card — vertical photo dominant (Airbnb-like),
 * inline carousel on hover, minimal info below the image. Designed
 * to look great in 3-up grids with breathing room.
 */
export function PropertyCard({ property, ratio = "4/5" }: PropertyCardProps) {
  const [index, setIndex] = useState(0);
  const photos = property.photos.length > 0 ? property.photos : [];
  const href =
    property.type === "CHALET"
      ? `/chalets/${property.slug}`
      : `/bungalows/${property.slug}`;

  const aspectClass = {
    "4/5": "aspect-[4/5]",
    "3/4": "aspect-[3/4]",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
  }[ratio];

  function next() {
    setIndex((i) => (i + 1) % Math.max(photos.length, 1));
  }
  function prev() {
    setIndex(
      (i) => (i - 1 + Math.max(photos.length, 1)) % Math.max(photos.length, 1),
    );
  }

  return (
    <article className="group">
      <Link
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-sand",
            aspectClass,
          )}
        >
          {photos.length > 0 ? (
            <>
              {photos.map((p, i) => (
                <Image
                  key={p.url}
                  src={p.url}
                  alt={p.alt ?? property.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className={cn(
                    "object-cover transition-opacity duration-500",
                    i === index ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
              {photos.length > 1 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-between p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      prev();
                    }}
                    className="pointer-events-auto inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-md backdrop-blur-sm transition-transform hover:scale-105"
                    aria-label="Photo précédente"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      next();
                    }}
                    className="pointer-events-auto inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-md backdrop-blur-sm transition-transform hover:scale-105"
                    aria-label="Photo suivante"
                  >
                    ›
                  </button>
                </div>
              )}
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                  {photos.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "size-1.5 rounded-full transition-all",
                        i === index ? "w-4 bg-white" : "bg-white/60",
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Photo à venir
            </div>
          )}

          {property.beachfront && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-primary backdrop-blur">
              <Waves className="size-3" /> Pieds dans l&apos;eau
            </span>
          )}
        </div>

        <div className="mt-5 space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-xl font-medium text-foreground transition-colors group-hover:text-primary">
              {property.name}
            </h3>
            <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            {property.type === "CHALET"
              ? "Chalet bord de mer"
              : "Bungalow jardin"}
            {" · "}
            <Users className="inline size-3.5" /> jusqu&apos;à{" "}
            {property.capacity}
            {property.hasPrivatePool ? " · piscine privée" : ""}
            {property.seaView && !property.beachfront ? " · vue mer" : ""}
          </p>
          <p className="pt-1.5 text-sm">
            <span className="font-medium text-foreground">
              {formatTND(property.basePrice)}
            </span>{" "}
            <span className="text-muted-foreground">par nuit</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
