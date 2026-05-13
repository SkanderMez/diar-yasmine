import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./fade-in";

/**
 * Map preview section — uses an OpenStreetMap embed (no API key) centred
 * on Tazarka. Phase 2 may swap for a Mapbox custom-styled map with
 * property markers.
 */
export function MapPreview() {
  // Tazarka coordinates: 36.5918° N, 10.8157° E
  const bbox = "10.78,36.56,10.85,36.62";
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=36.5918,10.8157`;

  return (
    <section className="bg-bone">
      <div className="container-x section-y">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <FadeIn className="space-y-6">
            <p className="eyebrow">Localisation</p>
            <h2 className="heading-display text-4xl text-foreground sm:text-5xl">
              Tazarka, en plein Cap Bon
            </h2>
            <p className="text-foreground/75">
              À une heure de Tunis, trente minutes d&apos;Hammamet, vingt
              minutes des plages préservées de Korba. Une côte qui regarde la
              Sicile à l&apos;horizon.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-honey" />
                <span>
                  <strong className="text-foreground">
                    Aéroport Tunis-Carthage
                  </strong>
                  <br />
                  <span className="text-muted-foreground">
                    1h en voiture · transferts privés sur demande
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-honey" />
                <span>
                  <strong className="text-foreground">Hammamet</strong>
                  <br />
                  <span className="text-muted-foreground">
                    30 min — médina, restaurants, port
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-honey" />
                <span>
                  <strong className="text-foreground">Plages de Korba</strong>
                  <br />
                  <span className="text-muted-foreground">
                    20 min — lagune & nature préservée
                  </span>
                </span>
              </li>
            </ul>
            <div className="pt-2">
              <Button asChild variant="outline" shape="pill" size="lg">
                <Link href="/contact">
                  Itinéraire détaillé <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>

          <FadeIn
            offset="y-10"
            className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
          >
            <iframe
              title="Carte Tazarka"
              src={mapSrc}
              className="size-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-charcoal px-4 py-2 text-xs font-medium text-ivory shadow-lg">
              <span className="size-2 rounded-full bg-honey" />
              Diar Yasmine — Tazarka Plage
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
