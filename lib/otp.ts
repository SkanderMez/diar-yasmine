import "server-only";
import bcrypt from "bcryptjs";
import { OtpPurpose } from "@prisma/client";
import { prisma } from "./prisma";
import { sendSms } from "./sms";
import { logger } from "./logger";

const OTP_TTL_MINUTES = 10;
const MAX_OTPS_PER_HOUR = 5;
const MAX_ATTEMPTS_PER_OTP = 5;

/**
 * Generates a 6-digit OTP, stores its bcrypt hash, and dispatches the
 * clear code via SMS (stub). Returns `{ ok: true }` on success, or an
 * error code the route handler can surface.
 *
 * Rate-limit: at most 5 active OTPs per phone+purpose per hour. Older
 * unconsumed codes are revoked when a new one is issued (set
 * `consumedAt` to now-ish) so only the latest works.
 */
export async function requestOtp(opts: {
  phone: string;
  purpose: OtpPurpose;
  guestId?: string;
  ipAddress?: string;
}): Promise<
  | { ok: true; otpId: string }
  | { ok: false; reason: "rate_limited" | "send_failed" }
> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.customerOtp.count({
    where: {
      phone: opts.phone,
      purpose: opts.purpose,
      createdAt: { gte: since },
    },
  });
  if (recentCount >= MAX_OTPS_PER_HOUR) {
    return { ok: false, reason: "rate_limited" };
  }

  /* Revoke earlier unconsumed codes — only the freshest one should match. */
  await prisma.customerOtp.updateMany({
    where: {
      phone: opts.phone,
      purpose: opts.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { consumedAt: new Date() },
  });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const otp = await prisma.customerOtp.create({
    data: {
      phone: opts.phone,
      purpose: opts.purpose,
      guestId: opts.guestId,
      ipAddress: opts.ipAddress,
      codeHash,
      expiresAt,
    },
    select: { id: true },
  });

  const sent = await sendSms({
    to: opts.phone,
    body: `Diar Yasmine — votre code de vérification : ${code}. Il expire dans ${OTP_TTL_MINUTES} minutes.`,
    kind: `otp.${opts.purpose.toLowerCase()}`,
  });
  if (!sent.delivered) {
    logger.error({ otpId: otp.id }, "OTP send failed");
    return { ok: false, reason: "send_failed" };
  }
  return { ok: true, otpId: otp.id };
}

/**
 * Verifies a clear-text OTP against the freshest unconsumed code for the
 * phone+purpose tuple. Atomically increments attempts and marks the row
 * consumed on success.
 *
 * Returns the linked guestId (may be null if the code wasn't pre-linked,
 * e.g. for a fresh signup) so callers can chain into the next step.
 */
export async function verifyOtp(opts: {
  phone: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<
  | { ok: true; guestId: string | null }
  | { ok: false; reason: "not_found" | "expired" | "too_many" | "bad_code" }
> {
  const otp = await prisma.customerOtp.findFirst({
    where: {
      phone: opts.phone,
      purpose: opts.purpose,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { ok: false, reason: "not_found" };
  if (otp.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (otp.attempts >= MAX_ATTEMPTS_PER_OTP) {
    /* Invalidate after too many tries, force a fresh request. */
    await prisma.customerOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
    return { ok: false, reason: "too_many" };
  }

  const matches = await bcrypt.compare(opts.code, otp.codeHash);
  if (!matches) {
    await prisma.customerOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "bad_code" };
  }

  await prisma.customerOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true, guestId: otp.guestId };
}
