import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import {
  SETTING_REGISTRY,
  type SettingKey,
  type SettingValue,
} from "./registry";

/**
 * Read a typed setting from the database.
 *
 * Returns the registry default when no row exists yet (fresh install,
 * setting not yet configured by the admin). Throws if the stored value
 * fails registry validation — that means a write bypassed `setSetting`
 * or the data was tampered with.
 */
export async function getSetting<K extends SettingKey>(
  key: K,
): Promise<SettingValue<K>> {
  const entry = SETTING_REGISTRY[key];
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) {
    return entry.default as SettingValue<K>;
  }
  const parsed = entry.schema.safeParse(row.value);
  if (!parsed.success) {
    throw new Error(
      `Setting "${key}" is corrupt in the database: ${parsed.error.message}`,
    );
  }
  return parsed.data as SettingValue<K>;
}

/**
 * Write a typed setting. Validates with the registry schema before
 * persisting; an invalid value throws and never reaches the DB.
 *
 * The caller is responsible for checking that `userId` has the role
 * required by `SETTING_REGISTRY[key].role` (Server Action enforces RBAC).
 */
export async function setSetting<K extends SettingKey>(
  key: K,
  value: SettingValue<K>,
  userId?: string,
): Promise<void> {
  const entry = SETTING_REGISTRY[key];
  const parsed = entry.schema.parse(value);
  await prisma.setting.upsert({
    where: { key },
    update: {
      value: parsed as Prisma.InputJsonValue,
      updatedById: userId ?? null,
    },
    create: {
      key,
      value: parsed as Prisma.InputJsonValue,
      updatedById: userId ?? null,
    },
  });
}

export { SETTING_REGISTRY };
export type { SettingKey, SettingValue };
