import { getTranslations } from "next-intl/server";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@diaryasmine.tn";
  const year = new Date().getFullYear();

  const navItems = [
    { key: "chalets" as const, href: "/" },
    { key: "bungalows" as const, href: "/" },
    { key: "padel" as const, href: "/" },
    { key: "about" as const, href: "/" },
    { key: "contact" as const, href: "/" },
  ];

  return (
    <footer className="border-t border-border bg-sand">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2 space-y-4">
            <Logo />
            <p className="max-w-md text-sm text-muted-foreground">{t("tagline")}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {t("address_line")}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              {t("links_title")}
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              {t("contact_title")}
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
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
                    className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          © {year} Diar Yasmine. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
