import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";

export async function Header() {
  const t = await getTranslations("nav");

  const navItems = [
    { key: "chalets" as const, href: "/chalets" },
    { key: "bungalows" as const, href: "/bungalows" },
    { key: "padel" as const, href: "/padel" },
    { key: "about" as const, href: "/about" },
    { key: "contact" as const, href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="text-foreground/80 transition-colors hover:text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/book">{t("book_cta")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
