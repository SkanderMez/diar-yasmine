import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { listPublicProperties } from "@/lib/queries";
import { FadeIn } from "@/components/public/fade-in";
import { ContactForm } from "@/components/public/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Nous contacter — réservation, séjour, padel, accès à Tazarka.",
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const email =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@diaryasmine.tn";
  const phone = process.env.NEXT_PUBLIC_RECEPTION_PHONE ?? "+216 98 000 000";

  const chalets = await listPublicProperties("CHALET");
  const heroPhoto = chalets[1]?.photos[0] ?? chalets[0]?.photos[0] ?? null;

  return (
    <main className="flex-1 bg-ivory text-foreground">
      {/* Hero band */}
      <section className="relative overflow-hidden bg-deep text-ivory">
        {heroPhoto && (
          <Image
            src={heroPhoto.url}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
          />
        )}
        <div className="container-x relative pt-32 pb-20 sm:pt-40 sm:pb-24">
          <FadeIn className="max-w-3xl space-y-4">
            <p className="font-script text-3xl text-clay-light sm:text-4xl">
              Réception
            </p>
            <h1 className="heading-display text-[clamp(2.75rem,8vw,6rem)] text-ivory">
              On vous répond,
              <br />
              tous les jours.
            </h1>
            <p className="max-w-xl text-ivory/80 sm:text-lg">
              Une question avant de réserver, une demande spéciale, ou besoin
              d&apos;aide pour préparer votre séjour ? Choisissez le canal qui
              vous arrange.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Form + side info */}
      <section className="container-x section-y">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          {/* Form */}
          <FadeIn className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
            <div className="mb-6 space-y-2">
              <p className="eyebrow">Écrivez-nous</p>
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                Un message ? On vous rappelle.
              </h2>
              <p className="text-sm text-muted-foreground">
                Nous répondons sous 24 heures, du dimanche au vendredi.
              </p>
            </div>
            <ContactForm contactEmail={email} />
          </FadeIn>

          {/* Side panel */}
          <FadeIn delay="delay-100" className="space-y-3">
            <ChannelCard
              icon={<MessageCircle className="size-5" />}
              title="WhatsApp"
              subtitle="Le plus rapide. Aucune attente."
              href={
                whatsapp
                  ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`
                  : undefined
              }
              value={whatsapp ?? "À configurer"}
              accent
            />
            <ChannelCard
              icon={<Phone className="size-5" />}
              title="Téléphone"
              subtitle="8h – 20h, heure de Tunis."
              href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
              value={phone}
            />
            <ChannelCard
              icon={<Mail className="size-5" />}
              title="Email"
              subtitle="Pour les pièces jointes, les groupes."
              href={`mailto:${email}`}
              value={email}
            />

            <div className="mt-4 rounded-3xl border border-border bg-card p-6">
              <p className="eyebrow">Sur place</p>
              <h3 className="mt-2 font-heading text-xl text-foreground">
                Tazarka, Cap Bon
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-foreground/75">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-clay" />
                  Route de la plage, 8043 Tazarka, Tunisie
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 size-4 shrink-0 text-clay" />
                  Réception 7j/7, arrivées à partir de 15h
                </li>
              </ul>
              <a
                href="https://maps.google.com/?q=Tazarka,Tunisia"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Itinéraire Google Maps →
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Map */}
      <section className="bg-bone">
        <div className="container-x section-y-lg">
          <div className="overflow-hidden rounded-3xl">
            <iframe
              title="Carte Tazarka"
              src="https://www.openstreetmap.org/export/embed.html?bbox=10.78%2C36.56%2C10.85%2C36.62&layer=mapnik&marker=36.5918%2C10.8157"
              className="h-[500px] w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function ChannelCard({
  icon,
  title,
  subtitle,
  value,
  href,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
  href?: string;
  accent?: boolean;
}) {
  const inner = (
    <article
      className={
        accent
          ? "group flex items-start gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-5 transition-all hover:border-primary hover:shadow-md"
          : "group flex items-start gap-4 rounded-3xl border border-border bg-card p-5 transition-all hover:border-foreground/30 hover:shadow-md"
      }
    >
      <span
        className={
          accent
            ? "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            : "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-bone text-foreground"
        }
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-heading text-base text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        <p
          className={
            accent
              ? "mt-1 truncate text-sm font-medium text-primary"
              : "mt-1 truncate text-sm text-foreground"
          }
        >
          {value}
        </p>
      </div>
    </article>
  );
  if (!href) return inner;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {inner}
    </a>
  );
}
