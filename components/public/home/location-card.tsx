import { Clock, Mail, Phone, Plane } from "lucide-react";
import { Link } from "@/i18n/navigation";

const PULSE_KEYFRAMES = `
@keyframes diarYasminePulseDot {
  0%, 100% { box-shadow: 0 0 0 12px rgba(196,78,122,0.25); }
  50%      { box-shadow: 0 0 0 20px rgba(196,78,122,0.05); }
}
`;

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}

function InfoRow({ icon, label, value, last }: InfoRowProps) {
  return (
    <div
      className={`flex gap-4 py-4 ${last ? "" : "border-b border-line-soft"}`}
    >
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <div>
        <div className="text-[0.75rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

/**
 * "Comment venir" section with a left-side info card and a right-side
 * stylized map (gradient + SVG coastline + pulsing pink dot).
 */
export function LocationCard() {
  return (
    <section className="bg-ivory">
      <style dangerouslySetInnerHTML={{ __html: PULSE_KEYFRAMES }} />

      <div className="container-x section-y">
        <div className="mb-12 text-center">
          <p className="eyebrow">Comment venir</p>
          <h2 className="heading-display mx-auto mt-3 max-w-[820px] text-4xl text-foreground sm:text-5xl">
            À 1h de Tunis. À 7 min de la plage.{" "}
            <span className="heading-em">À votre rythme.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-[24px] border border-line-soft bg-white md:grid-cols-[1fr_1.4fr]">
          {/* LEFT — info card */}
          <div className="p-8 sm:p-12">
            <h3 className="mb-6 font-heading text-[1.75rem] text-foreground">
              Tazarka Plage
              <br />
              <span className="font-sans text-[0.9rem] font-normal tracking-normal text-muted-foreground">
                Gouvernorat de Nabeul, Cap Bon, Tunisie
              </span>
            </h3>

            <InfoRow
              icon={<Plane className="size-5" strokeWidth={2} />}
              label="Aéroport"
              value="Tunis-Carthage · 80 km"
            />
            <InfoRow
              icon={<Clock className="size-5" strokeWidth={2} />}
              label="Trajet depuis Tunis"
              value="~1h en voiture · A1 puis Tazarka"
            />
            <InfoRow
              icon={<Phone className="size-5" strokeWidth={2} />}
              label="Téléphone"
              value="+216 72 000 000"
            />
            <InfoRow
              icon={<Mail className="size-5" strokeWidth={2} />}
              label="Email"
              value="contact@diaryasmine.tn"
              last
            />

            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.95rem] font-medium text-ivory transition-all hover:bg-bougainvillier hover:-translate-y-px"
            >
              Voir le plan d&apos;accès
            </Link>
          </div>

          {/* RIGHT — stylized map */}
          <div
            className="relative min-h-[480px]"
            style={{
              background:
                "linear-gradient(135deg, #b8d8d4 0%, #4FB8C4 50%, #0E5A6B 100%)",
            }}
          >
            {/* Subtle radial highlights */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 8%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.3) 0%, transparent 6%), radial-gradient(circle at 60% 80%, rgba(255,255,255,0.35) 0%, transparent 5%)",
              }}
            />

            {/* Coastline SVG along the bottom */}
            <svg
              aria-hidden
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 600 480"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 380 Q 100 360 200 370 T 400 350 T 600 340 L 600 480 L 0 480 Z"
                fill="rgba(14,90,107,0.25)"
              />
              <path
                d="M 0 320 Q 80 310 160 320 T 320 305 T 480 295 T 600 285"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1}
                strokeDasharray="4,6"
              />
            </svg>

            {/* Pulsing pink dot — Diar Yasmine */}
            <div
              className="absolute size-6 rounded-full border-4 border-white"
              style={{
                top: "45%",
                left: "55%",
                background: "var(--color-bougainvillier)",
                boxShadow: "0 0 0 12px rgba(196,78,122,0.25)",
                animation: "diarYasminePulseDot 2s ease-in-out infinite",
              }}
            />
            <div
              className="absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-[0.85rem] font-medium text-primary shadow-md"
              style={{ top: "calc(45% - 36px)", left: "55%" }}
            >
              Diar Yasmine
            </div>

            {/* Distance labels */}
            <div
              className="absolute rounded-full px-3.5 py-1.5 text-[0.85rem] font-normal text-charcoal-soft shadow-md"
              style={{
                top: "18%",
                left: "18%",
                background: "rgba(255,255,255,0.9)",
              }}
            >
              Tunis (80km)
            </div>
            <div
              className="absolute rounded-full px-3.5 py-1.5 text-[0.85rem] font-normal text-charcoal-soft shadow-md"
              style={{
                bottom: "18%",
                right: "12%",
                background: "rgba(255,255,255,0.9)",
              }}
            >
              Hammamet (45km)
            </div>

            <div className="absolute bottom-6 left-6 font-script text-2xl text-turquoise-light">
              Méditerranée
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
