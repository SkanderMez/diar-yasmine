import * as LucideIcons from "lucide-react";
import {
  ArrowLeft,
  Bath,
  Bed,
  Check,
  Clock,
  MapPin,
  Maximize,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Waves,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PublicPropertyDetail } from "@/lib/queries";
import { PropertyGallery } from "./property-gallery";
import { BookingWidget } from "./booking-widget";
import { PropertyJsonLd } from "./json-ld";

interface PropertyDetailProps {
  property: PublicPropertyDetail;
  taxRate: number;
}

/**
 * Airbnb/Booking-style property detail page. Photos top, sticky booking
 * widget on the right, rich content on the left (overview, description,
 * amenities, map, host rules).
 */
export function PropertyDetail({ property, taxRate }: PropertyDetailProps) {
  const photos = property.photos.map((p) => ({ url: p.url, alt: p.alt }));
  const listingHref = property.type === "CHALET" ? "/chalets" : "/bungalows";
  const listingLabel = property.type === "CHALET" ? "Chalets" : "Bungalows";
  const subtitle =
    property.type === "CHALET" ? "Chalet bord de mer" : "Bungalow jardin";

  const stats = [
    {
      icon: <Users className="size-5" />,
      label: `${property.capacity} voyageurs`,
    },
    {
      icon: <Bed className="size-5" />,
      label: `${property.bedrooms} chambre${property.bedrooms > 1 ? "s" : ""}`,
    },
    {
      icon: <Bath className="size-5" />,
      label: `${property.bathrooms} salle${property.bathrooms > 1 ? "s" : ""} de bain`,
    },
    ...(property.sizeM2
      ? [
          {
            icon: <Maximize className="size-5" />,
            label: `${property.sizeM2} m²`,
          },
        ]
      : []),
  ];

  const highlights = [
    property.beachfront && {
      icon: <Waves className="size-5" />,
      title: "Pieds dans l'eau",
      body: "Sortie directe sur la plage, à moins de 30 secondes de marche.",
    },
    property.hasPrivatePool && {
      icon: <Sparkles className="size-5" />,
      title: "Piscine privée",
      body: "Votre propre piscine, à vous seul, entretenue chaque matin.",
    },
    property.seaView &&
      !property.beachfront && {
        icon: <MapPin className="size-5" />,
        title: "Vue mer",
        body: "Terrasse ouverte sur l'horizon méditerranéen.",
      },
  ].filter((x): x is Exclude<typeof x, false | undefined> => Boolean(x));

  return (
    <main className="flex-1 bg-ivory pt-24 text-foreground">
      <PropertyJsonLd property={property} />

      <div className="container-x">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm">
          <Link
            href={listingHref}
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour aux {listingLabel}
          </Link>
        </nav>

        {/* Title row */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="heading-display text-4xl text-foreground sm:text-5xl">
              {property.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/75">
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-clay text-clay" />
                <strong className="font-semibold text-foreground">4.9</strong>
                <span className="text-muted-foreground">· 24 séjours</span>
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                Tazarka, Cap Bon, Tunisie
              </span>
            </p>
          </div>
        </div>

        {/* Photo gallery */}
        <PropertyGallery photos={photos} propertyName={property.name} />

        {/* Content grid */}
        <div className="mt-12 grid gap-12 pb-24 lg:grid-cols-[1fr_400px] lg:gap-16">
          <div className="space-y-12">
            {/* Stats strip */}
            <section>
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="font-heading text-2xl text-foreground">
                    {subtitle}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Hébergement entier · réception 7j/7
                  </p>
                </div>
              </div>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
                  >
                    <span className="text-primary">{s.icon}</span>
                    <span className="text-sm font-medium text-foreground">
                      {s.label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Highlights */}
            {highlights.length > 0 && (
              <section className="space-y-5">
                <h2 className="font-heading text-2xl text-foreground">
                  Ce que cet hébergement a d&apos;unique
                </h2>
                <ul className="grid gap-3 sm:grid-cols-3">
                  {highlights.map((h) => (
                    <li
                      key={h.title}
                      className="rounded-2xl border border-border bg-card p-5"
                    >
                      <span className="inline-flex size-10 items-center justify-center rounded-full bg-clay/10 text-clay">
                        {h.icon}
                      </span>
                      <h3 className="mt-3 font-heading text-lg text-foreground">
                        {h.title}
                      </h3>
                      <p className="mt-1 text-sm text-foreground/70">
                        {h.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Description */}
            <section className="space-y-4 border-t border-border pt-10">
              <h2 className="font-heading text-2xl text-foreground">
                À propos de ce lieu
              </h2>
              <p className="whitespace-pre-line text-base leading-relaxed text-foreground/80">
                {property.descriptionFr}
              </p>
            </section>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <section className="space-y-5 border-t border-border pt-10">
                <h2 className="font-heading text-2xl text-foreground">
                  Ce que propose ce logement
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {property.amenities.map((pa) => (
                    <AmenityRow
                      key={pa.amenity.slug}
                      label={pa.amenity.labelFr}
                      iconName={pa.amenity.icon ?? undefined}
                    />
                  ))}
                </ul>
              </section>
            )}

            {/* Map */}
            <section className="space-y-5 border-t border-border pt-10">
              <div>
                <h2 className="font-heading text-2xl text-foreground">
                  Où vous serez
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tazarka, Cap Bon — Tunisie
                </p>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border">
                <iframe
                  title={`Localisation de ${property.name}`}
                  src="https://www.openstreetmap.org/export/embed.html?bbox=10.78%2C36.56%2C10.85%2C36.62&layer=mapnik&marker=36.5918%2C10.8157"
                  className="h-[400px] w-full border-0"
                  loading="lazy"
                />
              </div>
              <ul className="grid gap-3 sm:grid-cols-3">
                <Spot label="Aéroport Tunis-Carthage" value="1 h 10" />
                <Spot label="Hammamet" value="30 min" />
                <Spot label="Plage la plus proche" value="30 sec" />
              </ul>
            </section>

            {/* Things to know */}
            <section className="space-y-5 border-t border-border pt-10">
              <h2 className="font-heading text-2xl text-foreground">
                À savoir
              </h2>
              <div className="grid gap-6 sm:grid-cols-3">
                <RuleBlock
                  icon={<Clock className="size-5" />}
                  title="Règlement intérieur"
                  items={[
                    "Arrivée : 15h – 22h",
                    "Départ : avant 11h",
                    "Animaux acceptés sur demande",
                    "Pas de fêtes sonores",
                  ]}
                />
                <RuleBlock
                  icon={<ShieldCheck className="size-5" />}
                  title="Annulation"
                  items={[
                    "Gratuite jusqu'à J-14",
                    "50 % entre J-14 et J-7",
                    "Non remboursable J-7 → arrivée",
                  ]}
                />
                <RuleBlock
                  icon={<Sparkles className="size-5" />}
                  title="Inclus"
                  items={[
                    "Ménage final",
                    "Linge de lit et serviettes",
                    "Wi-Fi haut débit",
                    "Climatisation",
                  ]}
                />
              </div>
            </section>
          </div>

          {/* Booking widget */}
          <BookingWidget
            propertyId={property.id}
            propertySlug={property.slug}
            basePrice={property.basePrice}
            cleaningFee={property.cleaningFee}
            capacity={property.capacity}
            taxRate={taxRate}
          />
        </div>
      </div>
    </main>
  );
}

function AmenityRow({ label, iconName }: { label: string; iconName?: string }) {
  /* Look up the lucide icon dynamically — falls back to a generic check if
   * the stored icon name doesn't match a known component. */
  const Icon =
    iconName && iconName in LucideIcons
      ? (
          LucideIcons as unknown as Record<
            string,
            React.ComponentType<{ className?: string }>
          >
        )[iconName]
      : Check;

  return (
    <li className="flex items-center gap-3 py-2">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-bone text-foreground">
        {Icon ? <Icon className="size-4" /> : <Check className="size-4" />}
      </span>
      <span className="text-sm text-foreground">{label}</span>
    </li>
  );
}

function Spot({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-xl text-foreground">{value}</p>
    </li>
  );
}

function RuleBlock({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-foreground">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        <h3 className="font-heading text-lg">{title}</h3>
      </div>
      <ul className="space-y-1.5 text-sm text-foreground/75">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-clay" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
