# Steadel — Build Progress

Maintained by Claude Code during the build (SPEC §9/§10).

## M0 — Skeleton ✅

Completed:

- Next.js 15 (App Router, TypeScript, `src/` layout, standalone output) boots.
- Tailwind CSS v4 with the brand design tokens (ink/panel/paper/mist/amber)
  and Fraunces / Inter / IBM Plex Mono fonts.
- Full Drizzle schema for the SPEC §4 data model (plus `auth_tokens`,
  `api_keys`, `processed_webhooks`, `dead_letters` support tables) with the
  initial migration checked into `drizzle/`.
- `lib/crypto.ts` — AES-256-GCM `encryptJson`/`decryptJson` keyed by
  `APP_ENCRYPTION_KEY`; unit-tested including tamper detection.
- `lib/logger.ts` — pino with credential redaction; file output when
  `LOG_DIR` is set.
- Docker Compose: app, worker, one-shot migrate, postgres 16, redis 7,
  caddy (TLS), uptime-kuma. Multi-stage `Dockerfile`.
- GitHub Actions CI: lint, typecheck, migrate, test against postgres/redis
  services; production image build on `main`.
- `pnpm seed` — demo org + mock Shopify store + 6 products + a default
  low-stock rule (`demo@steadel.com` / `demo-password-123`).

Pending / notes:

- Playwright smoke suite is scheduled for M6 per SPEC §11.

## M1 — Auth & orgs ✅

Completed:

- Auth.js (NextAuth v5) with JWT sessions: email+password sign-in
  (Argon2id via `@node-rs/argon2`) and magic-link sign-in (single-use
  tokens in `auth_tokens`, redeemed at `/magic`).
- Signup → trial org (14 days) + owner membership + verification email.
  Unverified accounts cannot sign in with a password (magic link implies
  inbox ownership and verifies).
- `/signup`, `/login` (password + magic link), `/verify`, `/reset-password`
  on the dark auth theme; full forgot/reset flow with single-use tokens.
- Rate limiting (5/min/IP, Redis fixed window with in-memory fallback) on
  all auth actions.
- App shell (light theme, sidebar) with `/dashboard` (live counts + alert
  feed), `/settings/account` (profile, password, **JSON data export**,
  **delete account** — soft delete now, 30-day purge job lands with the M3
  worker), `/settings/organization` (name, white-label for agency).
- `/admin` gated by `ADMIN_EMAILS` with the orgs overview table.
- Audit log entries for signup, password reset/change, org update, export,
  delete request (SPEC §8).
- Tests: 12 passing — crypto unit, rate-limit unit, and integration for
  signup/verify/reset/magic-link (email tokens extracted from the captured
  outbox; single-use enforced).

Pending / notes:

- 30-day account purge job ships with the M3 worker infrastructure.
- Placeholder pages for /automations, /reports, /help, /settings/billing
  until their milestones land.

## M2 — Stores & products ✅

Completed:

- `StoreProvider` interface with two implementations: `ShopifyProvider`
  (GraphQL Admin API 2025-01, variant-level products, cursor pagination)
  and `MockStoreProvider` (in-memory catalogs for dev/tests; enabled when
  `MOCK_STORE_PROVIDER=1` or Shopify keys are absent).
- Shopify OAuth: `/api/shopify/install` (domain validation, state cookie) →
  `/api/shopify/callback` (state + HMAC verification, token exchange,
  AES-256-GCM credential storage, webhook registration, initial sync).
- Webhook receiver `/api/webhooks/shopify`: raw-body HMAC verification,
  idempotency via `processed_webhooks` (marked after success so retries
  work), GDPR topics acknowledged & logged, `app/uninstalled` disconnects,
  inventory/product updates enqueue a debounced store sync; failures go to
  `dead_letters`.
- Sync engine `syncStoreProducts`: full-catalog upsert returning a
  `StockChange[]` diff (old/new qty, tracked, threshold) — the M3/M4
  automation engines consume this.
- BullMQ infrastructure: `sync` queue, worker (`pnpm worker`) with
  jobId-deduplicated store syncs and a 15-minute `poll-all-stores`
  scheduler (SPEC §5.1 fallback polling).
- UI: `/stores` (connect Shopify by domain, demo store button, store list
  with status badges) and `/stores/[id]` (product table with search, sort,
  tracked toggles, per-product thresholds, track/untrack all, sync now,
  reconnect, disconnect). All queries org-scoped from the session.
- Tests: 25 passing — adds Shopify OAuth/webhook HMAC unit tests and
  integration tests for mock connect, stock-change diffing, first-seen
  products, disconnected-store skip, and webhook idempotency.

Pending / notes:

- Real-store end-to-end requires the owner's Shopify Partner app keys
  (see Owner tasks).

## M3 — Automations core ✅

Completed:

- Low-stock engine: pure `evaluateLowStock` decision function (downward
  threshold crossing only — no re-alerts while stock stays low, no alerts
  on first import; per-product threshold overrides the rule default) +
  `processStockChanges` applying enabled rules, writing `alerts_log`
  (`low_stock` / `out_of_stock`) and sending branded emails.
- Worker now runs sync → automations as one path (`runStoreSync`), used by
  webhook-triggered jobs and the 15-minute poll alike.
- Scheduled reports: daily/weekly + UTC hour (+weekday) config, hourly
  `report-tick` scheduler enqueues due reports deduplicated per rule+day,
  report email with inventory snapshot (products/tracked/out-of-stock/low
  stock/alert count) — white-label brand name for agency plan.
- 30-day account purge job (daily): hard-deletes soft-deleted users and
  their owned orgs (cascades) after the GDPR window.
- `/automations`: rules list with enable/pause/delete, `/automations/new`
  and `/automations/[id]` sharing one form (low-stock alert & scheduled
  report; ads guard arrives in M4).
- `/onboarding`: 3-step wizard (connect store → track products → enable
  default alert) with progress states; dashboard banner links to it while
  no store is connected.
- Tests: 37 passing — engine unit tests (crossing/threshold-override/
  first-seen), report due-check, and the SPEC §10 happy path: signup →
  verify → connect mock store → alert rule → stock drop → rendered alert
  email + log entry, plus scheduled report and purge coverage.

## Owner tasks (blockers surfaced from SPEC §12 — not faked)

- [ ] Hetzner: provision Ubuntu 24 server + Storage Box for backups.
- [ ] DNS: point app.steadel.com to the server (Cloudflare).
- [ ] SMTP: EU-region transactional email account → fill `SMTP_*` env.
- [ ] Shopify Partner app → `SHOPIFY_API_KEY/SECRET`.
- [ ] Meta developer app + Marketing API review → `META_*` env (Beta until approved).
- [ ] Paddle account + products/prices → `PADDLE_*` env.
- [ ] Legal: replace `TODO-LEGAL` privacy/terms placeholders.
- [ ] Accountant: confirm Paddle-as-MoR invoicing under the Turkey export regime.
