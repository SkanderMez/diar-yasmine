import { defineConfig } from "prisma/config";

/**
 * Prisma 7+ moved datasource URLs out of `schema.prisma` and into this config
 * file. See https://pris.ly/d/prisma7-client-config.
 *
 * - `datasource.url` is the migration / introspection URL.
 *   For Supabase, point this at the direct connection (port 5432) so that
 *   `prisma migrate` can run DDL through the schema engine.
 * - At runtime, `new PrismaClient()` reads `DATABASE_URL` from env directly.
 *   For Supabase + pgbouncer, the runtime URL is typically the pooler URL
 *   (port 6543) with `?pgbouncer=true&connection_limit=1`.
 *
 * Set both URLs in `.env.local`:
 *   DATABASE_URL  → pooler URL (runtime)
 *   DIRECT_URL    → direct URL (migrations)
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
