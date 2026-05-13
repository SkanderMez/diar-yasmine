"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Phone, Search, X } from "lucide-react";
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
  contactPhone?: string;
}

/**
 * Editorial header. Transparent over the home + listing heroes (full-bleed
 * photo pages), solid ivory everywhere else. Detects route via pathname so
 * non-hero pages don't get the dark-text-on-light visual glitch.
 */
export function HeaderShell({ items, cta, contactPhone }: HeaderShellProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasHero = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
    return (
      p === "/" ||
      p === "/chalets" ||
      p === "/bungalows" ||
      /^\/(chalets|bungalows)\/[^/]+$/.test(p)
    );
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
          : "border-b border-border bg-ivory/92 backdrop-blur-md",
      )}
    >
      {/* Top thin band — visible only on hero pages until scroll */}
      {hasHero && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-500",
            transparent
              ? "max-h-10 opacity-100 border-b border-white/15"
              : "max-h-0 opacity-0",
          )}
        >
          <div className="container-x flex items-center justify-between py-2 text-[11px] tracking-wide text-white/75">
            <span className="hidden sm:inline">Tazarka — Cap Bon, Tunisie</span>
            {contactPhone && (
              <a
                href={`tel:${contactPhone.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
              >
                <Phone className="size-3" />
                {contactPhone}
              </a>
            )}
          </div>
        </div>
      )}

      <div
        className={cn(
          "container-x flex items-center justify-between gap-6 transition-all duration-500",
          transparent ? "h-20" : "h-16",
        )}
      >
        <div className="flex items-center gap-10">
          <Logo
            variant="wordmark"
            heightClass={transparent ? "h-6" : "h-5"}
            className={cn(transparent && "[&_img]:brightness-0 [&_img]:invert")}
          />
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              "hidden items-center gap-2 rounded-full border px-4 py-2 text-xs transition-all md:inline-flex",
              transparent
                ? "border-white/30 text-white/90 hover:border-white/50 hover:bg-white/10"
                : "border-foreground/15 text-foreground/80 hover:border-foreground/30 hover:bg-secondary",
            )}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Search className="size-3.5" />
            <span>Rechercher</span>
          </button>
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
