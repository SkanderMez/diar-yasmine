import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Next.js 16 proxy (formerly `middleware.ts`).
 *
 * Runs on the Node.js runtime (proxy can no longer run on Edge in
 * Next 16). Only handles route protection — the i18n proxy logic
 * is composed in step 13 (next-intl) by wrapping this function.
 *
 * Customer accounts use a DIFFERENT cookie + endpoint and are NOT
 * checked here. See CLAUDE.md → "Auth model".
 */

const ADMIN_ROUTE = /^(\/(fr|en|ar))?\/admin(\/|$)/;

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (ADMIN_ROUTE.test(pathname)) {
    if (!request.auth) {
      const signInUrl = new URL("/signin", request.nextUrl);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next internals, static files, brand assets, and Next-Auth's own routes
    "/((?!api/auth|_next/static|_next/image|favicon.ico|brand/|.*\\..*).*)",
  ],
};
