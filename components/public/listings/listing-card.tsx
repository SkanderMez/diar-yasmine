import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PublicPropertyCard } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  property: PublicPropertyCard;
}

/**
 * Maquette `.card` — beachfront badge / heart button / "+N photos" pill on
 * the photo, badges row + title + meta + price/rating row below. The hover
 * lift and the image scale-up are driven by the outer `group` so the entire
 * card is a single transition unit.
 */
export function ListingCard({ property }: ListingCardProps) {
  const photo = property.photos[0];
  const photoCount = property.photos.length;
  const href =
    property.type === "CHALET"
      ? `/chalets/${property.slug}`
      : `/bungalows/${property.slug}`;
  const typeLabel = property.type === "CHALET" ? "Chalet" : "Bungalow";

  const tnd = property.basePrice / 1000;
  const priceLabel = Number.isInteger(tnd)
    ? tnd.toLocaleString("fr-FR")
    : tnd.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

  const rating = property.rating;

  return (
    <article className="group overflow-hidden rounded-2xl border border-line-soft bg-card transition-all duration-300 hover:-translate-y-1 hover:border-line hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.alt ?? property.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Photo à venir
          </div>
        )}

        <Link
          href={href}
          className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={property.name}
        />

        {property.beachfront && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[0.72rem] font-medium text-ivory">
            Front de mer
          </span>
        )}

        <button
          type="button"
          aria-label="Sauvegarder"
          className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-colors hover:bg-primary-tint"
        >
          <Heart className="size-4" />
        </button>

        {photoCount > 1 && (
          <span className="absolute bottom-3 right-3 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[0.72rem] font-semibold text-charcoal">
            + {photoCount} photos
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {property.hasPrivatePool && (
            <Badge variant="pool">Piscine privée</Badge>
          )}
          {property.seaView && !property.beachfront && (
            <Badge variant="sea">Vue mer</Badge>
          )}
        </div>

        <h3 className="font-heading text-[1.35rem] font-normal text-foreground">
          <Link href={href} className="transition-colors hover:text-primary">
            {property.name}
          </Link>
        </h3>

        <p className="mt-1 text-[0.85rem] text-muted-foreground">
          {typeLabel} · {property.capacity} voyageurs · {property.bedrooms}{" "}
          chambre{property.bedrooms > 1 ? "s" : ""} · {property.bathrooms} SDB
        </p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-[1.5rem] text-primary">
              {priceLabel}
            </span>
            <span className="text-[0.8rem] text-muted-foreground">
              TND / nuit
            </span>
          </div>
          {rating ? (
            <div className="flex items-center gap-1 text-[0.85rem] text-foreground">
              <Star
                className="size-3.5 text-gold"
                fill="currentColor"
                strokeWidth={0}
              />
              <span>{rating.avg.toFixed(1)}</span>
              <span className="text-muted-foreground">({rating.count})</span>
            </div>
          ) : (
            <span className="text-[0.78rem] text-muted-foreground">
              Nouveau
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "pool" | "sea" | "garden";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-medium",
        variant === "pool" && "bg-turquoise/15 text-primary",
        variant === "sea" && "bg-primary/10 text-primary",
        variant === "garden" && "bg-olive/20 text-[#4d5e3f]",
      )}
    >
      {children}
    </span>
  );
}
