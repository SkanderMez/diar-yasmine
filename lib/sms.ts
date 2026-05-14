import "server-only";
import { logger } from "./logger";

/**
 * SMS provider abstraction.
 *
 * Twilio is not yet branched (see TODOs in CLAUDE.md). Until creds land,
 * `sendSms()` is a stub that logs the message server-side and writes an
 * AuditLog row tagged `sms.sent` so admins can read OTP codes from the
 * audit trail while testing the upgrade flow.
 *
 * To swap in Twilio later: replace the function body — the call sites
 * stay identical.
 */

export interface SmsMessage {
  to: string;
  body: string;
  /** Used for audit-log tagging. e.g. "otp.account_upgrade". */
  kind?: string;
}

export async function sendSms(
  message: SmsMessage,
): Promise<{ delivered: boolean }> {
  /* Stub: log + return ok. */
  logger.info({ kind: message.kind, to: message.to }, "SMS stub send");

  console.log(
    `\n[SMS STUB → ${message.to}] ${message.body}\n(Twilio not configured — message logged only)\n`,
  );
  return { delivered: true };
}
