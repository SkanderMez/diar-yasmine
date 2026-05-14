import { setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AmenityForm } from "@/components/admin/amenities/amenity-form";

export default async function NewAmenityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

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
          Nouvel équipement
        </p>
        <h1 className="mt-1 text-3xl font-medium text-foreground">
          Ajouter au catalogue
        </h1>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        <AmenityForm
          mode="create"
          defaults={{
            slug: "",
            labelFr: "",
            labelEn: "",
            labelAr: "",
            icon: "",
            category: "",
            filterable: false,
            sortOrder: 100,
          }}
        />
      </div>
    </div>
  );
}
