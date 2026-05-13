# Diar Yasmine — Project Context for Claude Code

This file is loaded automatically at the start of every Claude
Code session. Keep it concise but complete.

## What we're building
Unified web application for Diar Yasmine Tazarka Plage:
- Public booking website (diaryasmine.tn)
- Internal PMS (Property Management System)
- 21 rentals: 9 Chalets (beachfront, all with private pool) +
  12 Bungalows (7 min from beach, most with private pool)
- Heavy walk-in and phone reservations (optimize for speed)
- Integrations with Booking, Airbnb, Expedia (iCal first)

## Core principle: Unified app
The public site is the booking front-end of the PMS, NOT a
separate product. Same DB, same models, same code.

## Stack
Next.js 16 (App Router) + TypeScript strict + Tailwind v4 +
shadcn/ui + Prisma + Postgres (Supabase) + Auth.js v5 +
TanStack Query + Zustand + react-hook-form + zod + next-intl +
Resend + Twilio + Stripe + Sentry + Pino.

> Note: brief specified Next.js 15 but `create-next-app` installed
> 16.2.6 (same App Router paradigm, latest fixes). See
> `Next.js 16 specifics` section below for what differs from
> Next 15 training data.

## Package manager
**npm** (pnpm/corepack unavailable on the bootstrap machine).
Node 22 LTS pinned via `.nvmrc`.

## Non-negotiable rules
1. Money: ALWAYS in Int (millimes for TND). Use /lib/money.ts.
   Never Float. Never Number arithmetic without the helpers.
2. Dates: DB in UTC (timestamptz), logic in "Africa/Tunis"
   timezone. Use /lib/date.ts helpers.
3. Double-booking prevention: DB EXCLUDE constraint + transactions.
4. Design tokens: tailwind.config.ts + globals.css ONLY.
   No hardcoded colors/sizes in components.
5. /components/ui = pure presentation. /lib = pure logic.
   Never mix.
6. Server Components by default. "use client" only for real
   interactivity.
7. Every view: explicit Loading/Empty/Error states.
8. Zod schemas in /lib/schemas shared client + server.
9. Audit log on every mutation (Reservation, Payment, Property,
   Guest).
10. RBAC checked server-side on every Server Action / API route.

