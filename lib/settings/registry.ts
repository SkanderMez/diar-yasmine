import { z } from "zod";

/**
 * Setting registry.
 *
 * Every key written to the `Setting` table MUST be declared here with
 * a Zod schema. The accessors in `./index.ts` reject any key not in
 * this registry, and validate values on every read and write.
 *
 * To add a new setting:
 * 1. Append a `{ key: { schema, default, description, role } }` entry.
 * 2. Use it via `getSetting("your.key")` — the return type is inferred.
 *
 * `role` is the minimum role required to edit the setting via the
 * admin UI (Phase 2/4). Read access is governed by feature flags or
 * surface-level RBAC, not by this field.
 */
export const SETTING_REGISTRY = {
  "tax.rate": {
    schema: z.number().min(0).max(1),
    default: 0,
    description:
      "VAT rate applied to reservation subtotals. Stored as a decimal in [0, 1]; e.g. 0.13 means 13%.",
    role: "ADMIN",
  },
  "currency.code": {
    schema: z.enum(["TND", "EUR", "USD"]),
    default: "TND" as const,
    description:
      "Display currency on the public site (storage stays in millimes TND).",
    role: "ADMIN",
  },
  timezone: {
    schema: z.string(),
    default: "Africa/Tunis",
    description: "Property timezone — informational, used on vouchers.",
    role: "ADMIN",
  },
  "voucher.terms_fr": {
    schema: z.string(),
    default: "",
    description: "Terms & conditions printed on the voucher (French).",
    role: "MANAGER",
  },
  "voucher.terms_en": {
    schema: z.string(),
    default: "",
    description: "Terms & conditions printed on the voucher (English).",
    role: "MANAGER",
  },
  "voucher.terms_ar": {
    schema: z.string(),
    default: "",
    description: "Terms & conditions printed on the voucher (Arabic).",
    role: "MANAGER",
  },
  // ---------------------------------------------------------------------------
  // Pricing — supplements & rules. Percentages are stored in basis points
  // (10000 = 100%) so the math stays in Int. Negative values allowed for
  // discounts (e.g. Ramadan, long-stay).
  // ---------------------------------------------------------------------------
  "pricing.weekend_pct": {
    schema: z.number().int().min(-10000).max(10000),
    default: 1500,
    description:
      "Weekend (Fri-Sun) supplement, basis points. 1500 = +15%, negative allowed.",
    role: "MANAGER",
  },
  "pricing.tn_holidays_pct": {
    schema: z.number().int().min(-10000).max(10000),
    default: 1000,
    description: "Tunisian school holidays supplement, basis points.",
    role: "MANAGER",
  },
  "pricing.ramadan_pct": {
    schema: z.number().int().min(-10000).max(10000),
    default: -2000,
    description: "Ramadan supplement, basis points (negative = discount).",
    role: "MANAGER",
  },
  "pricing.aid_pct": {
    schema: z.number().int().min(-10000).max(10000),
    default: 2500,
    description: "Aïd supplement, basis points.",
    role: "MANAGER",
  },
  "pricing.min_stay_low": {
    schema: z.number().int().min(1).max(30),
    default: 2,
    description: "Minimum nights for low-season bookings.",
    role: "MANAGER",
  },
  "pricing.min_stay_high": {
    schema: z.number().int().min(1).max(30),
    default: 3,
    description: "Minimum nights for high-season bookings.",
    role: "MANAGER",
  },
  "pricing.min_stay_peak": {
    schema: z.number().int().min(1).max(30),
    default: 5,
    description: "Minimum nights for peak-season bookings.",
    role: "MANAGER",
  },
  "pricing.longstay_discount_pct": {
    schema: z.number().int().min(-10000).max(10000),
    default: -1000,
    description:
      "Long-stay discount, basis points (negative = discount). Applied when nights >= threshold.",
    role: "MANAGER",
  },
  "pricing.longstay_threshold_nights": {
    schema: z.number().int().min(1).max(60),
    default: 5,
    description:
      "Nights threshold above which the long-stay discount kicks in.",
    role: "MANAGER",
  },
  "pricing.published_at": {
    schema: z.string(),
    default: "",
    description: "ISO timestamp of the last pricing publication.",
    role: "MANAGER",
  },
} as const satisfies Record<
  string,
  {
    schema: z.ZodTypeAny;
    default: unknown;
    description: string;
    role: "ADMIN" | "MANAGER";
  }
>;

export type SettingKey = keyof typeof SETTING_REGISTRY;
export type SettingValue<K extends SettingKey> = z.infer<
  (typeof SETTING_REGISTRY)[K]["schema"]
>;
