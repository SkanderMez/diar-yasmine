"use client";

import { useState, useTransition } from "react";
import * as LucideIcons from "lucide-react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  deleteAmenity,
  toggleAmenityFilterable,
} from "@/lib/amenities-actions";

interface AmenityRow {
  id: string;
  slug: string;
  labelFr: string;
  icon: string | null;
  category: string | null;
  filterable: boolean;
  sortOrder: number;
  _count: { properties: number };
}

export function AmenitiesTable({ amenities }: { amenities: AmenityRow[] }) {
  const [pending, startTransition] = useTransition();
  const [working, setWorking] = useState<string | null>(null);

  if (amenities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun équipement pour l&apos;instant.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/amenities/new">Créer le premier</Link>
        </Button>
      </div>
    );
  }

  function toggle(id: string, next: boolean) {
    setWorking(id);
    startTransition(async () => {
      try {
        await toggleAmenityFilterable(id, next);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setWorking(null);
      }
    });
  }

  function remove(id: string, label: string) {
    if (!confirm(`Supprimer « ${label} » ?`)) return;
    setWorking(id);
    startTransition(async () => {
      try {
        await deleteAmenity(id);
        toast.success("Équipement supprimé");
      } catch (e) {
        const code = (e as Error).message;
        toast.error(
          code === "in_use"
            ? "Cet équipement est utilisé par au moins un hébergement."
            : code,
        );
      } finally {
        setWorking(null);
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Équipement</th>
            <th className="px-4 py-3 text-left">Slug</th>
            <th className="px-4 py-3 text-left">Catégorie</th>
            <th className="px-4 py-3 text-center">Ordre</th>
            <th className="px-4 py-3 text-center">Utilisé</th>
            <th className="px-4 py-3 text-center">Filtre public</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {amenities.map((a) => (
            <tr key={a.id} className="hover:bg-secondary/20">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-bone text-foreground">
                    <AmenityIcon name={a.icon} />
                  </span>
                  <span className="font-medium text-foreground">
                    {a.labelFr}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {a.slug}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {a.category ?? "—"}
              </td>
              <td className="px-4 py-3 text-center text-muted-foreground">
                {a.sortOrder}
              </td>
              <td className="px-4 py-3 text-center text-muted-foreground">
                {a._count.properties}
              </td>
              <td className="px-4 py-3 text-center">
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={a.filterable}
                    disabled={pending && working === a.id}
                    onChange={(e) => toggle(a.id, e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className={
                      a.filterable
                        ? "inline-flex h-5 w-9 items-center rounded-full bg-primary px-0.5 transition-colors"
                        : "inline-flex h-5 w-9 items-center rounded-full bg-border px-0.5 transition-colors"
                    }
                  >
                    <span
                      className={
                        a.filterable
                          ? "size-4 translate-x-4 rounded-full bg-white transition-transform"
                          : "size-4 rounded-full bg-white transition-transform"
                      }
                    />
                  </span>
                </label>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-1">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/admin/amenities/${a.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(a.id, a.labelFr)}
                    disabled={pending && working === a.id}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AmenityIcon({ name }: { name: string | null }) {
  if (!name)
    return (
      <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground" />
    );
  const Icon =
    name in LucideIcons
      ? (
          LucideIcons as unknown as Record<
            string,
            React.ComponentType<{ className?: string }>
          >
        )[name]
      : null;
  return Icon ? (
    <Icon className="size-4" />
  ) : (
    <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground" />
  );
}