## File structure
See /docs/architecture.md for diagram.
- app/[locale]/(public)/* — public site
- app/[locale]/(admin)/* — PMS dashboard
- app/api/* — API routes
- components/ui/* — pure shadcn components
- components/{shared,public,admin}/* — feature components
- lib/* — pure business logic
- lib/schemas/* — shared zod schemas
- prisma/* — schema, migrations, seed
- messages/{fr,en,ar}.json — i18n
- docs/* — architecture, redesign guide, walkthrough, ADRs

## Domain glossary
See /GLOSSARY.md (chalet vs bungalow, voucher, walk-in, ADR/RevPAR,
channel manager, source, etc.)

## Reservation sources
DIRECT_WEB, WALK_IN, PHONE, PARTNER, BOOKING, AIRBNB, EXPEDIA,
OTHER. Color-coded in calendar.

## User roles
ADMIN, MANAGER, RECEPTION (limited), VIEWER (read-only).
**Staff only.** Customers are stored in the `Guest` table, never
in `User`. See "Auth model" below.

## Auth model (User vs Guest)
Two separate tables, intentionally:

### `User` — staff only
- Roles: ADMIN, MANAGER, RECEPTION, VIEWER.
- Created on invitation by an admin (no self-signup).
- Never linked to a `Reservation` directly.
- Auth.js with Credentials provider.

### `Guest` — customers (account-upgradeable)
- Required: `firstName`, `lastName`, `phone` (unique).
- Optional: `email` (unique when present via partial index),
  `whatsapp`, `country`, `idDocument`, `notes`.
- Auth fields, all nullable until the guest creates an account:
  `hashedPassword`, `emailVerifiedAt`, `phoneVerifiedAt`,
  `accountCreatedAt`, `lastLoginAt`.
- Created instantly during any reservation (Quick Book, public
  funnel) without password.
- `Reservation.guestId` always points to a `Guest`.

### Guest → account upgrade flow (Phase 3/4)
1. Visitor enters email + phone + password on the public site.
2. Lookup existing `Guest` by phone (priority) OR email.
3. Match → send OTP via SMS to the registered phone.
4. OTP validated → set `hashedPassword`, `accountCreatedAt`,
   `phoneVerifiedAt`. Past reservations now appear in history.
5. No match → create a new `Guest` with password directly +
   send email verification link.

### Conflict resolution
Admin `/admin/guests/[id]` with a "Merge with…" action. Reservations
migrate, audit log written, source `Guest` soft-deleted.

### Hard separation
- Staff endpoints (Auth.js) and customer endpoints (custom) are
  **distinct routes** with **distinct session cookies**.
- The admin middleware (proxy) checks `User` only.
- The customer middleware checks `Guest.hashedPassword`.
- Aggressive rate limiting on the customer-login endpoint.

## Settings (TAX_RATE and others)
- Single `Setting` table: `{ key (unique), value (Json), updatedBy,
  updatedAt }`.
- `/lib/settings/registry.ts` defines every allowed key + zod
  schema (e.g., `tax.rate` → `z.number().min(0).max(1)`).
- Accessor `getSetting<K>(key)` validates at read time and throws
  if the stored value is corrupt.
- Writes via `setSetting()` validate first.
- Free-form keys are rejected. Only registry keys are stored.
- Only ADMIN can edit `tax.rate` via /admin/settings (Phase 2/4).

## Next.js 16 specifics (vs your training on Next 15)
Read this carefully — Next 16 has breaking changes:

1. **`params` and `searchParams` are Promises.** Always `await`
   them in pages/layouts/route handlers.
   `const { slug } = await params` — never `params.slug`.
2. **`cookies()` and `headers()` are async.** `await cookies()`,
   `await headers()`.
3. **Middleware renamed to Proxy.** File is `proxy.ts` (not
   `middleware.ts`), export `proxy` function (not `middleware`).
   **No edge runtime** — runs on Node.js.
4. **`fetch()` is uncached by default.** Opt in with
   `cache: 'force-cache'` or segment `fetchCache = 'default-cache'`.
5. **`revalidateTag(tag)` requires a second arg** (cache profile),
   e.g. `revalidateTag('reservations', 'max')`. For immediate
   refresh, use `updateTag(tag)`.
6. **`images.domains` is removed.** Use `images.remotePatterns`
   (already configured in `next.config.ts`).
7. **Parallel routes require `default.js`** in every slot.
8. **`unstable_cacheLife` / `unstable_cacheTag` → `cacheLife` /
   `cacheTag`** (stabilized, drop the prefix).
9. **PPR config:** `cacheComponents: true` instead of
   `experimental.ppr`.

When in doubt, read `node_modules/next/dist/docs/` rather than
relying on training data.

## Workflow
- Conventional Commits in English.
- Branches: main (prod), dev (integration), feat/*, fix/*.
- PRs < 400 lines when possible.
- Definition of Done: see prompt or /docs/dod.md.
- Communicate in French with the user, code in English.

## Things NOT to do
- Don't write money in Float.
- Don't bypass /lib helpers for date/money.
- Don't hardcode design values.
- Don't put business logic in /components/ui.
- Don't add features beyond what was requested.
- Don't add comments unless WHY is non-obvious.
- Don't skip Loading/Empty/Error states.
- Don't run destructive Git commands without asking.
- Don't write to free-form Setting keys (use the registry).
- Don't put customers in the `User` table.
- Don't sync-access `params`, `searchParams`, `cookies()`,
  `headers()` — they're all Promises in Next 16.

## Current phase
**Phase 1 — Fondations (in progress)**

## Recent architectural decisions
- 2026-05-13 — Use Setting key/value JSON table with a typed
  registry (`/lib/settings/registry.ts`) instead of a free-form
  store or dedicated tables per feature.
- 2026-05-13 — Split staff (`User`) and customers (`Guest`)
  into two tables. Guests are "passive" until they upgrade to
  an account; auth fields live on `Guest` itself, nullable.
- 2026-05-13 — Customer login uses a custom endpoint with a
  separate session cookie, not Auth.js. Auth.js is staff-only.
- 2026-05-13 — Run on npm + Node 22 LTS. Continue on Next.js
  16.2.6 (auto-installed; same App Router paradigm).
- 2026-05-13 — Supabase project provisioned (rtxgnvpyifoegccoljse,
  eu-west-3, free tier). Direct connection is IPv6-only on free tier;
  DIRECT_URL uses the Session pooler on port 5432 instead.
- 2026-05-13 — Supabase API key migration: use the new
  `sb_publishable_*` / `sb_secret_*` format (replaces anon /
  service_role JWTs).
- 2026-05-13 — Tunisian VAT confirmed at 19%. Seeded as
  `Setting.tax.rate = 0.19`.
- 2026-05-13 — Brand colors sampled from the official logo SVGs:
  `--brand-teal: #006378`, `--brand-turquoise: #1d98a8` (replaces
  the earlier estimates).

(Append new decisions here as ADRs land in /docs/adr/*.)

## Active TODOs (project-level, not code-level)
- [ ] Confirmer les 3 derniers noms de bungalows (9 confirmés : Amber,
      Bougainvillier, Géranium, Lavande, Néroli, Orchidée, Tulipe,
      Rose, Valeria. 3 placeholders restants : TBD-1..3)
- [ ] Obtenir credentials Booking API
- [ ] Configurer domaine mail.diaryasmine.tn (SPF/DKIM/DMARC)
- [ ] Setup Stripe + Flouci/Konnect en TND
- [x] Provisionner Supabase project (rtxgnvpyifoegccoljse, eu-west-3)
- [ ] Provisionner Vercel project
- [x] Fournir les vrais SVG du logo
- [x] Décider du taux de TVA initial — 19% (Tunisian VAT)

## Useful commands
```
npm run dev          — local dev (Turbopack)
npm run build        — production build
npm run start        — run production build
npm run lint         — eslint
npm run typecheck    — tsc --noEmit
npm run test         — vitest (unit + integration)
npm run test:e2e     — Playwright
npm run db:migrate   — apply Prisma migrations
npm run db:seed      — seed 21 properties
npm run db:studio    — Prisma Studio
```
