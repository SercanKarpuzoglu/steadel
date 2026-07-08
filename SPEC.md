# Steadel App — Full Development Specification

> **Instructions for Claude Code:** Read this entire document before writing any code.
> Work milestone by milestone (M0 → M6), in order. Do not skip ahead.
> At the end of each milestone: run all tests, update `PROGRESS.md` with what was
> completed and what is pending, and commit with a conventional commit message.
> When a decision is not covered by this spec, choose the simplest option that
> works, document it in `DECISIONS.md`, and continue.

---

## 1. What this product is

**Steadel** is a stock-aware operations automation SaaS for European e-commerce
stores (Shopify and WooCommerce). Its core promise:

1. **Stock-aware ads guard** — when a product sells out, connected ad campaigns
   (Meta, later Google) are paused automatically; when it restocks, they resume.
   No more ad spend on products that can't be bought.
2. **Low-stock alerts** — configurable thresshold alerts via email (and Slack)
   before products run out.
3. **Scheduled reports** — daily/weekly sales & inventory digest via email.

**Positioning:** EU-hosted (Hetzner, Germany), GDPR-first, flat pricing.
All customer-facing copy is in English. The brand tone is calm, precise,
trustworthy ("steady"). Marketing site already exists separately; this spec
covers the **application** (app.steadel.com).

**Business model:** subscription via Paddle (Merchant of Record).
Plans: Starter €29/mo (1 store, 3 automations), Growth €59/mo (3 stores,
unlimited automations), Agency €119/mo (10 stores, white-label reports).
14-day free trial, no credit card required to start.

---

## 2. Non-negotiable constraints

- **EU data residency:** all persistent data stays on the Hetzner server
  (Germany). No US-based analytics or tracking on the app. Transactional email
  provider must offer EU region or be self-hosted SMTP.
- **Written-only support philosophy:** no in-app "book a call" anywhere.
  Support = email + in-app help pages.
- **GDPR:** data minimization; store only what features need. Provide
  account deletion (full erasure) and data export (JSON) self-serve.
- **Solo operator:** everything must be automatable and low-maintenance.
  Prefer boring, proven technology. No microservices.
- **Payments:** Paddle Billing only (owner's company is in Turkey; Paddle is
  the Merchant of Record and handles EU VAT). Never store card data.

---

## 3. Tech stack (fixed — do not substitute)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Single app: marketing-lite pages, auth, dashboard, API routes |
| DB | PostgreSQL 16 | Single instance, Docker |
| ORM | Drizzle | Migrations checked into repo |
| Auth | Auth.js (NextAuth v5), email+password with email verification, optional magic link | No social logins in v1 |
| Jobs/queue | BullMQ + Redis | Stock polling, webhook processing, report generation, email sending |
| Email | Nodemailer over SMTP (env-configured; owner will plug in an EU SMTP provider) | Build a thin `sendMail()` wrapper + MJML or React Email templates |
| Billing | Paddle Billing (checkout overlay + webhooks) | Feature-flag: app must run in "billing disabled" dev mode |
| UI | Tailwind CSS + shadcn/ui | Design tokens below |
| Charts | Recharts | Reports dashboard |
| Deploy | Docker Compose (app, postgres, redis, caddy) on Hetzner Ubuntu 24 | Caddy for TLS |
| CI | GitHub Actions: lint, typecheck, test on PR; build image on main | |
| Monitoring | Self-hosted Uptime Kuma container + pino logs to file with rotation | No external SaaS monitoring |

**Design tokens (match the brand):** background ink-navy `#0f1b2d`, panel
`#16263d`, text warm paper `#f5f1e8`, muted `#b9c2cf`, accent amber `#f0a830`.
Fonts: Fraunces (headings), Inter (body), IBM Plex Mono (labels/code).
The app UI uses a light theme by default (paper background, ink text, amber
accent) with the marketing dark theme reserved for auth screens; keep both
consistent with these tokens.

---

## 4. Data model (Drizzle schema — extend as needed)

```
users            id, email (unique), password_hash, name, email_verified_at,
                 created_at, deleted_at (soft delete)
organizations    id, name, owner_user_id, plan (starter|growth|agency|trial),
                 trial_ends_at, paddle_customer_id, paddle_subscription_id,
                 white_label_name (nullable, agency plan), created_at
org_members      org_id, user_id, role (owner|member)
stores           id, org_id, platform (shopify|woocommerce), name, domain,
                 status (connected|error|disconnected),
                 credentials_encrypted (JSONB, AES-256-GCM via APP_ENCRYPTION_KEY),
                 last_sync_at, created_at
products         id, store_id, external_id, title, sku, inventory_qty,
                 tracked (bool), updated_at
ad_connections   id, org_id, provider (meta|google), status,
                 credentials_encrypted, account_ref, created_at
ad_links         id, product_id, ad_connection_id, external_campaign_ref,
                 external_adset_ref, mode (pause_on_zero|pause_below_threshold),
                 threshold_qty, state (active|paused_by_steadel|unknown),
                 last_action_at
automation_rules id, store_id, type (low_stock_alert|scheduled_report|ads_guard),
                 config (JSONB), enabled, created_at
alerts_log       id, org_id, store_id, type, payload (JSONB), delivered_via,
                 created_at
events_audit     id, org_id, actor (user_id|system), action, payload, created_at
```

