/**
 * Single source of truth for the settings page's section IDs.
 * Used by both the URL parser (page.tsx) and the nav (settings-nav.tsx).
 */
export const SETTINGS_SECTIONS = [
  "users",
  "templates_email",
  "templates_voucher",
  "taxes",
  "languages",
  "branding",
  "security",
  "notifications",
  "integrations",
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export function isSettingsSection(value: string): value is SettingsSection {
  return (SETTINGS_SECTIONS as readonly string[]).includes(value);
}
