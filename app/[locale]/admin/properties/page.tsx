import { setRequestLocale } from "next-intl/server";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { formatTND } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminPropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const properties = await prisma.property.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      status: true,
      capacity: true,
      basePrice: true,
      _count: { select: { photos: true, reservations: true } },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const chalets = properties.filter((p) => p.type === "CHALET");
  const bungalows = properties.filter((p) => p.type === "BUNGALOW");

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-foreground">Hébergements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {properties.length} unités actives
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/properties/new">
            <Plus className="size-4" />
            Nouvel hébergement
          </Link>
        </Button>
      </header>

      <Group title="Chalets" items={chalets} />
      <Group title="Bungalows" items={bungalows} />
    </div>
  );
}

function Group({
  title,
  items,
}: {
  title: string;
  items: {
    id: string;
    slug: string;
    name: string;
    status: string;
    capacity: number;
    basePrice: number;
    _count: { photos: number; reservations: number };
  }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/properties/${p.id}/edit`}
              className="block rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.slug}</p>
                </div>
                <Badge
                  variant={p.status === "ACTIVE" ? "secondary" : "outline"}
                  className="text-[10px]"
                >
                  {p.status}
                </Badge>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">
                  {p.capacity} pers · {p._count.photos} photo
                  {p._count.photos === 1 ? "" : "s"} · {p._count.reservations}{" "}
                  résa
                </span>
                <span className="text-primary">{formatTND(p.basePrice)}/n</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
