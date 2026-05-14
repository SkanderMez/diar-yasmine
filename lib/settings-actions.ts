"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma, type UserRole } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { writeAudit } from "./audit";
import { setSetting, type SettingKey } from "./settings";

/**
 * Settings Server Actions — admin-only, zod-validated, audit-logged.
 *
 * Every mutation:
 *  1. Verifies the caller is ADMIN (defense in depth above the proxy).
 *  2. Validates inputs with zod.
 *  3. Writes through `setSetting`, which re-validates against the registry.
 *  4. Writes an `AuditLog` row tagged with the userId.
 *  5. Revalidates the settings page so the rendered HTML is fresh.
 */

class SettingsActionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "SettingsActionError";
  }
}

async function requireAdmin(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new SettingsActionError(
      "Authentification requise",
      "UNAUTHENTICATED",
      401,
    );
  }
  if (session.user.role !== "ADMIN") {
    throw new SettingsActionError(
      "Réservé aux administrateurs",
      "FORBIDDEN",
      403,
    );
  }
  return { id: session.user.id };
}

// =============================================================================
// TAXES & CURRENCY
// =============================================================================

const currencyEnum = z.enum(["TND", "EUR", "USD"]);

const updateTaxesAndCurrencySchema = z
  .object({
    primaryCurrency: currencyEnum,
    displayedCurrencies: z.array(currencyEnum).min(1),
    /** TVA rate as a decimal in [0, 1]; e.g. 0.19 = 19%. */
    taxRate: z.number().min(0).max(1),
    /** Tourist tax per guest per night, in millimes. */
    staySejourMillimes: z.number().int().min(0).max(100000),
  })
  .refine(
    (input) => input.displayedCurrencies.includes(input.primaryCurrency),
    {
      message: "La devise principale doit faire partie des devises affichées",
      path: ["primaryCurrency"],
    },
  );

export async function updateTaxesAndCurrency(
  input: z.infer<typeof updateTaxesAndCurrencySchema>,
): Promise<{ ok: true }> {
  const parsed = updateTaxesAndCurrencySchema.parse(input);
  const staff = await requireAdmin();

  // Snapshot for audit.
  const before = {
    primaryCurrency: parsed.primaryCurrency,
    displayedCurrencies: parsed.displayedCurrencies,
    taxRate: parsed.taxRate,
    staySejourMillimes: parsed.staySejourMillimes,
  };

  await setSetting("currency.primary", parsed.primaryCurrency, staff.id);
  await setSetting("currency.displayed", parsed.displayedCurrencies, staff.id);
  await setSetting("tax.rate", parsed.taxRate, staff.id);
  await setSetting(
    "tax.stay_sejour_millimes",
    parsed.staySejourMillimes,
    staff.id,
  );

  await writeAudit({
    userId: staff.id,
    action: "settings.taxes_currency_updated",
    entity: "Setting",
    entityId: "taxes_currency",
    diff: { after: before } satisfies Prisma.InputJsonValue,
  });

  revalidatePath("/[locale]/admin/settings", "page");
  return { ok: true };
}

// =============================================================================
// LANGUAGES
// =============================================================================

const localeEnum = z.enum(["fr", "en", "ar"]);

const updateLanguagesSchema = z.object({
  enabled: z.array(localeEnum).min(1),
});

export async function updateLanguages(
  input: z.infer<typeof updateLanguagesSchema>,
): Promise<{ ok: true; enabled: ("fr" | "en" | "ar")[] }> {
  const parsed = updateLanguagesSchema.parse(input);
  const staff = await requireAdmin();

  // French is the default locale and is always enabled (admin shell is FR-only).
  const enabledSet = new Set<"fr" | "en" | "ar">(parsed.enabled);
  enabledSet.add("fr");
  // Preserve a deterministic order: fr, en, ar.
  const enabled: ("fr" | "en" | "ar")[] = (["fr", "en", "ar"] as const).filter(
    (l) => enabledSet.has(l),
  );

  await setSetting("languages.enabled", enabled, staff.id);

  await writeAudit({
    userId: staff.id,
    action: "settings.languages_updated",
    entity: "Setting",
    entityId: "languages.enabled",
    diff: { after: { enabled } } satisfies Prisma.InputJsonValue,
  });

  revalidatePath("/[locale]/admin/settings", "page");
  return { ok: true, enabled };
}

// =============================================================================
// BRANDING
// =============================================================================

const brandingUrlSchema = z.string().url().nullable();

const updateBrandingSchema = z.object({
  logoUrl: brandingUrlSchema.optional(),
  logoDarkUrl: brandingUrlSchema.optional(),
  markUrl: brandingUrlSchema.optional(),
});