Encryption: one `APP_ENCRYPTION_KEY` env var; helper `encryptJson/decryptJson`
in `lib/crypto.ts`. Never log decrypted credentials.

---

## 5. Integrations

### 5.1 Shopify (v1, priority)
- Build as a **Shopify app** (Partner dashboard app created by owner; keys via env).
- OAuth flow: `read_products, read_inventory, read_orders` scopes only.
- Webhooks: `inventory_levels/update`, `products/update`, `app/uninstalled`
  (+ mandatory GDPR webhooks: `customers/data_request`, `customers/redact`,
  `shop/redact` — respond 200 and log; we store no customer PII).
- Fallback polling job every 15 min for stores where webhooks fail.
- Store connection UX: user pastes their shop domain → OAuth → store appears
  in dashboard with product list.

### 5.2 WooCommerce (v1.1 — build after Shopify works end-to-end)
- Connection via WooCommerce REST API: user enters site URL + consumer key/secret
  (guide page with screenshots explains how to generate them).
- Poll products/inventory every 10 min (Woo webhooks are unreliable; still
  register `product.updated` webhook where possible).

### 5.3 Meta Ads (v1, behind feature flag `ADS_GUARD_ENABLED`)
- Marketing API: OAuth connect, list campaigns/ad sets, pause/resume ad set.
- **Reality note:** Meta app review takes time. Build fully against the API with
  a `MockMetaProvider` used in dev/tests; ship UI marked "Beta". The provider
  interface must make adding Google Ads later trivial:
  `interface AdsProvider { listCampaigns(); pauseAdSet(ref); resumeAdSet(ref); }`
- Ads-guard engine rule: when tracked product qty hits 0 (or threshold), find
  linked ad sets → pause → log to alerts_log + email notification
  "Steadel paused X because Y sold out." On restock above threshold → resume
  only if `state = paused_by_steadel` (never resume something a human paused).

### 5.4 Google Ads (v2 — do NOT build now; keep provider interface ready)

### 5.5 Slack (v1.1) — incoming webhook URL per org for alerts.

---

## 6. Screens (all responsive, English)

**Auth (dark theme):**
1. `/signup` — name, email, password; email verification required before dashboard.
2. `/login` — email+password, "magic link" option, forgot-password flow.
3. `/verify`, `/reset-password` — standard flows.

**App (light theme, sidebar layout):**
4. `/onboarding` — 3-step wizard: connect store → pick tracked products
   (or "track all") → set first automation (low-stock alert with default
   threshold 5). Must be completable in under 3 minutes.
5. `/dashboard` — cards: stores status, tracked products, out-of-stock count,
   ads currently paused by Steadel, recent alerts feed.
6. `/stores` + `/stores/[id]` — product table (search, sort, toggle tracked,
   per-product threshold), sync status, reconnect.
7. `/automations` — list + create/edit: low-stock alert, scheduled report
   (daily/weekly, time, recipients), ads guard (link products ↔ ad sets).
8. `/reports` — on-screen charts (sales last 30d if platform provides orders
   read scope, inventory movements, alert history) + "email me this weekly".
9. `/settings/organization` — name, white-label name (agency plan only).
10. `/settings/billing` — current plan, usage vs limits, Paddle checkout
    (upgrade/downgrade/cancel), invoices list (from Paddle API).
11. `/settings/account` — profile, password, **export my data (JSON)**,
    **delete account** (soft delete + 30-day purge job).
12. `/help` — static written guides (see §9); searchable.

**Admin (owner-only, `/admin`, gated by `ADMIN_EMAILS` env):**
13. Orgs list with plan/status, impersonate-read-only, global job queue health,
    failed webhooks retry button.

---

## 7. API surface

Internal API = Next.js route handlers under `/api/*`, session-authenticated.
Public API (v1.1, Growth+ plans): `/api/v1/*` with per-org API keys
(`Authorization: Bearer`), rate-limited (60 req/min):
- `GET /api/v1/products` — tracked products + stock state
- `GET /api/v1/alerts` — alert log
- `POST /api/v1/automations/:id/toggle`
Webhook receivers: `/api/webhooks/shopify`, `/api/webhooks/paddle`,
`/api/webhooks/woocommerce` — all with signature verification, idempotency
(store processed webhook IDs), and dead-letter logging on failure.

