"use client";

import { useEffect, useState } from "react";
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
}

/**
 * Editorial header — translucent ivory + backdrop-blur, adds a soft
 * shadow on scroll. Mobile drawer slides from the top.
 */
export function HeaderShell({ items, cta }: HeaderShellProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
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
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "bg-ivory/85 backdrop-blur-md shadow-sm" : "bg-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 transition-all duration-300 sm:px-6 lg:px-10",
          scrolled ? "h-16" : "h-20",
        )}
      >
        <Logo variant="wordmark" heightClass={scrolled ? "h-5" : "h-6"} />

        <nav className="hidden items-center gap-8 text-sm text-foreground/80 md:flex">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button
            asChild
            size="sm"
            shape="pill"
            className="hidden sm:inline-flex"
          >
            <Link href="/book">{cta}</Link>
          </Button>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent md:hidden"
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

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-t border-border bg-ivory/95 backdrop-blur-md md:hidden">
          <nav className="flex flex-col p-4">
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
