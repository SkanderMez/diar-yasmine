"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Photo {
  url: string;
  alt: string | null;
}

interface PropertyGalleryProps {
  photos: Photo[];
  propertyName: string;
}

/**
 * Lightbox-capable photo gallery. Hero photo on the left at 2/3 width;
 * 4 thumbnails on the right (in 2×2 grid). Click any photo to open the
 * full-screen lightbox with arrow navigation.
 */
export function PropertyGallery({
  photos,
  propertyName,
}: PropertyGalleryProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-sand text-sm text-muted-foreground">
        Photos à venir
      </div>
    );
  }

  const [hero, ...rest] = photos;
  const sideThumbs = rest.slice(0, 4);

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        <button
          type="button"
          onClick={() => setOpenIdx(0)}
          className="relative col-span-2 aspect-[4/3] overflow-hidden rounded-xl bg-sand focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          {hero ? (
            <Image
              src={hero.url}
              alt={hero.alt ?? `${propertyName} — photo 1`}
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              priority
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
          ) : null}
        </button>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {sideThumbs.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setOpenIdx(i + 1)}
              className="relative aspect-square overflow-hidden rounded-xl bg-sand focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <Image
                src={p.url}
                alt={p.alt ?? `${propertyName} — photo ${i + 2}`}
                fill
                sizes="(max-width: 768px) 50vw, 17vw"
                className="object-cover transition-transform duration-300 hover:scale-[1.04]"
              />
              {i === 3 && photos.length > 5 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-charcoal/55 text-sm font-medium text-ivory">
                  +{photos.length - 5}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {openIdx !== null ? (
        <Lightbox
          photos={photos}
          startIdx={openIdx}
          propertyName={propertyName}
          onClose={() => setOpenIdx(null)}
        />
      ) : null}
    </>
  );
}

function Lightbox({
  photos,
  startIdx,
  propertyName,
  onClose,
}: {
  photos: Photo[];
  startIdx: number;
  propertyName: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const photo = photos[idx]!;

  function prev() {
    setIdx((i) => (i === 0 ? photos.length - 1 : i - 1));
  }
  function next() {
    setIdx((i) => (i === photos.length - 1 ? 0 : i + 1));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/95 p-4"
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }}
      tabIndex={-1}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute right-4 top-4 text-ivory hover:bg-ivory/10"
        aria-label="Fermer"
      >
        <X className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={prev}
        className="absolute left-4 text-ivory hover:bg-ivory/10"
        aria-label="Précédent"
      >
        <ChevronLeft className="size-6" />
      </Button>
      <div className="relative aspect-video w-full max-w-5xl">
        <Image
          src={photo.url}
          alt={photo.alt ?? `${propertyName} — photo ${idx + 1}`}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={next}
        className="absolute right-4 text-ivory hover:bg-ivory/10"
        aria-label="Suivant"
      >
        <ChevronRight className="size-6" />
      </Button>
      <p className="absolute bottom-4 text-xs text-ivory/70">
        {idx + 1} / {photos.length}
      </p>
    </div>
  );
}
