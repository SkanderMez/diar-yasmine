import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

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

  return (
    <main className="flex-1 bg-ivory">
      <section className="bg-sand py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Réception
          </p>
          <h1 className="mt-3 text-4xl font-medium text-foreground sm:text-5xl">
            Contact
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Une question avant de réserver, une demande spéciale, ou besoin
            d&apos;aide pour préparer votre séjour ? La réception vous répond
            tous les jours.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <ContactCard
          icon={<MessageCircle className="size-5" />}
          title="WhatsApp"
          subtitle="Le plus rapide pour les questions ponctuelles."
          href={
            whatsapp
              ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`
              : undefined
          }
          value={whatsapp ?? "À configurer"}
        />
        <ContactCard
          icon={<Mail className="size-5" />}
          title="Email"
          subtitle="Pour les demandes détaillées et les pièces jointes."
          href={`mailto:${email}`}
          value={email}
        />
        <ContactCard
          icon={<Phone className="size-5" />}
          title="Téléphone"
          subtitle="Aux heures de bureau (8h–20h, Africa/Tunis)."
          value="+216 — à confirmer"
        />
        <ContactCard
          icon={<MapPin className="size-5" />}
          title="Adresse"
          subtitle="À 1h de Tunis et 30 min de Hammamet."
          value="Tazarka, Cap Bon, Tunisie"
        />
      </section>
    </main>
  );
}

function ContactCard({
  icon,
  title,
  subtitle,
  value,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <article className="h-full rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-medium text-foreground">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      <p className="mt-3 break-all text-sm text-primary">{value}</p>
    </article>
  );
  if (!href) return inner;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {inner}
    </a>
  );
}
