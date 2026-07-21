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
| 6 | **Brand identity** — brandkit-skill redesign: level-line S mark, strategy+motion guide, all assets | Claude | ✅ v2 2026-07-13 |
| 7 | **Shopify app icon** — new level-line mark uploaded to dev dashboard | Sercan | ✅ 2026-07-13 |
| 8 | **UI/UX polish pass** — responsive shell + drawer nav, active nav state, brand mark + favicon, empty states, onboarding progress bar, motion, focus rings; error tone audited (already good) | Claude | ✅ 2026-07-13 |
| 9 | **Contrast audit** — all token pairs computed; amber-dark links failed AA (2.4:1) → new amber-text token (5.3:1) | Claude | ✅ 2026-07-13 |
| 10 | user-guide screenshots — real WooCommerce REST-API + key-create screens captured, embedded via /docs-images | Claude | ✅ 2026-07-20 |

| 10b | **Landing i18n** — EN/DE/FR/ES/IT/NL, browser-language auto-detect + switcher | Claude | ✅ live 2026-07-13 |
| 10c | **Landing motion & editorial pass** — scroll reveals, micro-interactions, numbered labels, grain | Claude | ✅ live 2026-07-13 |

## P2 — Operations & growth

| # | Task | Owner | Status |
|---|---|---|---|
| 11 | **Meta app application** — Marketing API access review | Sercan | ⏸ deferred 2026-07-20 (blocked: Facebook developer-account access issue). NOT on critical path — ads guard runs on MockMetaProvider/Beta; alerts + reports work without it. Revisit post-launch. |
| 12 | Uptime Kuma: 4 monitors (app/landing/pg/redis), Brevo email alerts, public status page at status.steadel.com | Both | ✅ 2026-07-19 |
| 13 | WooCommerce e2e — real store (WP+Woo on server), REST sync of 5 products, tracked→rule→stock change→low_stock+out_of_stock emails verified in inbox | Claude | ✅ 2026-07-20 |
| 14 | Storage Box offsite backup (script already supports BACKUP_SCP_TARGET) | Sercan decision | ⏸ deferred |
| 13b | **TEARDOWN woo-test env** — WP stack + volumes removed, Caddy route reverted to repo, Steadel test store deleted. Only leftover: Cloudflare `woo-test` A record (Sercan to delete). | Both | ✅ 2026-07-22 (DNS record pending) |

| R2 | **Entitlement gate** — automations (sync/alerts/ads-guard/reports) now suspend when trial expires or subscription is canceled (terms §4); reads/export never blocked. Was a revenue leak: lapsed orgs ran free. Live-verified. | Claude | ✅ 2026-07-22 |
| R1 | **Pre-launch review fixes** — out-of-stock alert gap, atomic webhook idempotency, Shopify uninstall scope; Public API v1 e2e; Reports charts blank in prod (Recharts→inline SVG, CSP) | Claude | ✅ 2026-07-20 |

## P3 — Later

| # | Task | Notes |
|---|---|---|
| 15 | Shopify `read_orders` protected-data approval → sales charts light up | after real merchants |
| 16 | "Steadel" trademark registration | legal, optional |
| 17 | EU-friendly analytics for marketing site only (e.g. Plausible) | app stays analytics-free per spec |
| 18 | Google Ads provider | explicitly v2 in SPEC §5.4 |
