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

- Vitest runs unit tests; integration tests arrive with M1.
- Playwright smoke suite is scheduled for M6 per SPEC §11.

## Owner tasks (blockers surfaced from SPEC §12 — not faked)

- [ ] Hetzner: provision Ubuntu 24 server + Storage Box for backups.
- [ ] DNS: point app.steadel.com to the server (Cloudflare).
- [ ] SMTP: EU-region transactional email account → fill `SMTP_*` env.
- [ ] Shopify Partner app → `SHOPIFY_API_KEY/SECRET`.
- [ ] Meta developer app + Marketing API review → `META_*` env (Beta until approved).
- [ ] Paddle account + products/prices → `PADDLE_*` env.
- [ ] Legal: replace `TODO-LEGAL` privacy/terms placeholders.
- [ ] Accountant: confirm Paddle-as-MoR invoicing under the Turkey export regime.
