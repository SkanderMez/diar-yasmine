import { defineRouting } from "next-intl/routing";
import { SUPPORTED_LOCALES, APP_LOCALE_DEFAULT } from "@/lib/constants";

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: APP_LOCALE_DEFAULT,
  localePrefix: "always", // every URL has /fr, /en, or /ar prefix
});

export type Locale = (typeof routing.locales)[number];
