# Steadel Brand Pack

Tone: calm, precise, trustworthy — "steady". No exclamation marks, no hype.

## Logo

- `logo-mark.svg` — square icon (favicon, app icons, avatars)
- `logo-horizontal-dark.svg` — for dark backgrounds (ink navy)
- `logo-horizontal-light.svg` — for light backgrounds (paper)
- The mark is a single amber "S" stroke — one continuous, steady line.
- Wordmark: lowercase `steadel` in Fraunces SemiBold + amber period.
- Clear space: ½ mark height on all sides. Don't recolor, outline or rotate.

## Colors

| Token | Hex | Use |
|---|---|---|
| Ink navy | `#0f1b2d` | dark surfaces, text on light |
| Panel | `#16263d` | dark cards/panels |
| Warm paper | `#f5f1e8` | light surfaces, text on dark |
| Mist | `#b9c2cf` | muted text on dark |
| Ink soft | `#47576e` | muted text on light |
| Amber | `#f0a830` | accent, primary actions |
| Amber dark | `#d18f1c` | accent hover / accent on light |

## Typography

- Headings: **Fraunces** (600)
- Body/UI: **Inter** (400–600)
- Labels/code: **IBM Plex Mono** — uppercase, letter-spaced

Fonts are always self-hosted (GDPR: no Google Fonts CDN).

## Generated assets

`pnpm tsx brand/generate.ts` renders PNG exports (Shopify app icon
1200×1200, OG image 1200×630) into `brand/dist/`.
