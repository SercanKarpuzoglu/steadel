# Steadel — Decisions Log

Decisions not covered by SPEC.md, per its instruction to pick the simplest
working option and document it.

## M0

1. **Password hashing library:** `@node-rs/argon2` (Argon2id) instead of the
   `argon2` npm package — prebuilt binaries, no node-gyp toolchain needed on
   the Hetzner box or in CI.
2. **Email templates:** React components rendered with `@react-email/render`
   (SPEC allowed MJML or React Email). Plain React + inline styles keeps the
   dependency surface small; no MJML runtime.
3. **DB driver:** `postgres` (postgres-js) with Drizzle — single lightweight
   driver for app, worker, and scripts.
4. **Auth.js session strategy:** JWT (cookie) sessions with a Credentials
   provider. Magic links are implemented as single-use tokens in our own
   `auth_tokens` table redeemed by a second Credentials provider — avoids
   needing a database adapter and email-provider coupling.
5. **Migrations at deploy:** a one-shot `migrate` compose service runs
   `pnpm db:migrate` before `app`/`worker` start, so deploys are just
   `docker compose up -d --build`.
6. **Worker image:** runs from source via `tsx` (same image target as
   migrate) rather than a bundling step — simpler, and the worker is not
   latency-sensitive.
7. **Webhook idempotency:** a `processed_webhooks` table with a unique
   `(source, external_id)` index; inserts act as the idempotency check.
   Failed webhook payloads go to a `dead_letters` table for admin retry.
8. **Next 15 pinned with `~15.5.x`:** SPEC fixes Next.js 15; `~` keeps us on
   the 15.5 patch line and out of Next 16.
9. **CSP:** `script-src 'self' 'unsafe-inline'` is required by Next.js App
   Router inline runtime; no external script origins are allowed at all.
   Revisit with nonces if the surface grows.
