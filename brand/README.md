# Steadel Brand Pack

Tone: calm, precise, trustworthy — "steady". No exclamation marks, no hype.

## Strategy (brandkit method)

- **Category:** commerce operations infrastructure (trust-heavy)
- **Audience:** EU e-commerce founders & operators
- **Emotional promise:** calm control — nothing slips while you're away
- **Symbolic metaphor:** *level lines* — the visual language of steadiness
- **Avoid:** hype, neon gradients, exaggeration, mascot cuteness

## Logo

- `logo-mark.svg` — square icon (favicon, app icons, avatars)
- `logo-horizontal-dark.svg` — for dark backgrounds (ink navy)
- `logo-horizontal-light.svg` — for light backgrounds (paper)
- **Construction:** a geometric "S" built from three horizontal *level*
  strokes joined by tight quarter-turns — monogram + meaning (steady/level
  + stacked stock). Single continuous stroke, round caps, 6/64 weight on a
  14/64-radius ink tile.
- Wordmark: lowercase `steadel` in Fraunces SemiBold + amber period.
- Clear space: ½ mark height on all sides. Don't recolor, outline or rotate.

## Motion

One easing everywhere: `cubic-bezier(.22,1,.36,1)` (slow-out). Reveals
≤700ms with ≤180ms stagger; hovers ≤300ms, ≤3px travel. Respect
`prefers-reduced-motion`. Never exaggerate (animation principle 10 is
off-brand); lean on 6 (slow in/out), 9 (timing), 12 (appeal).

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
