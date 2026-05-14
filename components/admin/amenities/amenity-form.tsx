"use client";

import { useState, useTransition } from "react";
import * as LucideIcons from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAmenity, updateAmenity } from "@/lib/amenities-actions";

export interface AmenityFormDefaults {
  id?: string;
  slug: string;
  labelFr: string;
  labelEn?: string | null;
  labelAr?: string | null;
  icon?: string | null;
  category?: string | null;
  filterable: boolean;
  sortOrder: number;
}

interface Props {
  mode: "create" | "edit";
  defaults: AmenityFormDefaults;
}

/**
 * Single-form component for both creating and editing an amenity. The
 * server actions live in lib/amenities-actions.ts and revalidate the
 * relevant public + admin paths on success.
 */
export function AmenityForm({ mode, defaults }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [icon, setIcon] = useState(defaults.icon ?? "");

  async function submit(formData: FormData) {
    startTransition(async () => {
      try {
        if (mode === "edit") {
          await updateAmenity(defaults.id!, formData);
          toast.success("Équipement mis à jour");
        } else {
          await createAmenity(formData);
          toast.success("Équipement créé");
        }
        router.push("/admin/amenities");
      } catch (e) {
        const code = (e as Error).message;
        toast.error(code === "forbidden" ? "Accès refusé" : code);
      }
    });
  }

  const IconPreview =
    icon && (icon as string) in LucideIcons
      ? (
          LucideIcons as unknown as Record<
            string,
            React.ComponentType<{ className?: string }>
          >
        )[icon]
      : null;

  return (
    <form action={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={defaults.slug}
            required
            pattern="[a-z0-9-]+"
            placeholder="wifi, climatisation, bbq…"
          />
          <p className="text-[10px] text-muted-foreground">
            Identifiant URL — minuscules, chiffres, tirets uniquement.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Catégorie</Label>
          <Input
            id="category"
            name="category"
            defaultValue={defaults.category ?? ""}
            placeholder="confort, sport, extérieur…"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="labelFr">Label français *</Label>
          <Input
            id="labelFr"
            name="labelFr"
            required
            defaultValue={defaults.labelFr}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="labelEn">Label anglais</Label>
          <Input
            id="labelEn"
            name="labelEn"
            defaultValue={defaults.labelEn ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="labelAr">Label arabe</Label>
          <Input
            id="labelAr"
            name="labelAr"
            defaultValue={defaults.labelAr ?? ""}
            dir="rtl"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="icon">
            Icône (nom lucide-react,{" "}
            <a
              href="https://lucide.dev/icons/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              catalogue
            </a>
            )
          </Label>
          <Input
            id="icon"
            name="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="Wifi, AirVent, Coffee, Bath…"
          />
          <p className="text-[10px] text-muted-foreground">
            Nom exact en PascalCase, comme dans lucide.dev. Vide = puce simple.
          </p>
        </div>
        <div className="flex items-end">
          <div className="flex size-12 items-center justify-center rounded-full border border-border bg-bone text-foreground">
            {IconPreview ? (
              <IconPreview className="size-5" />
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">Ordre d&apos;affichage</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            max={9999}
            defaultValue={defaults.sortOrder}
            required
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="filterable"
              defaultChecked={defaults.filterable}
              className="size-4 rounded border-border accent-primary"
            />
            <span className="text-sm">
              <strong className="block text-foreground">
                Filtrable côté public
              </strong>
              <span className="text-xs text-muted-foreground">
                Apparaît dans la sidebar de la page /chalets et /bungalows.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/amenities")}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? "Enregistrement…"
            : mode === "edit"
              ? "Enregistrer"
              : "Créer"}
        </Button>
      </div>
    </form>
  );
}
