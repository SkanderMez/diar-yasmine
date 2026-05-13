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

interface PropertyGalleryProps {
  photos: Photo[];
  propertyName: string;
}

/**
 * Airbnb-style photo arrangement: one large image left (50%) + four
 * smaller images right (2×2). A "Toutes les photos" button bottom-right
 * opens the full-grid modal; clicking any photo opens the lightbox at
 * that index. Mobile collapses to a single hero with the same button.
 */
export function PropertyGallery({
  photos,
  propertyName,
}: PropertyGalleryProps) {
  const [open, setOpen] = useState<
    { mode: "lightbox"; idx: number } | { mode: "grid" } | null
  >(null);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-3xl bg-bone text-sm text-muted-foreground">
        Photos à venir
      </div>
    );
  }

  const hero = photos[0]!;
  const tiles = photos.slice(1, 5);

  return (
    <>
      <div className="relative">
        <div className="grid h-[60vh] max-h-[560px] min-h-[360px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
          {/* Hero — 2 cols × 2 rows */}
          <button
            type="button"
            onClick={() => setOpen({ mode: "lightbox", idx: 0 })}
            className="relative col-span-4 row-span-2 overflow-hidden bg-bone sm:col-span-2"
          >
            <Image
              src={hero.url}
              alt={hero.alt ?? `${propertyName} — photo 1`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              priority
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
          </button>
          {/* Tiles */}
          {tiles.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setOpen({ mode: "lightbox", idx: i + 1 })}
              className="relative hidden overflow-hidden bg-bone sm:block"
            >
              <Image
                src={p.url}
                alt={p.alt ?? `${propertyName} — photo ${i + 2}`}
                fill
                sizes="25vw"
                className="object-cover transition-transform duration-500 hover:scale-[1.04]"
              />
            </button>
          ))}
          {/* Fill empty tiles if photos < 5 with sand placeholders */}
          {Array.from({ length: Math.max(0, 4 - tiles.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="hidden bg-bone sm:block"
              aria-hidden
            />
          ))}
        </div>

        {/* Floating controls */}
        <div className="absolute right-4 top-4 flex gap-2">
          <PillButton icon={<Share2 className="size-3.5" />} label="Partager" />
          <PillButton
            icon={<Heart className="size-3.5" />}
            label="Sauvegarder"
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen({ mode: "grid" })}
          className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-charcoal/15 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-md transition-all hover:shadow-lg"
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
      className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur transition-all hover:bg-white hover:shadow"
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
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-ivory/95 px-6 py-4 backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-bone"
          aria-label="Fermer"
        >
          <X className="size-5" />
        </button>
        <h2 className="font-heading text-lg text-foreground">{propertyName}</h2>
        <div className="size-10" />
      </div>
      <div className="container-x py-10">
        <div className="grid gap-3 sm:grid-cols-2">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => onPick(i)}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-bone"
            >
              <Image
                src={p.url}
                alt={p.alt ?? `${propertyName} — photo ${i + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-[1.03]"
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
