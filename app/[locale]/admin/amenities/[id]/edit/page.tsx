import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { AmenityForm } from "@/components/admin/amenities/amenity-form";

export default async function EditAmenityPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const amenity = await prisma.amenity.findUnique({ where: { id } });
  if (!amenity) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/amenities"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Retour au catalogue
      </Link>
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Édition
        </p>
        <h1 className="mt-1 text-3xl font-medium text-foreground">
          {amenity.labelFr}
        </h1>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        <AmenityForm
          mode="edit"
          defaults={{
            id: amenity.id,
            slug: amenity.slug,
            labelFr: amenity.labelFr,
            labelEn: amenity.labelEn,
            labelAr: amenity.labelAr,
            icon: amenity.icon,
            category: amenity.category,
            filterable: amenity.filterable,
            sortOrder: amenity.sortOrder,
          }}
        />
      </div>
    </div>
  );
}
