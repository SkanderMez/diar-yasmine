import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Mail, Minus, Plus } from "lucide-react";
import { FadeIn } from "@/components/public/fade-in";
import { ContactForm } from "@/components/public/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Nous contacter — réservation, séjour, padel, accès à Tazarka. Téléphone, WhatsApp, email, Instagram.",
};

type ChannelTone = "primary" | "whatsapp" | "bougainvillier";

type Channel = {
  href: string;
  label: string;
  value: string;
  tone: ChannelTone;
  icon: React.ReactNode;
  external?: boolean;
};

function InstagramIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.5 14.5c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-1.5-.8-2.5-1.4-3.5-3.1-.3-.5.3-.4.8-1.4.1-.2.1-.3 0-.5s-.7-1.7-.9-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3 4.8 4.2 1.8.7 2.5.8 3.4.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.2-.2-.4-.2-.6-.4zM12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.3-1.6c1.7 1 3.7 1.5 5.7 1.5 6.6 0 12-5.4 12-12S18.6 0 12 0z" />
    </svg>
  );
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const phone = process.env.NEXT_PUBLIC_RECEPTION_PHONE ?? "+216 72 000 000";
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? phone;
  const email =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@diaryasmine.tn";

  const channels: ReadonlyArray<Channel> = [
    {
      href: `tel:${phone.replace(/[^0-9+]/g, "")}`,
      label: "Téléphone",
      value: phone,
      tone: "primary",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
        </svg>
      ),
    },
    {
      href: `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`,
      label: "WhatsApp",
      value: whatsapp,
      tone: "whatsapp",
      icon: <WhatsAppIcon />,
      external: true,
    },
    {
      href: `mailto:${email}`,
      label: "Email",
      value: email,
      tone: "primary",
      icon: <Mail className="size-[22px]" />,
    },
    {
      href: "https://instagram.com/diaryasmine.tazarka",
      label: "Instagram",
      value: "@diaryasmine.tazarka",
      tone: "bougainvillier",
      icon: <InstagramIcon />,
      external: true,
    },
  ];

  return (
    <main className="flex-1 bg-ivory text-charcoal">
      {/* Hero */}
      <section className="pt-24">
        <div className="container-x pt-16 pb-8 text-center sm:pt-20">
          <FadeIn className="mx-auto max-w-3xl space-y-3">
            <p className="font-script text-2xl text-primary sm:text-3xl">
              Restons en contact
            </p>
            <h1 className="heading-display mx-auto max-w-3xl text-[clamp(2.25rem,5vw,3.75rem)] text-charcoal">
              Nous sommes <em className="heading-em">là pour vous</em>
            </h1>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-charcoal-soft sm:text-lg">
              L&apos;équipe répond à toutes les demandes en moins d&apos;une
              heure, 7j/7, de 8h à 22h.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Form + channels grid */}
      <section className="container-x py-12">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          {/* Form card */}
          <FadeIn className="rounded-lg border border-line-soft bg-white p-8 shadow-sm sm:p-10">
            <div className="mb-6 space-y-2">
              <h2 className="font-heading text-3xl text-charcoal sm:text-[1.75rem]">
                Écrivez-nous
              </h2>
              <p className="text-sm text-charcoal-soft">
                Nous répondons en moins d&apos;une heure pendant les horaires
                d&apos;ouverture.
              </p>
            </div>
            <ContactForm contactEmail={email} />
          </FadeIn>

          {/* Channels column */}
          <FadeIn delay="delay-100" className="space-y-6">
            <div>
              <h3 className="font-heading text-2xl text-charcoal">
                Autres moyens
              </h3>
              <p className="mt-2 text-sm text-charcoal-soft">
                Préférez-vous nous joindre directement ? Choisissez le canal qui
                vous convient.
              </p>
            </div>

            <div className="space-y-3">
              {channels.map((c) => (
                <ChannelCard key={c.label} {...c} />
              ))}
            </div>

            {/* Opening hours */}
            <div className="rounded-md bg-sand p-5">
              <h4 className="text-[0.85rem] font-medium tracking-[0.1em] text-charcoal uppercase">
                Horaires d&apos;ouverture
              </h4>
              <dl className="mt-3 space-y-1">
                <OpeningRow label="Lundi – Vendredi" value="8h – 22h" />
                <OpeningRow label="Samedi – Dimanche" value="9h – 22h" />
                <OpeningRow label="Conciergerie sur place" value="24h / 24" />
              </dl>
            </div>

            {/* Groups callout */}
            <div className="border-l-[3px] border-turquoise bg-white p-5">
              <p className="mb-1 block text-sm font-semibold text-charcoal">
                Vous êtes un groupe ?
              </p>
              <p className="text-sm leading-relaxed text-charcoal-soft">
                Mariages, séminaires, anniversaires : nous privatisons le
                domaine.{" "}
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("Demande de groupe")}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Demandez-nous un devis →
                </a>
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Big map */}
      <section className="py-12">
        <div className="container-x">
          <div className="relative h-[500px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#b8d8d4] via-turquoise to-primary-900">
            {/* Coastline SVG */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 1200 500"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M 0 400 Q 200 380 400 390 T 800 370 T 1200 360 L 1200 500 L 0 500 Z"
                fill="rgba(14,90,107,0.25)"
              />
              <path
                d="M 0 340 Q 160 330 320 340 T 640 325 T 960 315 T 1200 305"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                strokeDasharray="4,6"
              />
            </svg>

            {/* Marker pin */}
            <div className="absolute top-[48%] left-[52%] -translate-x-1/2 -translate-y-1/2">
              <div
                className="size-8 rounded-full border-[5px] border-white bg-bougainvillier shadow-[0_0_0_16px_rgba(196,78,122,0.2)]"
                style={{
                  boxShadow:
                    "0 0 0 16px rgba(196,78,122,0.2), var(--shadow-lg)",
                }}
              />
            </div>

            {/* Pin label */}
            <div className="absolute top-[calc(48%-56px)] left-[52%] -translate-x-1/2 rounded-full bg-white px-5 py-3 whitespace-nowrap shadow-[var(--shadow-md)]">
              <p className="font-heading text-base font-medium text-primary">
                Diar Yasmine Tazarka
              </p>
              <p className="text-[0.82rem] text-muted-foreground">
                Tazarka Plage, Cap Bon
              </p>
            </div>

            {/* Distance labels */}
            <div className="absolute top-[20%] left-[12%] rounded-full bg-white/95 px-3.5 py-1.5 text-sm text-charcoal-soft">
              Tunis (80 km)
            </div>
            <div className="absolute bottom-[25%] left-[30%] rounded-full bg-white/95 px-3.5 py-1.5 text-sm text-charcoal-soft">
              Hammamet (45 km)
            </div>
            <div className="absolute top-[20%] right-[8%] rounded-full bg-white/95 px-3.5 py-1.5 text-sm text-charcoal-soft">
              Korbous (35 km)
            </div>

            {/* Sea label */}
            <p className="absolute right-8 bottom-6 font-script text-3xl text-white/85">
              Méditerranée
            </p>

            {/* Zoom controls */}
            <div className="absolute top-5 right-5 flex flex-col gap-px rounded-md bg-white p-1 shadow-[var(--shadow-md)]">
              <button
                type="button"
                aria-label="Zoom in"
                className="flex size-9 items-center justify-center rounded-sm text-charcoal hover:bg-sand"
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                className="flex size-9 items-center justify-center rounded-sm text-charcoal hover:bg-sand"
              >
                <Minus className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ChannelCard({ href, label, value, tone, icon, external }: Channel) {
  const toneClass =
    tone === "whatsapp"
      ? "bg-[#25D366] text-white"
      : tone === "bougainvillier"
        ? "bg-bougainvillier text-white"
        : "bg-primary text-ivory";

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-4 rounded-md border border-line-soft bg-white p-5 transition-all duration-200 ease-out hover:translate-x-0.5 hover:border-primary hover:bg-sand"
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-sm ${toneClass}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.78rem] font-medium tracking-[0.1em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-0.5 truncate font-medium text-charcoal">{value}</p>
      </div>
    </a>
  );
}

function OpeningRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <dt className="text-charcoal">{label}</dt>
      <dd className="text-muted-foreground">{value}</dd>
    </div>
  );
}
