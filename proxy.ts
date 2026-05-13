import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { routing } from "@/i18n/routing";

/**
 * Next.js 16 proxy (formerly `middleware.ts`).
 *
 * Composes two responsibilities:
 *   1. Staff auth — redirect unauthenticated requests to /[locale]/signin
 *      when accessing /[locale]/admin/*.
 *   2. i18n routing — locale detection, locale-prefixed redirects.
 *
 * Customer accounts use a separate cookie + endpoint that is NOT
 * checked here. See CLAUDE.md → "Auth model".
 *
 * Runs on Node.js (proxy can no longer run on Edge in Next 16).
 */

const intlMiddleware = createIntlMiddleware(routing);
const ADMIN_ROUTE = /^\/(fr|en|ar)\/admin(\/|$)/;

function localeFromPath(pathname: string): string {
  const seg = pathname.split("/")[1];
  return routing.locales.includes(seg as (typeof routing.locales)[number])
    ? seg!
    : routing.defaultLocale;
}

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (ADMIN_ROUTE.test(pathname) && !request.auth) {
    const locale = localeFromPath(pathname);
    const signInUrl = new URL(`/${locale}/signin`, request.nextUrl);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // Skip Next internals, ALL /api/* routes, static files, brand assets.
    // API routes are global (no locale prefix) — wrapping them with the
    // next-intl middleware would force a 307 to /fr/api/*.
    "/((?!api/|_next/static|_next/image|favicon.ico|brand/|.*\\..*).*)",
  ],
};
