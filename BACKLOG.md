# Steadel — Go-to-Market Backlog

Priority-ordered. Updated 2026-07-13 (landing page live).

## P0 — Critical path to first sale

| # | Task | Owner | Status |
|---|---|---|---|
| 1 | **Paddle live activation** — business verification + payout bank details | Sercan | 🔶 in progress ("Verify your account") |
| 2 | **Paddle live catalog** — products/prices (qty-locked), webhook, payment link via API | Claude | ⬜ waiting on live API key + client token |
| 3 | **Landing page at steadel.com** — hero, features, EU trust, pricing, FAQ; self-hosted fonts (no Google CDN); www→root redirect | Claude | ✅ live 2026-07-13 |
| 4 | **Production switch + real payment test** — PADDLE_ENV=production after approval, one live card test + refund | Both | ⬜ blocked by #1 |
| 5 | Lawyer sign-off (GDPR art. 27 EU rep, liability wording) + accountant confirmation (Paddle e-fatura, KDV exemption, %80 export deduction) | Sercan | ⬜ external |

## P1 — Trust & conversion (strong before first customers)

| # | Task | Owner | Status |
|---|---|---|---|
| 6 | **Brand identity** — logo, favicon, email header logo, OG image (currently text-only wordmark) | Claude (+Sercan approval) | ⬜ |
| 7 | **Shopify app icon** (1200×1200 PNG) — shown on OAuth/consent screen; empty today | Claude | ⬜ needs #6 |
| 8 | **UI/UX polish pass** — empty states, mobile responsiveness sweep, onboarding flow review, error message tone | Claude | ⬜ |
| 9 | **Color/theme consistency audit** — contrast (a11y), light app theme + dark auth theme coherence | Claude | ⬜ |
| 10 | Real screenshots for user-guide.md placeholders + /help | Claude | ⬜ after #8 |

## P2 — Operations & growth

| # | Task | Owner | Status |
|---|---|---|---|
| 11 | **Meta app application** — Marketing API access review (weeks-long; file early, ads guard stays Beta/mock meanwhile) | Both | ⬜ |
| 12 | Uptime Kuma monitors + status.steadel.com DNS record | Both | ⬜ |
| 13 | WooCommerce end-to-end test with a real store (Shopify-grade verification) | Both | ⬜ |
| 14 | Storage Box offsite backup (script already supports BACKUP_SCP_TARGET) | Sercan decision | ⏸ deferred |

## P3 — Later

| # | Task | Notes |
|---|---|---|
| 15 | Shopify `read_orders` protected-data approval → sales charts light up | after real merchants |
| 16 | "Steadel" trademark registration | legal, optional |
| 17 | EU-friendly analytics for marketing site only (e.g. Plausible) | app stays analytics-free per spec |
| 18 | Google Ads provider | explicitly v2 in SPEC §5.4 |
