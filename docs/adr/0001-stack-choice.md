# ADR-0001 — Stack choice

- Status: accepted
- Date: 2026-05-13
- Deciders: SkanderMez (client) + Claude

## Context

We're building Diar Yasmine: a unified public booking website + an
internal PMS for 21 seaside rentals in Tazarka, Tunisia. The brief
prioritises:

- Fast walk-in / phone reservation entry.
- One source of truth shared between the public site and the PMS.
- Hard guarantees against double-booking.
- Multilingual (FR default, EN, AR with RTL).
- A future re-design from Figma without rewriting business logic.

## Decision

| Concern | Chosen | Why |
| --- | --- | --- |
| Framework | **Next.js 16 (App Router)** | Server Components by default → less JS shipped, server-only secrets stay server-only. Auto-installed; same paradigm as Next 15. |
| Lang | **TypeScript strict** + `noUncheckedIndexedAccess` | Brief mandate; matches our risk profile (money + dates). |
| Styling | **Tailwind v4 + shadcn/ui (CSS vars)** | Tokens in CSS, components consume utilities — enables a future re-design without touching `lib/`. |
| DB | **PostgreSQL via Supabase** | Auth, storage, and Postgres in one provider; `btree_gist` available; row-level security if we need it later. |
| ORM | **Prisma 7** with `@prisma/adapter-pg` | Type-safe, migration-friendly. Prisma 7 dropped its Rust engines in favour of the TS-native "client" engine; we use the node-postgres adapter required by that engine. |
| Auth | **Auth.js v5 (Credentials + JWT)** for staff; **custom OTP-SMS** for customers (Phase 3/4) | Staff = invite-only, no self-signup. Customers = "passive Guest" → upgradeable account. Two surfaces, two cookies, zero cross-contamination. |
| Server state | **TanStack Query** | Best-in-class request lifecycle + caching. |
| UI state | **Zustand** | Lightweight, no boilerplate. |
| Forms | **react-hook-form + Zod** | Shared schemas client+server, type inference via `z.infer<>`. |
| i18n | **next-intl** | Best Next.js integration; RTL handled cleanly. |
| Money | **Int millimes** (`Millimes` type alias) | Avoids Float pitfalls. All math through `lib/money.ts`. |
| Time | **`Africa/Tunis` via date-fns-tz** | Tunisia is UTC+1 no DST — no spring/fall edge cases. |
| Email | **Resend + React Email** | Modern, react-jsx templates. |
| SMS/WhatsApp | **Twilio** | Brief mandate; supports OTP for the customer auth upgrade. |
| Payments | **Stripe** first; **Flouci/Konnect** later | Stripe for international cards; Flouci/Konnect for Tunisian e-wallets. |
| PDF | **@react-pdf/renderer** | Voucher generation. |
| Observability | **Sentry** + **Pino** | Server errors, structured logs with PII redaction. |
| Tests | **Vitest** (unit/integration) + **Playwright** (E2E) + **axe-core** | Brief mandate. |
| Hosting | **Vercel** (Node runtime) | Auth.js Prisma flow requires Node, not Edge. Native CRON. |
| Package manager | **npm** | corepack/pnpm unavailable on the bootstrap machine; npm is universal. |
| Node version | **22 LTS** | Active maintenance until April 2027. |

## Consequences

### Positive
- Single application, single deploy, single database.
- DB EXCLUDE constraint makes double-booking architecturally impossible.
- A re-design swap touches `tailwind.config` + `components/ui/*` only.
- Strict typing catches money/date bugs at compile time.

### Negative / accepted trade-offs
- **Prisma 7 ergonomics**: connection URLs in `prisma.config.ts`
  (not `schema.prisma`) is new — documented in `prisma.config.ts`.
- **Auth.js v5** is still in beta. We pin a specific beta version
  in package.json and follow the changelog.
- **Vercel cold starts** on `/admin/*` (proxy + Prisma adapter init).
  Mitigated by Vercel Functions warming and lightweight proxy.
- **next-intl + Next 16 root layout dance**: html/body live in
  `[locale]/layout.tsx` and the root layout is a pass-through.
  Documented in `architecture.md`.

## Revisit when

- Auth.js v5 reaches stable → bump pin.
- Supabase ships a Postgres extension preventing the adapter
  pattern → revisit Prisma engine choice.
- The design team delivers final Figma → see `redesign.md`.
