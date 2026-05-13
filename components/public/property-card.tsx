import Image from "next/image";
import { Bed, Eye, Users, Waves } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatTND } from "@/lib/money";
import type { PublicPropertyCard as Property } from "@/lib/queries";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const hero = property.photos[0];
  const href =
    property.type === "CHALET"
      ? `/chalets/${property.slug}`
      : `/bungalows/${property.slug}`;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring/40"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand">
        {hero ? (
          <Image
            src={hero.url}
            alt={hero.alt ?? property.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Photo à venir
          </div>
        )}
        {property.beachfront && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-primary-foreground">
            <Waves className="size-3" /> Pieds dans l&apos;eau
          </span>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-medium text-lg text-foreground">
            {property.name}
          </h3>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {property.type === "CHALET" ? "Chalet" : "Bungalow"}
          </span>
        </div>

        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <li className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> {property.capacity} pers.
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Bed className="size-3.5" /> {property.bedrooms} ch.
          </li>
          {property.hasPrivatePool && (
            <li className="inline-flex items-center gap-1.5">
              <Waves className="size-3.5" /> Piscine privée
            </li>
          )}
          {property.seaView && (
            <li className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" /> Vue mer
            </li>
          )}
        </ul>

        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">À partir de</span>
          <span className="text-xl font-medium text-primary">
            {formatTND(property.basePrice)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              /nuit
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
