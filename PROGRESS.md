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
- Placeholder pages for /stores, /automations, /reports, /help,
  /settings/billing until their milestones land.

## Owner tasks (blockers surfaced from SPEC §12 — not faked)

- [ ] Hetzner: provision Ubuntu 24 server + Storage Box for backups.
- [ ] DNS: point app.steadel.com to the server (Cloudflare).
- [ ] SMTP: EU-region transactional email account → fill `SMTP_*` env.
- [ ] Shopify Partner app → `SHOPIFY_API_KEY/SECRET`.
- [ ] Meta developer app + Marketing API review → `META_*` env (Beta until approved).
- [ ] Paddle account + products/prices → `PADDLE_*` env.
- [ ] Legal: replace `TODO-LEGAL` privacy/terms placeholders.
- [ ] Accountant: confirm Paddle-as-MoR invoicing under the Turkey export regime.
