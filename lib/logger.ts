import pino from "pino";

/**
 * Structured logger. Use this everywhere server-side instead of
 * `console.*`. Pino emits JSON in production, pretty-prints in dev
 * (when `LOG_LEVEL=debug`).
 *
 * Always pass PII through the redaction helpers in this file before
 * logging — never log raw phone numbers, emails, or passwords.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "diar-yasmine" },
  redact: {
    paths: [
      "password",
      "hashedPassword",
      "*.password",
      "*.hashedPassword",
      "credentials.password",
      "AUTH_SECRET",
      "DATABASE_URL",
    ],
    censor: "[REDACTED]",
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

/**
 * Mask a phone number to "+216••••••12" — keep international prefix
 * and last 2 digits. Returns "***" for inputs too short to mask.
 */
export function redactPhone(phone: string | null | undefined): string {
  if (!phone) return "***";
  const trimmed = phone.replace(/\s+/g, "");
  if (trimmed.length < 6) return "***";
  const prefix = trimmed.startsWith("+")
    ? trimmed.slice(0, 4)
    : trimmed.slice(0, 2);
  const suffix = trimmed.slice(-2);
  return `${prefix}${"•".repeat(Math.max(trimmed.length - prefix.length - 2, 1))}${suffix}`;
}

/**
 * Mask an email's local part: "ahmed@diaryasmine.tn" → "a••••@diaryasmine.tn".
 */
export function redactEmail(email: string | null | undefined): string {
  if (!email) return "***";
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}${"•".repeat(local.length - 1)}@${domain}`;
}
