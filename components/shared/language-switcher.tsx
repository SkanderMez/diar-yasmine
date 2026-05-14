"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  /** When `dark` is true the pill renders white-on-transparent (over a
   *  dark hero); otherwise it renders dark-on-light. */
  dark?: boolean;
}

/**
 * Segmented 3-button language pill matching the maquette's `.lang-switcher`.
 * The active locale becomes a filled pill in inverted color; the border
 * and text follow `currentColor` so the same component looks correct on
 * both light and dark headers without per-state classes.
 */
export function LanguageSwitcher({ dark = false }: LanguageSwitcherProps) {
  const locale = useLocale() as SupportedLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function switchTo(next: SupportedLocale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className={cn(
        "inline-flex gap-px rounded-full border p-0.5 transition-opacity",
        dark
          ? "border-white/70 text-white opacity-85 hover:opacity-100"
          : "border-foreground/40 text-foreground opacity-85 hover:opacity-100",
      )}
      role="group"
      aria-label="Langue"
    >
      {SUPPORTED_LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors",
              active
                ? dark
                  ? "bg-white text-primary"
                  : "bg-foreground text-ivory"
                : "hover:bg-foreground/5",
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
