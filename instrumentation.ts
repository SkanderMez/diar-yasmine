/**
 * Next.js Instrumentation hook.
 *
 * Runs once per process boot (server and edge). We use it to lazy-init
 * Sentry only when SENTRY_DSN is set, so local development without
 * Sentry credentials boots silently.
 *
 * Phase 7 will tighten the integration (sourcemaps, tracesSampleRate,
 * Sentry CLI in CI). For now, server + client SDK init only.
 */
export async function register() {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0,
    });
  }
}

/**
 * Capture errors that propagate out of route handlers (Next 15+).
 */
export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
}
