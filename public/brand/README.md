# Brand assets

> **All files in this folder are temporary placeholders.** Replace
> them with the final assets supplied by the design team before
> shipping to production.

## Required assets

| File | Dimensions | Format | Used by |
| --- | --- | --- | --- |
| `logo.svg` | 240×64 (scalable) | SVG | Header (public site + admin) |
| `logo-mark.svg` | 64×64 (scalable) | SVG | Mobile header, admin sidebar collapsed |
| `logo-light.svg` | 240×64 | SVG | Logo for dark backgrounds (footer, OG) |
| `favicon.svg` | 32×32 | SVG | Browser tab |
| `favicon.ico` | 32×32 (multi-size) | ICO | Legacy browser tab — copy to `/app/favicon.ico` |
| `apple-touch-icon.png` | 180×180 | PNG | iOS home screen |
| `icon-192.png` | 192×192 | PNG | Android home screen (PWA manifest) |
| `icon-512.png` | 512×512 | PNG | Android splash (PWA manifest) |
| `og-default.svg` | 1200×630 | SVG → exported PNG | Social media share preview (default) |
| `og-default.png` | 1200×630 | PNG | OG image rendered at `<head>` |

The brief specifies the logo concept: **a house silhouette with a
jasmine flower, in a turquoise gradient** (from `--brand-teal`
`#0E5A6B` to `--brand-turquoise` `#4FB8C4`).

## Conventions

- SVG colors use brand tokens directly (`#0E5A6B`, `#4FB8C4`,
  `#FAF7F2`, `#1F2A2E`). They are NOT exposed as CSS variables in
  the SVG, on purpose — the SVG is the brand asset, not a generic
  graphic, so it carries its own colors.
- Each SVG declares `role="img"` and `aria-label="Diar Yasmine"`
  for accessibility.
- Filenames are kebab-case.

## How to update without breaking the app

1. Replace the file in-place (keep the filename).
2. Re-export at the documented dimensions.
3. Optimize with `svgo` if it's an SVG.
4. Run `npm run build` to confirm the OG image still renders.

No code changes are required — components reference these assets
by path only (`/brand/logo.svg`).