export async function updateBranding(
  input: z.infer<typeof updateBrandingSchema>,
): Promise<{ ok: true }> {
  const parsed = updateBrandingSchema.parse(input);
  const staff = await requireAdmin();

  const writes: Array<{ key: SettingKey; value: string | null }> = [];
  if (parsed.logoUrl !== undefined) {
    writes.push({ key: "branding.logo_url", value: parsed.logoUrl });
  }
  if (parsed.logoDarkUrl !== undefined) {
    writes.push({ key: "branding.logo_dark_url", value: parsed.logoDarkUrl });
  }
  if (parsed.markUrl !== undefined) {
    writes.push({ key: "branding.mark_url", value: parsed.markUrl });
  }

  if (writes.length === 0) {
    return { ok: true };
  }

  for (const write of writes) {
    // Each branding key has the same nullable URL schema; cast is sound.
    if (write.key === "branding.logo_url") {
      await setSetting("branding.logo_url", write.value, staff.id);
    } else if (write.key === "branding.logo_dark_url") {
      await setSetting("branding.logo_dark_url", write.value, staff.id);
    } else if (write.key === "branding.mark_url") {
      await setSetting("branding.mark_url", write.value, staff.id);
    }
  }

  await writeAudit({
    userId: staff.id,
    action: "settings.branding_updated",
    entity: "Setting",
    entityId: "branding",
    diff: {
      after: Object.fromEntries(writes.map((w) => [w.key, w.value])),
    } satisfies Prisma.InputJsonValue,
  });

  revalidatePath("/[locale]/admin/settings", "page");
  return { ok: true };
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

// Notification key constants live in ./notification-keys (a non-"use server"
// module) because Next.js forbids re-exporting non-async-function values from
// a "use server" file.
import { NOTIFICATION_KEYS } from "./notification-keys";

const updateNotificationPrefSchema = z.object({
  key: z.enum(NOTIFICATION_KEYS),
  enabled: z.boolean(),
});

export async function updateNotificationPref(
  input: z.infer<typeof updateNotificationPrefSchema>,
): Promise<{ ok: true }> {
  const parsed = updateNotificationPrefSchema.parse(input);
  const staff = await requireAdmin();

  // The registry key namespace is `notifications.${short}`. Resolve the
  // full key statically so TypeScript can verify each branch.
  switch (parsed.key) {
    case "new_reservation":
      await setSetting(
        "notifications.new_reservation",
        parsed.enabled,
        staff.id,
      );
      break;
    case "cancellation":
      await setSetting("notifications.cancellation", parsed.enabled, staff.id);
      break;
    case "conflict":
      await setSetting("notifications.conflict", parsed.enabled, staff.id);
      break;
    case "checkin_24h":
      await setSetting("notifications.checkin_24h", parsed.enabled, staff.id);
      break;
    case "review_published":
      await setSetting(
        "notifications.review_published",
        parsed.enabled,
        staff.id,
      );
      break;
    case "monthly_report":
      await setSetting(
        "notifications.monthly_report",
        parsed.enabled,
        staff.id,
      );
      break;
  }

  await writeAudit({
    userId: staff.id,
    action: "settings.notification_pref_updated",
    entity: "Setting",
    entityId: `notifications.${parsed.key}`,
    diff: {
      after: { key: parsed.key, enabled: parsed.enabled },
    } satisfies Prisma.InputJsonValue,
  });

  revalidatePath("/[locale]/admin/settings", "page");
  return { ok: true };
}

// =============================================================================
// USER INVITE
// =============================================================================

const userRoleEnum = z.enum([
  "ADMIN",
  "MANAGER",
  "RECEPTION",
  "VIEWER",
]) satisfies z.ZodType<UserRole>;

const inviteUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(1).max(120),
  role: userRoleEnum,
});

export async function inviteUser(
  input: z.infer<typeof inviteUserSchema>,
): Promise<{ ok: true; userId: string }> {
  const parsed = inviteUserSchema.parse(input);
  const staff = await requireAdmin();

  // 24 random bytes -> base64url. The user cannot authenticate with this
  // password; the invitation flow (TODO: Resend integration) will issue a
  // one-time set-password link instead.
  const temporaryPassword = randomBytes(24).toString("base64url");
  const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        name: parsed.name,
        role: parsed.role,
        hashedPassword,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await writeAudit({
      userId: staff.id,
      action: "user.invited",
      entity: "User",
      entityId: user.id,
      diff: {
        after: { email: user.email, name: user.name, role: user.role },
      } satisfies Prisma.InputJsonValue,
    });

    // TODO: send the actual invitation email via Resend when wired up.
    // For now the user row exists but the invitee cannot log in until an
    // admin manually triggers a password reset.

    revalidatePath("/[locale]/admin/settings", "page");
    return { ok: true, userId: user.id };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new SettingsActionError(
        "Cet email est déjà utilisé",
        "EMAIL_TAKEN",
        409,
      );
    }
    throw err;
  }
}
