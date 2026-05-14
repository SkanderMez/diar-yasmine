"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";

interface HeaderItem {
  key: string;
  href: string;
  label: string;
}

interface HeaderShellProps {
  items: HeaderItem[];
  cta: string;
  /** Reserved for future contact-strip; currently unused. */
  contactPhone?: string;
}

/**
 * Public navigation — pixel match of the maquette `partials.js` NAV.
 *
 *  - Fixed top, transparent over photo hero, becomes solid ivory/95 with
 *    backdrop blur after 60px of scroll.
 *  - `body[data-nav-solid="true"]` would force solid; for the Next.js
 *    integration we detect "hero pages" by pathname (home + listing index
 *    routes) instead — every other page renders solid from page-load.
 *  - The logo switches between the white variant (over hero) and the
 *    full-color variant (solid).
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

  const overHero = hasHero && !scrolled;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
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
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        overHero
          ? "bg-transparent py-5"
          : "border-b border-line-soft bg-ivory/95 py-3 backdrop-blur-xl",
      )}
    >
      <div className="container-x flex items-center justify-between gap-6">
        {/* Logo (light / dark variants) */}
        <Link
          href="/"
          aria-label="Diar Yasmine Tazarka Plage"
          className="relative inline-flex items-center"
        >
          <Image
            src={overHero ? "/brand/logo-white.svg" : "/brand/logo.svg"}
            alt="Diar Yasmine Tazarka Plage"
            width={200}
            height={120}
            priority
            className={cn(
              "w-auto transition-[height] duration-300",
              overHero ? "h-[52px]" : "h-10",
            )}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "relative text-[15px] font-medium transition-colors",
                "after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all hover:after:w-full",
                overHero
                  ? "text-ivory/95 hover:text-ivory"
                  : "text-foreground/85 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher dark={overHero} />

          <Link
            href="/search"
            className={cn(
              "hidden items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-all sm:inline-flex",
              "shadow-sm hover:-translate-y-0.5 hover:shadow-md",
              overHero
                ? "bg-white/95 text-primary backdrop-blur-md hover:bg-white"
                : "bg-primary text-primary-foreground hover:bg-bougainvillier",
            )}
          >
            {cta}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fermer" : "Menu"}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-full transition-colors lg:hidden",
              overHero
                ? "text-ivory hover:bg-white/10"
                : "text-foreground hover:bg-sand",
            )}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-t border-line-soft bg-ivory shadow-lg lg:hidden">
          <nav className="container-x flex flex-col py-4">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 text-base font-medium text-foreground/85 transition-colors hover:bg-sand hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/search"
              onClick={() => setMobileOpen(false)}
              className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-bougainvillier"
            >
              {cta}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
