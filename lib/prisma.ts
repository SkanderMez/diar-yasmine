import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Singleton Prisma client.
 *
 * Prisma 7 ships only the "client" query engine (Rust-free, TypeScript
 * native) which requires an explicit driver adapter. We use the
 * `node-postgres` adapter for Supabase / vanilla Postgres.
 *
 * The connection string falls back to a build-time placeholder so the
 * adapter construction doesn't crash at `next build` when DATABASE_URL
 * is not yet provisioned. Real queries only run at request time.
 *
 * In development Next.js HMR re-evaluates server modules; we cache the
 * instance on `globalThis` to avoid a new connection pool per reload.
 */

const BUILD_TIME_PLACEHOLDER =
  "postgresql://buildtime:buildtime@localhost:5432/buildtime";

const connectionString = process.env.DATABASE_URL ?? BUILD_TIME_PLACEHOLDER;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function makeClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma: PrismaClient = globalThis.__prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
