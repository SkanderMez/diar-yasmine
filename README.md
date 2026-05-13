# Diar Yasmine — Tazarka Plage

Unified public booking website + internal Property Management
System (PMS) for **Diar Yasmine Tazarka Plage**, a 21-unit
seaside rental property in Tazarka, Cap Bon, Tunisia.

> Public site and PMS are a single Next.js application sharing
> one database. A reservation taken at the front desk appears
> instantly on the website calendar, and vice versa.

## Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript strict
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix) + Framer Motion
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Auth**: Auth.js v5 (staff) + custom session (customers)
- **State**: TanStack Query (server) + Zustand (UI)
- **Forms / validation**: react-hook-form + zod (shared schemas)
- **i18n**: next-intl (FR default, EN, AR with RTL)
- **Email**: Resend + React Email
- **SMS / WhatsApp**: Twilio
- **Payments**: Stripe (+ Flouci & Konnect later for Tunisia)
- **PDF**: @react-pdf/renderer (vouchers) + qrcode
- **Observability**: Sentry + Pino (structured logs)
- **Testing**: Vitest (unit / integration) + Playwright (E2E) + axe-core

See [`/docs/architecture.md`](./docs/architecture.md) for the full
architecture overview.

## Prerequisites

- **Node.js 22 LTS** (pinned via `.nvmrc`, run `nvm use`)
- **npm** (10+, bundled with Node)
- **Supabase project** (free tier OK for dev)
- Optional for full local dev: Resend / Twilio / Stripe accounts
  in test mode

## Quick start

```bash
nvm use                    # pick Node 22
npm install
cp .env.example .env.local # then fill in the values
npm run db:migrate         # apply Prisma migrations to Supabase
npm run db:seed            # seed 21 properties + admin user
npm run dev                # http://localhost:3000
```

## Environment variables

See [`.env.example`](./.env.example) for the full list with
inline comments. Key variables:

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Prisma (runtime) | Supabase pooler connection (port 6543) |
| `DIRECT_URL` | Prisma (migrate) | Supabase direct connection (port 5432) |
| `AUTH_SECRET` | Auth.js | Generate via `openssl rand -base64 32` |
| `RESEND_API_KEY` | Email | Required for booking confirmation emails |
| `TWILIO_*` | SMS / WhatsApp | Required for vouchers without email |
| `STRIPE_*` | Payments | Public-side card payments |
| `SENTRY_DSN` | Errors | Optional in dev, required in prod |
| `UPSTASH_REDIS_*` | Rate limiting | Optional in dev |

Validation is enforced at boot via `@t3-oss/env-nextjs` — the
app refuses to start if a required variable is missing or malformed.

## Scripts

```
npm run dev          Run dev server with Turbopack
npm run build        Production build
npm run start        Run production build
npm run lint         ESLint
npm run typecheck    tsc --noEmit
npm run test         Vitest (unit + integration)
npm run test:e2e     Playwright
npm run db:migrate   Apply Prisma migrations
npm run db:seed      Seed 21 properties
npm run db:studio    Prisma Studio
```

## Project structure

```
app/
  [locale]/
    (public)/        # diaryasmine.tn — booking, listings, etc.
    (admin)/         # PMS dashboard
  api/               # Route handlers (Server)
components/
  ui/                # shadcn primitives — pure presentation
  shared/            # header, footer, language switcher
  public/            # hero, property-card, booking-widget
  admin/             # calendar, quick-book, voucher-preview
lib/
  schemas/           # shared zod schemas
  pricing/           # pricing engine
  availability/      # availability + double-booking checks
  voucher/           # PDF generation
  settings/          # typed Setting registry
  money.ts           # millimes / format helpers
  date.ts            # Africa/Tunis helpers
  prisma.ts          # Prisma singleton
  auth.ts            # Auth.js config
  env.ts             # zod-validated env vars
prisma/
  schema.prisma
  migrations/
  seed.ts
messages/
  fr.json, en.json, ar.json
public/brand/        # logos, favicons, OG images
docs/
  architecture.md
  redesign.md
  pms-walkthrough.md
  adr/               # architectural decision records
```

See `CLAUDE.md` for the project-specific conventions.

## Email deliverability

The transactional domain is `mail.diaryasmine.tn`. SPF/DKIM/DMARC
records must be configured at the registrar — see
[`/docs/architecture.md`](./docs/architecture.md) for the exact
records.

## Deployment

- **Hosting**: Vercel (Node runtime, not Edge — Auth.js Prisma
  adapter requires Node)
- **Database**: Supabase (managed Postgres)
- **CRON jobs**: Vercel Cron (`/api/cron/sync-channels`)
- **Object storage**: Supabase Storage (photos, voucher PDFs)
- **Custom domain**: diaryasmine.tn

The production deployment pipeline is described in
[`/docs/architecture.md`](./docs/architecture.md).

## Troubleshooting

- **`prisma migrate dev` fails with "no schema found"** — make
  sure `DATABASE_URL` points at the Supabase **pooler** (port
  6543) and `DIRECT_URL` at the direct connection (port 5432).
- **`btree_gist` extension missing** — run the initial migration
  manually; it issues `CREATE EXTENSION IF NOT EXISTS btree_gist;`
  before the EXCLUDE constraint.
- **Auth.js redirect loop** — check `AUTH_URL` matches your
  current origin (no trailing slash).
- **Turbopack crash** — clear `.next/` and rerun.

## License

Proprietary. Copyright © Diar Yasmine. All rights reserved.
