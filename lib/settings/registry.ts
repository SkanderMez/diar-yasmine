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
    description: "Display currency on the public site (storage stays in millimes TND).",
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
