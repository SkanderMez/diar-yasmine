"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";

interface HeaderItem {
  key: string;
  href: string;
  label: string;
}

interface HeaderShellProps {
  items: HeaderItem[];
  cta: string;
  /** Kept for backwards-compat; not surfaced as a separate band anymore. */
  contactPhone?: string;
}

/**
 * Editorial header. Transparent only over true full-bleed photo heroes
 * (home + listing index pages), solid everywhere else — including the
 * property detail page, which presents a photo grid rather than a hero.
 *
 * The previous "top thin band" with contact info has been removed; the
 * phone now lives in the contact page / footer to keep the header clean.
 */
export function HeaderShell({ items, cta }: HeaderShellProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasHero = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
    return p === "/" || p === "/chalets" || p === "/bungalows";
  }, [pathname]);

  const transparent = hasHero && !scrolled;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 48);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        transparent
          ? "bg-transparent"
          : "border-b border-border bg-ivory/95 backdrop-blur-md",
      )}
    >
      <div
        className={cn(
          "container-x flex items-center justify-between gap-6 transition-all duration-500",
          transparent ? "h-20" : "h-18",
        )}
      >
        {/* Logo + nav */}
        <div className="flex items-center gap-10">
          <div
            className={cn(
              "flex items-center gap-3",
              transparent && "[&_img]:brightness-0 [&_img]:invert",
            )}
          >
            <Logo variant="mark" heightClass={transparent ? "h-10" : "h-9"} />
            <span className="hidden sm:block">
              <Logo
                variant="wordmark"
                heightClass={transparent ? "h-4" : "h-[14px]"}
              />
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "transition-colors",
                  transparent
                    ? "text-white/85 hover:text-white"
                    : "text-foreground/80 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher dark={transparent} />
          <Button
            asChild
            size="sm"
            shape="pill"
            className={cn(
              "hidden sm:inline-flex",
              transparent && "bg-white text-charcoal hover:bg-white/90",
            )}
          >
            <Link href="/book">{cta}</Link>
          </Button>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full transition-colors md:hidden",
              transparent
                ? "text-white/90 hover:bg-white/10"
                : "text-foreground/80 hover:bg-secondary",
            )}
            aria-label={mobileOpen ? "Fermer" : "Menu"}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-t border-border bg-ivory/95 backdrop-blur-md md:hidden">
          <nav className="container-x flex flex-col py-4">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-3 text-base text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Button
              asChild
              shape="pill"
              size="lg"
              className="mt-3"
              onClick={() => setMobileOpen(false)}
            >
              <Link href="/book">{cta}</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
