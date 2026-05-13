# Deploy to Vercel

> Audience: an admin who has the Supabase project + the GitHub repo already
> set up, and wants to ship to production for the first time. Estimated
> time: 30 minutes (most of it is DNS propagation).

## 0. Pre-flight check (local)

```bash
nvm use                 # Node 22 LTS
npm ci
npx prisma generate
SKIP_ENV_VALIDATION=1 npm run typecheck
SKIP_ENV_VALIDATION=1 npm run lint
npm run test:run
SKIP_ENV_VALIDATION=1 npm run build
```

All four must be green. `npm run build` should list every route you
expect (see `/docs/architecture.md`).

## 1. Create the Vercel project

1. Go to [vercel.com/new](https://vercel.com/new), select the GitHub repo
   `SkanderMez/diar-yasmine`.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: leave default (`next build`).
4. Output directory: leave default.
5. Install command: `npm ci && npx prisma generate`.
6. Node version: 22.x (set under "General → Node.js Version" after creation).

## 2. Wire environment variables

In Project Settings → Environment Variables, add the following **for
Production AND Preview**. Pull them from `.env.local` (or generate fresh
ones — note the rotation reminders below).

| Variable | Source / notes |
| --- | --- |
| `DATABASE_URL` | Supabase Transaction pooler (port 6543, `?pgbouncer=true&connection_limit=1`). |
| `DIRECT_URL` | Supabase Session pooler (port 5432, IPv4-friendly on free tier). Used by `prisma migrate deploy`. |
| `AUTH_SECRET` | `openssl rand -base64 32`. **Different** value per environment. |
| `AUTH_URL` | `https://diaryasmine.tn` (or your custom domain). |
| `NEXT_PUBLIC_SITE_URL` | `https://diaryasmine.tn`. |
| `SUPABASE_URL` | Supabase Project URL. |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` from Project Settings → API Keys. **Server-only.** |
| `NEXT_PUBLIC_SUPABASE_URL` | Same project URL, shipped to the browser. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...`. |
| `RESEND_API_KEY` | Production sender key from Resend. Optional until email is wired. |
| `RESEND_FROM_EMAIL` | `Diar Yasmine <noreply@mail.diaryasmine.tn>`. |
| `TWILIO_*` | Optional until SMS is wired. |
| `STRIPE_*` | Optional. Live keys in Production only. |
| `FLOUCI_APP_TOKEN` / `FLOUCI_APP_SECRET` | Optional until Flouci is keyed. |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Sentry project DSN. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional (rate limiting). |
| `CRON_SECRET` | `openssl rand -hex 32`. Required when Vercel Cron is enabled (set in `vercel.json`). |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Optional — for `prisma db seed` runs from a one-off shell. |

> ⚠️ **Never** reuse the local-dev `AUTH_SECRET` or `DATABASE_URL` password
> in Production. Generate fresh values for each environment.

## 3. Run migrations against the production database

Before the first deploy ships traffic, apply the schema to Supabase:

```bash
# Local terminal, .env.local pointing at prod URLs:
npx --yes -p dotenv-cli dotenv -e .env.production.local -- \
  npx prisma migrate deploy
```

Then seed the baseline (admin user + 21 properties + amenities):

```bash
npx --yes -p dotenv-cli dotenv -e .env.production.local -- \
  npx prisma db seed
```

Photos (optional, replace placeholders):

```bash
npx --yes -p dotenv-cli dotenv -e .env.production.local -- \
  npx tsx scripts/seed-photos.ts
```

## 4. Trigger the first deploy

Push to `main` (or click "Deploy" in Vercel). The first build runs
`postinstall → prisma generate → next build`.

After the deploy:

- Hit `https://<vercel-domain>/api/health` → expect `{"status":"ok"}` JSON.
- Hit `/fr` → public home renders with photos.
- Hit `/fr/signin` → sign in with the seeded admin, navigate `/fr/admin/calendar`.

## 5. Custom domain + DNS

In Vercel Project → Settings → Domains:

1. Add `diaryasmine.tn` and `www.diaryasmine.tn`.
2. At the registrar, point an A record (or CNAME) at Vercel's targets
   (Vercel shows the exact values).
3. Wait for DNS propagation (usually < 1h, can be 24h).
4. Confirm SSL provisions automatically (Let's Encrypt via Vercel).

Update env vars (`NEXT_PUBLIC_SITE_URL`, `AUTH_URL`) to the canonical
domain, then redeploy.

## 6. Email deliverability (`mail.diaryasmine.tn`)

Once Resend is set up, add three records at the registrar:

```text
mail.diaryasmine.tn   TXT  "v=spf1 include:resend.com -all"
<resend>._domainkey.mail.diaryasmine.tn   CNAME  <provided by Resend>
_dmarc.diaryasmine.tn TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@diaryasmine.tn"
```

Resend's domain dashboard verifies SPF/DKIM automatically. Wait until both
are green before flipping the booking-confirmation email switch.

## 7. Vercel Cron (channel sync)

`vercel.json` already declares the schedule:

```json
{ "crons": [{ "path": "/api/cron/sync-channels", "schedule": "*/15 * * * *" }] }
```

After the first deploy, set the `CRON_SECRET` env var, then Vercel calls
`/api/cron/sync-channels` every 15 min with `Authorization: Bearer
${CRON_SECRET}`. Confirm in the Cron tab that the most recent run is
green.

## 8. Sentry

Once the Sentry DSN is set, `instrumentation.ts` initialises the SDK
automatically on both the Node and Edge runtimes. Sentry → Issues
should start populating on the first uncaught error. Phase 8 (post-launch
hardening) will wire source-map upload via the Sentry CLI in CI.

## 9. Branch protection + CI gates

In GitHub → Settings → Branches:

- Require status checks to pass before merging:
  `lint`, `typecheck`, `test`, `build`, `secrets` (gitleaks).
- Require PRs from a non-main branch.
- Require linear history if you prefer.

## Rollback

Vercel deploys are immutable URLs. Promote a previous deploy in
**Project → Deployments → Promote to Production**. Database rollbacks are
manual: use `prisma migrate resolve --rolled-back <migration_name>`
followed by a fix-forward migration.

## Production smoke tests

After every prod deploy, manually check:

- [ ] `/api/health` → `200 ok`
- [ ] `/fr` renders with hero photo
- [ ] `/fr/chalets/albatros` opens, gallery + booking widget visible
- [ ] `/fr/admin` redirects to `/fr/signin` if not authenticated
- [ ] Quick Book (⌘K) creates a test reservation, appears on `/fr/admin/calendar`
- [ ] PDF voucher downloads from `/api/vouchers/<code>`
- [ ] iCal export reachable at `/api/channels/ical/<propertyId>`
- [ ] Sentry receives a test error from `https://<domain>/__sentry-test`
      (or trigger a 500 manually)
