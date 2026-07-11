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

## M1

10. **Org-per-user at signup:** signup creates a personal organization
    ("<name>'s store", trial plan) immediately — every session always has
    an org context; multi-member orgs use the same `org_members` table.
11. **Magic link verifies email:** redeeming a magic link proves inbox
    ownership, so it also sets `email_verified_at` for unverified users.
12. **Account deletion semantics:** soft delete blocks sign-in instantly
    (checked in `authorize` and `requireUser`); full erasure happens in a
    30-day purge job (M3 worker) per the GDPR erasure requirement.
13. **Rate limiter:** fixed-window counter in Redis (INCR+EXPIRE), failing
    open to an in-memory fallback so an unreachable Redis cannot lock every
    user out of auth.
14. **Vitest 4 + jsx:preserve:** Next.js needs `jsx: preserve` in
    tsconfig, which Vite 8/oxc would pass through untransformed; vitest
    config sets `oxc.jsx.runtime = "automatic"` for test builds.
15. **Test database:** tests run against `<db>_test` (created and migrated
    in vitest global setup) so `pnpm test` never touches dev data; CI's
    DATABASE_URL already ends in `_test` and is used as-is.

## M2

16. **Webhooks trigger a full re-sync, not incremental updates.** Shopify's
    inventory payloads reference `inventory_item_id`s that would require an
    extra mapping table; enqueueing a (jobId-deduplicated) full catalog sync
    is simpler, self-healing, and identical to the polling path.
17. **Product granularity = variant.** `products.external_id` stores the
    variant GID; titles are "Product — Variant" unless the variant is the
    Shopify default.
18. **Mock stores are flagged by domain** (`*.steadel-mock.test`) rather
    than a column — providers resolve per domain and mock stores survive
    schema unchanged.
19. **Idempotency rows are written after successful processing** so a
    failed webhook returns 500 and the sender's retry is not swallowed as a
    duplicate; concurrent duplicates only collapse into an extra queued
    sync (harmless).
20. **Products removed on the platform are kept** in our table (stale rows
    keep alert history meaningful); revisit with a `removed_at` marker if it
    becomes noisy.
21. **ioredis pinned to bullmq's exact version** (pnpm override) so a single
    copy exists and BullMQ's connection types match ours.

## M3

22. **Alerts fire on threshold *crossings*, not states.** A product that
    stays at qty 3 across ten syncs alerts once (when it crossed), not ten
    times; restocks reset the trigger. First-seen products never alert to
    avoid an import stampede.
23. **Report scheduling is config-matched, not cron rows:** an hourly
    worker tick matches each rule's UTC hour/weekday and enqueues with a
    `report:<ruleId>:<date>` jobId — BullMQ dedup makes double-ticks
    harmless and no extra scheduling state is stored.
24. **Report times are UTC** in v1 (documented in the UI). Org-level
    timezones can layer on later without schema changes (config JSONB).
25. **One BullMQ queue** for all job types (sync, reports, purge) — a solo
    operator debugs one queue; splitting is premature at this volume.

## M4

26. **The guard reads provider status before acting.** One `listCampaigns`
    snapshot per connection per sync run lets us distinguish "we paused it"
    from "a human paused it": already-PAUSED ad sets are marked `unknown`
    and never resumed. Slightly more API traffic, categorically safer.
27. **Meta connect stores the first ad account** returned by
    `/me/adaccounts`. Multi-account pickers are deferred; the accountRef
    column already supports several connections per org.
28. **Mock ad accounts are flagged by accountRef prefix** (`mock-`),
    mirroring the mock-store-by-domain decision (#18).
29. **`ads_guard` automation rule = per-store kill switch.** Created
    automatically with the first product↔adset link; pausing the rule stops
    the engine without deleting links.

## M5

30. **Expired trials / canceled subscriptions are read-only, not locked
    out.** Existing automations keep their data visible; only *creating*
    stores/automations is blocked. Gentler, and GDPR export/delete stays
    reachable.
31. **Org ↔ Paddle mapping via checkout `custom_data.orgId`**, with
    fallbacks by subscription id then customer id — covers webhooks that
    arrive before the first `transaction.completed`.
32. **Plan changes via API, new subscriptions via overlay checkout.**
    Active subscribers PATCH the subscription (prorated immediately);
    cancellation is effective at period end.
33. **Dev mode plan switching:** with `BILLING_ENABLED=false` the billing
    page switches plans instantly (owner only, audited) so every plan gate
    is testable without Paddle.
34. **CSP stays allowlist-only:** Paddle's CDN/checkout origins are the
    single exception; no other third-party origin is permitted.

## M6

35. **WooCommerce stock is product-level** in v1 (variations deferred);
    sites without numeric stock management map instock→1 / outofstock→0 so
    threshold-zero automations still work.
36. **Woo webhooks verify against the consumer secret.** We don't
    auto-register webhooks (users' keys may be read-only); the guide tells
    users to set the webhook secret to their consumer secret, which we
    already hold encrypted.
37. **Polling is a 5-minute due-check tick** rather than per-platform
    schedulers: each tick enqueues only stores whose `last_sync_at` is
    older than their platform interval (Shopify 15 min, Woo 10 min).
38. **API keys are hashed (sha256) with a display prefix** — the raw key
    is shown exactly once; possession of the database does not yield keys.
39. **Help search is plain substring matching** over the markdown sources
    — four documents don't need an index.
40. **/reports charts what we store:** alert history and current inventory.
    Sales charts wait for order-history sync rather than shipping a fake.
41. **Dead-letter retry = full store re-sync** (idempotent) instead of
    replaying raw webhook payloads — replay needs no payload versioning
    and cannot double-apply effects.

## Production operations (post-M6)

42. **Transactional email provider = Brevo (EU).** Chosen for free tier,
    EU processing, and proven deliverability. Limitation discovered in
    production: Brevo cannot fully disable open/click tracking on
    transactional mail — only anonymize it (Transactional → Settings →
    Tracking → "Anonymous email tracking: Yes"). Anonymization is enabled;
    if strict no-tracking ever becomes a requirement, switch to Scaleway
    TEM (env-only change thanks to the sendMail() wrapper).

43. **Shopify scopes reduced to `read_products,read_inventory`.** The
    `read_orders` scope is "protected customer data" and cannot ship in an
    app version without a Shopify approval request. Core features never
    needed it; /reports sales charts stay dormant until it is granted and
    re-added to `SHOPIFY_SCOPES`.
