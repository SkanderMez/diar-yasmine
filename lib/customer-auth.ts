import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { env } from "./env";

/**
 * Customer authentication — INTENTIONALLY separate from Auth.js.
 *
 * Auth.js handles staff (`User` table). Customers (`Guest` table) use this
 * module: bcrypt for passwords, a JWT signed with AUTH_SECRET, stored in
 * a distinct cookie (`dy_customer_session`).
 *
 * Aggressive rate-limit is enforced at the OTP layer; password login also
 * uses bcrypt compare which is intentionally slow.
 */

const CUSTOMER_COOKIE = "dy_customer_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

const secretKey = new TextEncoder().encode(env.AUTH_SECRET);

export interface CustomerSession {
  guestId: string;
  phone: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signCustomerSession(
  payload: CustomerSession,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey);
}

export async function verifyCustomerSession(
  token: string,
): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (
      typeof payload.guestId === "string" &&
      typeof payload.phone === "string"
    ) {
      return { guestId: payload.guestId, phone: payload.phone };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Reads the customer session from cookies on the server. Returns null if
 * no cookie, expired, or tampered. Use in Server Components / Server
 * Actions / Route Handlers.
 */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const raw = store.get(CUSTOMER_COOKIE)?.value;
  if (!raw) return null;
  return verifyCustomerSession(raw);
}

/**
 * Sets the customer session cookie. Call from a Route Handler that owns
 * the response (cookies().set in route handlers only works because
 * Next 16 promises async cookies in handler context).
 */
export async function setCustomerSessionCookie(token: string) {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearCustomerSessionCookie() {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

/** Loads the full Guest row attached to the session, or null if the
 *  session points to a soft-deleted / missing guest. */
export async function getCurrentGuest() {
  const session = await getCustomerSession();
  if (!session) return null;
  const guest = await prisma.guest.findUnique({
    where: { id: session.guestId },
  });
  if (!guest || guest.deletedAt) return null;
  return guest;
}

export const CUSTOMER_COOKIE_NAME = CUSTOMER_COOKIE;
