import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client.
 *
 * In development Next.js hot-reloads server modules on every request,
 * which would create a new PrismaClient (and a new connection pool)
 * each time. We attach the instance to `globalThis` so HMR reuses it.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
