import { setRequestLocale } from "next-intl/server";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { AmenitiesTable } from "@/components/admin/amenities/amenities-table";

export default async function AmenitiesListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const amenities = await prisma.amenity.findMany({
    orderBy: [{ filterable: "desc" }, { sortOrder: "asc" }, { labelFr: "asc" }],
    select: {
      id: true,
      slug: true,
      labelFr: true,
      icon: true,
      category: true,
      filterable: true,
      sortOrder: true,
      _count: { select: { properties: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Catalogue
          </p>
          <h1 className="mt-1 text-3xl font-medium text-foreground">
            Équipements
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Le catalogue partagé par tous les hébergements. Marquez un
            équipement comme <strong>filtrable</strong> pour le faire apparaître
            dans la barre de filtres publique.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/amenities/new">
            <Plus className="size-4" />
            Nouvel équipement
          </Link>
        </Button>
      </header>

      <AmenitiesTable amenities={amenities} />
    </div>
  );
}
