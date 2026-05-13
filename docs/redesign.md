# Re-design playbook

Goal: swap the visual design (Figma → production) without touching
business logic. This is feasible because we keep a hard boundary
between **presentation** (tokens + UI primitives) and **logic**
(`lib/` + `app/`).

## The three layers

1. **Tokens** — `app/globals.css` only.
   - `:root` holds raw brand colors, semantic mappings (`--primary`,
     `--secondary`, ...), reservation-source colors, radii, and
     `--radius` base.
   - `@theme inline { ... }` exposes them as Tailwind utilities
     (`bg-primary`, `text-card-foreground`, `rounded-md`, etc.).
2. **UI primitives** — `components/ui/*` (shadcn).
   - Pure presentation, no business logic.
   - Consume Tailwind utilities only.
3. **Feature components** — `components/{shared, public, admin}/*`.
   - Compose `ui/*` + read from `lib/*`.
   - Layout, hierarchy, copy through `next-intl`.

## How to swap the design

### 1. Update tokens
Edit `app/globals.css`:

```css
:root {
  --brand-teal: #yourcolor;       /* new primary */
  --brand-turquoise: #yourcolor;  /* new primary-light */
  --brand-sand: #yourcolor;       /* new secondary background */
  /* ... */
  --radius: 1rem;                 /* if rounded corners change */
}
```

The shadcn semantic mappings (`--primary`, `--secondary`, etc.) still
point at the brand vars, so all `bg-primary`, `text-secondary-foreground`,
etc. follow automatically.

### 2. Update fonts (if changing)
In `app/[locale]/layout.tsx`, swap the `next/font` imports and the
`--font-*` CSS variables they expose. globals.css consumes them via
`@theme inline { --font-heading: var(--font-fraunces); ... }` — keep
the variable names if you can; otherwise update both ends.

### 3. Replace logo and brand assets
Drop the new SVGs/PNGs into `public/brand/` keeping the **same
filenames** (`logo.svg`, `logo-mark.svg`, `favicon.svg`, …). No code
changes required — `<Logo />` references them by path.

### 4. Tweak primitives if the design requires structural change
Some Figma designs require structural changes that go beyond
tokens (e.g. a button with an underline animation). For those:
- Edit `components/ui/<primitive>.tsx`.
- Do NOT introduce business logic — keep them purely presentational.
- Test downstream feature components still compose correctly.

### 5. Update copy if needed
- Strings come from `messages/{fr,en,ar}.json`. Update there.
- Never hardcode user-facing text in components.

### 6. Verify
- `npm run typecheck && npm run lint && npm test && npm run build`
- Manual: home, list, fiche, tunnel, calendar, Quick Book, voucher.
- Lighthouse: confirm the public site still scores > 90.
- Axe: confirm WCAG 2.1 AA still passes.

## What you must NOT do during a re-design

- Don't add business logic to `components/ui/*`. Use `components/
  {shared,public,admin}` for composition.
- Don't introduce raw `#hex` colors in components — go through
  `globals.css` tokens.
- Don't change the data flow (Server vs Client Components, Server
  Actions, Suspense boundaries) for visual reasons.
- Don't bypass `lib/money` or `lib/date` helpers for "format
  reasons" — extend the helpers instead.

## What is safe to change

- All colors, fonts, radii, shadows.
- The structure of `components/ui/*` primitives.
- The structure of `components/{shared,public,admin}/*` so long as
  the data props remain the same.
- Copy and translations.
- Logos, favicons, OG images.
- Tailwind utility classes in templates.

## Token reference

See `app/globals.css` for the source of truth. The semantic names
shadcn relies on (do not rename):

| Token | Use |
| --- | --- |
| `--background` / `--foreground` | Page body |
| `--card` / `--card-foreground` | Cards |
| `--popover` / `--popover-foreground` | Dropdowns, popovers |
| `--primary` / `--primary-foreground` | CTAs, branding |
| `--secondary` / `--secondary-foreground` | Soft surfaces |
| `--muted` / `--muted-foreground` | Disabled / subtle |
| `--accent` / `--accent-foreground` | Hover states |
| `--destructive` / `--destructive-foreground` | Errors, danger |
| `--border` / `--input` | Outlines |
| `--ring` | Focus rings |
| `--radius` | Base corner radius |

Brand extras (DY-specific, safe to rename if also updating call sites):

`--color-primary-light`, `--color-sand`, `--color-ivory`,
`--color-charcoal`, `--color-bougainvillier`, `--color-olive`,
`--color-success`, `--color-warning`, `--color-danger`.

Reservation source palette (calendar): `--color-source-direct-web`,
`--color-source-walk-in`, `--color-source-phone`,
`--color-source-booking`, `--color-source-airbnb`,
`--color-source-expedia`, `--color-source-partner`,
`--color-source-other`.
