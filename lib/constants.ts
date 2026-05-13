export const APP_TIMEZONE = "Africa/Tunis" as const;

export const SUPPORTED_LOCALES = ["fr", "en", "ar"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const APP_LOCALE_DEFAULT: SupportedLocale = "fr";
export const RTL_LOCALES: SupportedLocale[] = ["ar"];

export const MILLIMES_PER_TND = 1000;

export const RESERVATION_CODE_PREFIX = "DY";
export const RESERVATION_CODE_REGEX = /^DY-\d{8}-[A-Z0-9]{4}$/;
