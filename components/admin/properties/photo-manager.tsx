"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePropertyPhoto } from "@/lib/properties-actions";

interface PhotoManagerProps {
  propertyId: string;
  initial: { id: string; url: string; alt: string | null }[];
}

export function PhotoManager({ propertyId, initial }: PhotoManagerProps) {
  const [photos, setPhotos] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, startDelete] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function onPick(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("photo", f));
      const res = await fetch(`/api/properties/${propertyId}/photos`, {
        method: "POST",
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      const uploaded: { id: string; url: string }[] = body.uploaded;
      setPhotos((p) => [...p, ...uploaded.map((u) => ({ ...u, alt: null }))]);
      toast.success(`${uploaded.length} photo(s) ajoutée(s)`);
    } catch (err) {
      toast.error("Upload échoué", {
        description: err instanceof Error ? err.message : "Erreur",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDelete(photoId: string) {
    startDelete(async () => {
      try {
        await deletePropertyPhoto({ photoId });
        setPhotos((p) => p.filter((x) => x.id !== photoId));
        toast.success("Photo supprimée");
      } catch (err) {
        toast.error("Suppression échouée", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {photos.length} photo{photos.length === 1 ? "" : "s"} · JPEG/PNG/WebP,
          25 MB max
        </p>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => onPick(e.target.files)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            <Upload className="size-4" />
            {uploading ? "Upload…" : "Ajouter des photos"}
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">
          Aucune photo. Ajoute des images JPEG, PNG ou WebP (jusqu&apos;à 25
          MB).
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <li
              key={p.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-sand"
            >
              <Image
                src={p.url}
                alt={p.alt ?? "Photo"}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                disabled={pendingDelete}
                className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-charcoal/80 text-ivory opacity-0 backdrop-blur transition-opacity hover:bg-destructive group-hover:opacity-100 focus:opacity-100"
                aria-label="Supprimer la photo"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
