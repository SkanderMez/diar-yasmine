"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tndToMillimes, millimesToTnd } from "@/lib/money";
import {
  createProperty,
  updateProperty,
  softDeleteProperty,
} from "@/lib/properties-actions";

type Mode = "create" | "edit";

interface AmenityOption {
  slug: string;
  labelFr: string;
  category: string | null;
}

export interface PropertyFormDefaults {
  id?: string;
  slug: string;
  name: string;
  type: "CHALET" | "BUNGALOW";
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  hasPrivatePool: boolean;
  seaView: boolean;
  beachfront: boolean;
  sizeM2?: number | null;
  descriptionFr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  /** Millimes (Int). Converted to TND in the form. */
  basePrice: number;
  cleaningFee: number;
  minStay: number;
  amenitySlugs: string[];
}

interface PropertyFormProps {
  mode: Mode;
  defaults: PropertyFormDefaults;
  amenities: AmenityOption[];
}

export function PropertyForm({ mode, defaults, amenities }: PropertyFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: defaults.name,
    slug: defaults.slug,
    type: defaults.type,
    status: defaults.status,
    capacity: defaults.capacity,
    bedrooms: defaults.bedrooms,
    bathrooms: defaults.bathrooms,
    hasPrivatePool: defaults.hasPrivatePool,
    seaView: defaults.seaView,
    beachfront: defaults.beachfront,
    sizeM2: defaults.sizeM2 ?? undefined,
    descriptionFr: defaults.descriptionFr,
    descriptionEn: defaults.descriptionEn ?? "",
    descriptionAr: defaults.descriptionAr ?? "",
    basePriceTnd: millimesToTnd(defaults.basePrice),
    cleaningFeeTnd: millimesToTnd(defaults.cleaningFee),
    minStay: defaults.minStay,
    amenitySlugs: new Set(defaults.amenitySlugs),
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleAmenity(slug: string) {
    setForm((f) => {
      const next = new Set(f.amenitySlugs);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return { ...f, amenitySlugs: next };
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const payload = {
          slug: form.slug.trim(),
          name: form.name.trim(),
          type: form.type,
          status: form.status,
          capacity: Number(form.capacity),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          hasPrivatePool: form.hasPrivatePool,
          seaView: form.seaView,
          beachfront: form.beachfront,
          sizeM2: form.sizeM2 ? Number(form.sizeM2) : undefined,
          descriptionFr: form.descriptionFr.trim(),
          descriptionEn: form.descriptionEn.trim() || undefined,
          descriptionAr: form.descriptionAr.trim() || undefined,
          basePrice: tndToMillimes(Number(form.basePriceTnd)),
          cleaningFee: tndToMillimes(Number(form.cleaningFeeTnd)),
          minStay: Number(form.minStay),
          amenitySlugs: Array.from(form.amenitySlugs),
        };
        if (mode === "create") {
          const result = await createProperty(payload);
          toast.success("Hébergement créé");
          router.push(`/admin/properties/${result.id}/edit`);
        } else if (defaults.id) {
          await updateProperty({ id: defaults.id, ...payload });
          toast.success("Hébergement mis à jour");
          router.refresh();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur";
        setError(msg);
        toast.error("Échec", { description: msg });
      }
    });
  }

  async function handleDelete() {
    if (!defaults.id) return;
    if (
      !confirm(
        "Soft-delete cet hébergement ? Il deviendra invisible côté public.",
      )
    )
      return;
    try {
      await softDeleteProperty({ id: defaults.id });
      toast.success("Hébergement archivé");
      router.push("/admin/properties");
    } catch (err) {
      toast.error("Échec", {
        description: err instanceof Error ? err.message : "Erreur",
      });
    }
  }

  // Group amenities by category for cleaner display.
  const byCategory = amenities.reduce<Record<string, AmenityOption[]>>(
    (acc, a) => {
      const key = a.category ?? "autres";
      (acc[key] ||= []).push(a);
      return acc;
    },
    {},
  );

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            maxLength={120}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            required
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          />
          <p className="text-xs text-muted-foreground">
            Lowercase, chiffres, tirets.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) => update("type", v as typeof form.type)}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CHALET">Chalet</SelectItem>
              <SelectItem value="BUNGALOW">Bungalow</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Statut</Label>
          <Select
            value={form.status}
            onValueChange={(v) => update("status", v as typeof form.status)}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Actif</SelectItem>
              <SelectItem value="INACTIVE">Inactif</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <NumberField
          id="capacity"
          label="Capacité"
          min={1}
          value={form.capacity}
          onChange={(v) => update("capacity", v)}
        />
        <NumberField
          id="bedrooms"
          label="Chambres"
          min={0}
          value={form.bedrooms}
          onChange={(v) => update("bedrooms", v)}
        />
        <NumberField
          id="bathrooms"
          label="SDB"
          min={0}
          value={form.bathrooms}
          onChange={(v) => update("bathrooms", v)}
        />
        <NumberField
          id="sizeM2"
          label="m²"
          min={0}
          value={form.sizeM2 ?? 0}
          onChange={(v) => update("sizeM2", v || undefined)}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <NumberField
          id="basePrice"
          label="Prix de base (TND/nuit)"
          step={0.001}
          value={form.basePriceTnd}
          onChange={(v) => update("basePriceTnd", v)}
        />
        <NumberField
          id="cleaningFee"
          label="Frais ménage (TND)"
          step={0.001}
          value={form.cleaningFeeTnd}
          onChange={(v) => update("cleaningFeeTnd", v)}
        />
        <NumberField
          id="minStay"
          label="Séjour minimum (nuits)"
          min={1}
          value={form.minStay}
          onChange={(v) => update("minStay", v)}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <ToggleCard
          label="Piscine privée"
          checked={form.hasPrivatePool}
          onChange={(v) => update("hasPrivatePool", v)}
        />
        <ToggleCard
          label="Vue mer"
          checked={form.seaView}
          onChange={(v) => update("seaView", v)}
        />
        <ToggleCard
          label="Pieds dans l'eau"
          checked={form.beachfront}
          onChange={(v) => update("beachfront", v)}
        />
      </section>

      <section className="space-y-3">
        <Label className="text-sm font-medium">Description française</Label>
        <Textarea
          value={form.descriptionFr}
          onChange={(e) => update("descriptionFr", e.target.value)}
          rows={4}
          required
          maxLength={4000}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Description anglaise (facultatif)</Label>
            <Textarea
              value={form.descriptionEn}
              onChange={(e) => update("descriptionEn", e.target.value)}
              rows={3}
              maxLength={4000}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description arabe (facultatif)</Label>
            <Textarea
              value={form.descriptionAr}
              onChange={(e) => update("descriptionAr", e.target.value)}
              rows={3}
              maxLength={4000}
              dir="rtl"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <Label className="text-sm font-medium">Équipements</Label>
        {Object.entries(byCategory).map(([category, list]) => (
          <div key={category} className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {category}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {list.map((a) => (
                <label
                  key={a.slug}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={form.amenitySlugs.has(a.slug)}
                    onCheckedChange={() => toggleAmenity(a.slug)}
                  />
                  {a.labelFr}
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        {mode === "edit" ? (
          <Button type="button" variant="outline" onClick={handleDelete}>
            Archiver l&apos;hébergement
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending
            ? "Enregistrement…"
            : mode === "create"
              ? "Créer"
              : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  step,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function ToggleCard({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm hover:bg-accent">
      <span>{label}</span>
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(Boolean(v))}
      />
    </label>
  );
}
