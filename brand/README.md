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

## Colors — Emerald Ink + Champagne (two-tone)

| Token | Hex | Use |
|---|---|---|
| Emerald Ink | `#064E3B` | dark surfaces, text on light, primary accent on light |
| Emerald panel | `#0A5A45` | elevated emerald cards/panels |
| Champagne | `#F8E7C9` | light surfaces, text on dark, accent on dark |
| Champagne deep | `#F1DBB4` | sidebar / elevated light surface, chart tracks |
| Champagne hover | `#EFDCB6` | champagne button hover (on dark) |
| Sage mist | `#C3D6CD` | muted text on emerald |
| Emerald soft | `#3F6053` | muted text on champagne |
| Line (light) | `#E6D4AE` | borders on champagne |
| Line (dark) | `#1C6B55` | borders on emerald |

Two-tone rule: on **champagne** surfaces the accent/CTA is **Emerald Ink**
(emerald button + champagne text); on **emerald** surfaces it inverts to
**Champagne** (champagne button + emerald text). No third accent colour.
All text pairs pass WCAG AA (anchor contrast 7.99:1).


## Typography

- Headings: **Fraunces** (600)
- Body/UI: **Inter** (400–600)
- Labels/code: **IBM Plex Mono** — uppercase, letter-spaced

Fonts are always self-hosted (GDPR: no Google Fonts CDN).

## Generated assets

`pnpm tsx brand/generate.ts` renders PNG exports (Shopify app icon
1200×1200, OG image 1200×630) into `brand/dist/`.
