"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Heart,
  Share2,
  X,
} from "lucide-react";

interface Photo {
  url: string;
  alt: string | null;
}

interface PropertyGalleryMagazineProps {
  photos: Photo[];
  propertyName: string;
}

/**
 * Maquette `.photo-gallery` — magazine layout: one big photo on the left
 * spanning 2 rows, then 2x2 small photos on the right. Click anywhere to
 * open the lightbox at that index. Bottom-right "Voir les N photos" pill
 * opens a grid modal; top-right share/save chips.
 */
export function PropertyGalleryMagazine({
  photos,
  propertyName,
}: PropertyGalleryMagazineProps) {
  const [open, setOpen] = useState<
    { mode: "lightbox"; idx: number } | { mode: "grid" } | null
  >(null);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-3xl bg-sand text-sm text-muted-foreground">
        Photos à venir
      </div>
    );
  }

  const hero = photos[0]!;
  const tiles = photos.slice(1, 5);

  return (
    <>
      <div className="relative">
        <div className="grid h-[420px] grid-cols-2 grid-rows-2 gap-2 overflow-hidden rounded-3xl sm:h-[500px] sm:grid-cols-[2fr_1fr_1fr] md:h-[540px]">
          {/* Hero — spans 2 rows on the leftmost column */}
          <button
            type="button"
            onClick={() => setOpen({ mode: "lightbox", idx: 0 })}
            className="group relative col-span-2 row-span-2 overflow-hidden bg-sand sm:col-span-1"
            aria-label={hero.alt ?? `${propertyName} — photo 1`}
          >
            <Image
              src={hero.url}
              alt={hero.alt ?? `${propertyName} — photo 1`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              priority
              className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
            />
            <span className="absolute inset-0 bg-primary/0 transition-colors duration-200 group-hover:bg-primary/10" />
          </button>

          {/* Tiles — 2x2 on desktop, hidden on mobile to keep magazine feel */}
          {tiles.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setOpen({ mode: "lightbox", idx: i + 1 })}
              className="group relative hidden overflow-hidden bg-sand sm:block"
              aria-label={p.alt ?? `${propertyName} — photo ${i + 2}`}
            >
              <Image
                src={p.url}
                alt={p.alt ?? `${propertyName} — photo ${i + 2}`}
                fill
                sizes="25vw"
                className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
              />
              <span className="absolute inset-0 bg-primary/0 transition-colors duration-200 group-hover:bg-primary/10" />
            </button>
          ))}
          {/* Empty placeholders — keep grid even if fewer than 4 tile photos */}
          {Array.from({ length: Math.max(0, 4 - tiles.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="hidden bg-sand sm:block"
              aria-hidden
            />
          ))}
        </div>

        {/* Top-right action chips */}
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <PillButton icon={<Share2 className="size-3.5" />} label="Partager" />
          <PillButton
            icon={<Heart className="size-3.5" />}
            label="Enregistrer"
          />
        </div>

        {/* Bottom-right show-all button */}
        <button
          type="button"
          onClick={() => setOpen({ mode: "grid" })}
          className="absolute bottom-5 right-5 z-10 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-md transition-all hover:bg-charcoal hover:text-ivory hover:shadow-lg"
        >
          <Grid3X3 className="size-4" />
          Voir les {photos.length} photos
        </button>
      </div>

      {open?.mode === "lightbox" && (
        <Lightbox
          photos={photos}
          startIdx={open.idx}
          propertyName={propertyName}
          onClose={() => setOpen(null)}
        />
      )}
      {open?.mode === "grid" && (
        <GridModal
          photos={photos}
          propertyName={propertyName}
          onClose={() => setOpen(null)}
          onPick={(idx) => setOpen({ mode: "lightbox", idx })}
        />
      )}
    </>
  );
}

function PillButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-charcoal shadow-sm backdrop-blur transition-all hover:bg-white hover:shadow"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function GridModal({
  photos,
  propertyName,
  onClose,
  onPick,
}: {
  photos: Photo[];
  propertyName: string;
  onClose: () => void;
  onPick: (idx: number) => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ivory">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line-soft bg-ivory/95 px-6 py-4 backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-10 items-center justify-center rounded-full text-charcoal transition-colors hover:bg-sand"
          aria-label="Fermer"
        >
          <X className="size-5" />
        </button>
        <h2 className="font-heading text-lg text-charcoal">{propertyName}</h2>
        <div className="size-10" />
      </div>
      <div className="container-x py-10">
        <div className="grid gap-3 sm:grid-cols-2">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => onPick(i)}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand"
            >
              <Image
                src={p.url}
                alt={p.alt ?? `${propertyName} — photo ${i + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
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

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setIdx((i) => (i === 0 ? photos.length - 1 : i - 1));
      if (e.key === "ArrowRight")
        setIdx((i) => (i === photos.length - 1 ? 0 : i + 1));
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, photos.length]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-charcoal"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between px-6 py-4 text-ivory">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-10 items-center justify-center rounded-full text-ivory transition-colors hover:bg-white/10"
          aria-label="Fermer"
        >
          <X className="size-5" />
        </button>
        <span className="text-sm">
          {idx + 1} / {photos.length}
        </span>
        <div className="size-10" />
      </div>
      <div className="relative flex-1">
        <Image
          src={photo.url}
          alt={photo.alt ?? `${propertyName} — photo ${idx + 1}`}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
        <button
          type="button"
          onClick={() => setIdx((i) => (i === 0 ? photos.length - 1 : i - 1))}
          className="absolute left-4 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-charcoal shadow-lg transition-transform hover:scale-105"
          aria-label="Précédent"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setIdx((i) => (i === photos.length - 1 ? 0 : i + 1))}
          className="absolute right-4 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-charcoal shadow-lg transition-transform hover:scale-105"
          aria-label="Suivant"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