---

## 8. Security & compliance checklist (implement, then verify in tests)

- Argon2id password hashing; login rate limiting (5/min/IP) on auth endpoints.
- CSRF protection on mutations; secure/httpOnly/SameSite cookies; strict CSP.
- All third-party credentials encrypted at rest (see §4); key rotation runbook.
- Webhook signature verification (Shopify HMAC, Paddle signature).
- Role checks on every org-scoped query (`org_id` always from session, never
  from client input).
- Audit log for sensitive actions (store connect/disconnect, plan change,
  data export, deletion).
- Privacy policy + terms pages (placeholder copy marked `TODO-LEGAL` for owner).
- Cookie banner NOT needed if no non-essential cookies — do not add analytics.

---

## 9. Documentation deliverables (in `/docs`, also rendered at `/help`)

1. `user-guide.md` — end-user manual: connecting Shopify, connecting
   WooCommerce (with key generation screenshots placeholders), setting up each
   automation, understanding alerts, billing FAQ.
2. `setup-guide.md` — **owner's deployment manual:** provisioning the Hetzner
   server, Docker Compose up, env vars table (every var explained), DNS records
   (app.steadel.com), Caddy TLS, backup & restore procedure (nightly pg_dump to
   Hetzner Storage Box via cron), update procedure.
3. `runbook.md` — operations: reading logs, retrying failed jobs, common
   errors, key rotation, restoring from backup, incident checklist.
4. `api.md` — public API reference with curl examples.
5. `PROGRESS.md` + `DECISIONS.md` — maintained by Claude Code during build.

---

## 10. Testing & quality bar (Definition of Done per milestone)

- Unit tests (Vitest) for: crypto helpers, plan-limit logic, ads-guard engine
  state machine, webhook signature verification.
- Integration tests for auth flows and one full happy path:
  signup → verify → connect mock store → create alert rule → trigger mock
  webhook → alert email rendered.
- Playwright smoke test: signup/login/dashboard render.
- `pnpm lint && pnpm typecheck && pnpm test` must pass — CI enforces.
- Seed script (`pnpm seed`) creating a demo org with mock store + products so
  the app is demoable without any real integration.
- No TODOs left without a `PROGRESS.md` entry.

---

## 11. Milestones (build in this order)

- **M0 — Skeleton:** repo scaffolding, Docker Compose (app+pg+redis+caddy),
  Next.js app boots, Drizzle migrations run, CI green, seed script.
- **M1 — Auth & orgs:** signup/login/verify/reset, org creation, settings,
  account export/delete, admin gate. Tests.
- **M2 — Stores & products:** Shopify OAuth + webhooks + polling fallback,
  product table UI, tracked toggles. Mock store provider for dev. Tests.
- **M3 — Automations core:** low-stock alerts + scheduled reports end-to-end
  (BullMQ jobs, email templates, alerts log, dashboard feed). Tests.
- **M4 — Ads guard:** provider interface, MockMetaProvider, real Meta provider
  behind flag, linking UI, pause/resume engine + safety rules. Tests.
- **M5 — Billing:** Paddle checkout, webhooks, plan limits enforcement,
  trial logic, billing screen. "Billing disabled" dev mode. Tests.
- **M6 — Polish & docs:** WooCommerce connector, Slack alerts, public API v1,
  /help rendering of docs, Playwright smoke suite, full docs pass,
  `setup-guide.md` verified against a clean Docker run.

---

## 12. Owner tasks (Claude Code: surface these in PROGRESS.md as blockers, do not fake them)

- [ ] Create GitHub repo secrets for CI (none needed beyond defaults in v1).
- [ ] Hetzner: provision Ubuntu 24 server + Storage Box for backups.
- [ ] DNS: point app.steadel.com to server (Cloudflare).
- [ ] SMTP: create account at an EU-region transactional email provider; fill env.
- [ ] Shopify Partner account + app creation → API key/secret into env.
- [ ] Meta developer app + Marketing API review → keys into env (Beta until approved).
- [ ] Paddle account + product/price setup → IDs into env.
- [ ] Legal: replace `TODO-LEGAL` privacy/terms placeholders (lawyer or template).
- [ ] Accountant: confirm invoicing flow with Paddle as MoR (Turkey export regime).

---

## 13. Explicitly out of scope for now

Google Ads provider (v2) · mobile apps · multi-language UI · AI support-bot ·
marketplace stock sync · TikTok ads · agency client-portal · SSO/social login.
Do not build these even partially.
