import { getTranslations } from "next-intl/server";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const email =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@diaryasmine.tn";
  const phone = process.env.NEXT_PUBLIC_RECEPTION_PHONE ?? "+216 98 000 000";
  const year = new Date().getFullYear();

  const stay = [
    { key: "chalets" as const, href: "/chalets" },
    { key: "bungalows" as const, href: "/bungalows" },
    { key: "padel" as const, href: "/padel" },
  ];
  const company = [
    { key: "about" as const, href: "/about" },
    { key: "contact" as const, href: "/contact" },
  ];

  return (
    <footer className="bg-deep text-ivory">
      {/* Newsletter band */}
      <div className="border-b border-white/10">
        <div className="container-x grid items-center gap-8 py-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="font-script text-3xl text-clay-light">
              Restez en contact
            </p>
            <h2 className="mt-2 font-heading text-3xl text-ivory sm:text-4xl">
              Saisons, disponibilités, événements
            </h2>
            <p className="mt-3 max-w-md text-sm text-ivory/70">
              Quelques emails par an, jamais de spam. Désinscription en un clic.
            </p>
          </div>
          <form className="flex w-full overflow-hidden rounded-full border border-white/20 bg-white/5 backdrop-blur-sm lg:col-span-6">
            <input
              type="email"
              required
              placeholder="votre@email.com"
              className="w-full bg-transparent px-6 py-4 text-sm text-ivory outline-none placeholder:text-ivory/40"
            />
            <button
              type="submit"
              className="m-1 inline-flex shrink-0 items-center gap-2 rounded-full bg-ivory px-6 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-white"
            >
              S&apos;abonner <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Main grid */}
      <div className="container-x grid gap-12 py-20 md:grid-cols-12">
        <div className="space-y-5 md:col-span-5">
          <Logo
            variant="full"
            heightClass="h-16"
            className="[&_img]:brightness-0 [&_img]:invert"
          />
          <p className="font-script text-2xl text-clay-light">
            Tazarka Plage · Cap Bon
          </p>
          <p className="max-w-md text-sm leading-relaxed text-ivory/70">
            {t("tagline")}
          </p>
          <p className="flex items-center gap-2 text-sm text-ivory/70">
            <MapPin className="size-4" />
            {t("address_line")}
          </p>
        </div>

        <div className="md:col-span-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ivory/50">
            Séjourner
          </h3>
          <ul className="mt-5 space-y-3 text-sm">
            {stay.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="text-ivory/85 transition-colors hover:text-clay-light"
                >
                  {tNav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ivory/50">
            Maison
          </h3>
          <ul className="mt-5 space-y-3 text-sm">
            {company.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="text-ivory/85 transition-colors hover:text-clay-light"
                >
                  {tNav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ivory/50">
            Contact
          </h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 text-ivory/85 transition-colors hover:text-clay-light"
              >
                <Mail className="size-3.5" />
                Email
              </a>
            </li>
            <li>
              <a
                href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center gap-2 text-ivory/85 transition-colors hover:text-clay-light"
              >
                <Phone className="size-3.5" />
                Téléphone
              </a>
            </li>
            {whatsapp && (
              <li>
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-ivory/85 transition-colors hover:text-clay-light"
                >
                  <MessageCircle className="size-3.5" />
                  WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Bottom band */}
      <div className="border-t border-white/10">
        <div className="container-x flex flex-wrap items-baseline justify-between gap-4 py-6 text-xs text-ivory/55">
          <span>
            © {year} Diar Yasmine. {t("rights")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em]">
            Tazarka — Cap Bon — Tunisie
          </span>
        </div>
      </div>
    </footer>
  );
}
