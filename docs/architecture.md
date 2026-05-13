# Architecture — Diar Yasmine

## High-level diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       diaryasmine.tn (Vercel)                    │
│                                                                  │
│  ┌─────────────────────┐   ┌─────────────────────────────────┐   │
│  │   Public surface    │   │       PMS (admin surface)       │   │
│  │  /[locale]/(public) │   │     /[locale]/admin/*           │   │
│  │  hero, listings,    │   │  Calendar, Quick Book, ...      │   │
│  │  fiches, tunnel     │   │  RBAC: ADMIN/MANAGER/RECEPTION  │   │
│  └──────────┬──────────┘   └────────────┬────────────────────┘   │
│             │                            │                       │
│             └─────────────┬──────────────┘                       │
│                           │ Server Actions / Route Handlers      │
│                           ▼                                      │
│                ┌─────────────────────────┐                       │
│                │  lib/* (pure logic)     │                       │
│                │  pricing, availability, │                       │
│                │  money, date, settings  │                       │
│                └────────┬────────────────┘                       │
│                         │ Prisma client (pg adapter)             │
└─────────────────────────┼────────────────────────────────────────┘
                          ▼
            ┌─────────────────────────────┐
            │  Postgres (Supabase)        │
            │  - btree_gist EXCLUDE on    │
            │    Reservation (no-overlap) │
            │  - timestamptz everywhere   │
            └─────────────────────────────┘

External integrations (Phase 2+):
  • Resend (transactional email)   • Twilio (SMS, WhatsApp)
  • Stripe + Flouci + Konnect      • Booking/Airbnb/Expedia (iCal)
  • Sentry (errors)                • Upstash Redis (rate limiting)
```

## Layers

### 1. Routes (`app/`)
- `app/layout.tsx` — pass-through root.
- `app/[locale]/layout.tsx` — html/body, fonts, NextIntlClientProvider.
- `app/[locale]/(public)/*` — public site (route group hides the
  segment from the URL).
- `app/[locale]/admin/*` — PMS dashboard. Real path segment so the
  proxy can match `/[locale]/admin/*`.
- `app/[locale]/signin/page.tsx` — staff sign-in (no header/footer).
- `app/api/*` — route handlers (auth, health, future webhooks).

### 2. Components (`components/`)
- `ui/` — shadcn primitives. **Pure presentation. No business logic.**
- `shared/` — Header, Footer, Logo, LanguageSwitcher. Compose `ui`.
- `public/` — Hero, PropertyCard, BookingWidget (Phase 3).
- `admin/` — Sidebar, Topbar (Phase 1); Calendar, QuickBook, KPI
  cards (Phase 2).

### 3. Libraries (`lib/`)
- `lib/prisma.ts` — singleton client with the `@prisma/adapter-pg`
  driver adapter required by Prisma 7's client engine.
- `lib/env.ts` — `@t3-oss/env-nextjs` schema. Boot fails if a
  required variable is missing.
- `lib/money.ts` — `Millimes` type alias, conversions, formatting,
  Int assertions. **Never use Float anywhere downstream.**
- `lib/date.ts` — Africa/Tunis helpers; half-open `rangeOverlaps`
  matching the DB EXCLUDE constraint.
- `lib/settings/` — typed key/value Setting registry.
- `lib/schemas/` — Zod schemas shared client + server (Phase 2+).
- `lib/pricing/`, `lib/availability/`, `lib/voucher/` — Phase 2.

### 4. Auth (`auth.ts`, `proxy.ts`)
- `auth.ts` — NextAuth v5 staff configuration (Credentials, JWT,
  24h TTL). Customers use a separate flow (Phase 3/4).
- `proxy.ts` — Next.js 16 proxy (replaces `middleware.ts`). Composes
  Auth.js admin route protection with next-intl locale routing.

### 5. Database (`prisma/`)
- `schema.prisma` — full model + indexes.
- `migrations/<timestamp>_init/` — base SQL from `prisma migrate diff`.
- `migrations/<timestamp>_double_booking_constraint/` — `btree_gist`
  extension + EXCLUDE GIST constraint on `Reservation`.
- `seed.ts` — 21 properties, 14 amenities, admin user, default
  settings.

## Critical invariants

1. **Money is Int millimes.** No Float arithmetic. All math through
   `lib/money.ts`.
2. **Dates are timestamptz in UTC** (Postgres) and **Africa/Tunis**
   in business logic. All conversions through `lib/date.ts`.
3. **Double-booking is impossible at the DB level**, regardless of
   what application code does, thanks to the EXCLUDE GIST constraint.
4. **Customers are not users.** `Guest` and `User` are separate tables
   with separate auth surfaces.
5. **Settings are typed.** Free-form Setting keys are rejected by
   `lib/settings/`.
6. **Every mutation writes an `AuditLog` row.**
7. **RBAC is server-side.** Proxy + layout + Server Action all
   re-check role.

## DNS / email deliverability

- Domain: `diaryasmine.tn` (apex + `www`).
- Transactional sender: `noreply@mail.diaryasmine.tn`.
- Required DNS records (set at the registrar):
  - SPF: `v=spf1 include:resend.com -all` on `mail.diaryasmine.tn`.
  - DKIM: provided by Resend, two CNAME records.
  - DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@diaryasmine.tn`.

## Deployment

- **Hosting**: Vercel, Node runtime (Auth.js Prisma flow requires
  Node, not Edge).
- **Database**: Supabase Postgres. `DATABASE_URL` points at the
  pooler (port 6543, `?pgbouncer=true&connection_limit=1`).
  `DIRECT_URL` points at the direct connection (port 5432) for
  migrations.
- **Storage**: Supabase Storage for photos + voucher PDFs.
- **Cron**: Vercel Cron (Phase 5) hits `/api/cron/sync-channels`.

## ADRs

See [`/docs/adr/`](./adr/). Each architectural decision lives there
once made.
