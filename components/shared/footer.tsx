import { getTranslations } from "next-intl/server";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const email =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@diaryasmine.tn";
  const year = new Date().getFullYear();

  const navItems = [
    { key: "chalets" as const, href: "/chalets" },
    { key: "bungalows" as const, href: "/bungalows" },
    { key: "padel" as const, href: "/padel" },
    { key: "about" as const, href: "/about" },
    { key: "contact" as const, href: "/contact" },
  ];

  return (
    <footer className="border-t border-border bg-ivory">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-16 md:grid-cols-12">
          {/* Brand block */}
          <div className="md:col-span-5 space-y-6">
            <Logo variant="full" heightClass="h-20" />
            <p className="font-script text-2xl text-primary-light">
              Tazarka Plage · Cap Bon
            </p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {t("address_line")}
            </p>
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/60">
              {t("links_title")}
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-foreground/80 transition-colors hover:text-primary"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/60">
              {t("contact_title")}
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2.5 text-foreground/80 transition-colors hover:text-primary"
                >
                  <Mail className="size-4" />
                  {email}
                </a>
              </li>
              {whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 text-foreground/80 transition-colors hover:text-primary"
                  >
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-wrap items-baseline justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground">
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
