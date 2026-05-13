"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  /** When `dark` is true the trigger styles assume a dark background
   *  (e.g. transparent header on hero), so we invert the text colour. */
  dark?: boolean;
}

export function LanguageSwitcher({ dark = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("locale");
  const tCommon = useTranslations("common");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={tCommon("language")}
          className={cn(
            "gap-1.5",
            dark && "text-white/90 hover:bg-white/10 hover:text-white",
          )}
        >
          <Globe className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {locale}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() => {
              router.replace(pathname, { locale: l as SupportedLocale });
            }}
            data-active={l === locale}
            className="cursor-pointer data-[active=true]:font-semibold"
          >
            {t(l)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
