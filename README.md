# Steadel

Low-stock alerts and scheduled inventory reports for EU Shopify and
WooCommerce stores — hosted in Germany, GDPR-first, flat pricing. A stock-aware
ads guard (pausing Meta ads for sold-out products) exists but is **Beta** and is
never headlined; see the honesty rule in [MARKETING.md](MARKETING.md).

Live at **https://app.steadel.com** (Paddle billing, real customers). Built by
Parsius.

## What's where

| Surface | URL |
|---|---|
| App (merchant dashboard) | https://app.steadel.com |
| Operator console | https://app.steadel.com/admin — gated by `ADMIN_EMAILS` |
| Marketing landing | https://app.steadel.com |
| Guides (EN) / Leitfäden (DE) | `/guides` · `/de/guides` |
| Free WooCommerce plugin | `/woocommerce-plugin` · https://wordpress.org/plugins/steadel-low-stock-alerts/ |
| Status page | https://status.steadel.com (Uptime Kuma) |

## Documents

| Document | Purpose |
|---|---|
| [SPEC.md](SPEC.md) | Product specification the build followed |
| [PROGRESS.md](PROGRESS.md) | Build status and owner-task blockers |
| [DECISIONS.md](DECISIONS.md) | Numbered architecture and product decisions |
| [MARKETING.md](MARKETING.md) | Go-to-market plan (DACH-first, organic, zero budget) |
| [LAUNCH-COPY.md](LAUNCH-COPY.md) | Ready-to-paste copy: directories, Product Hunt, YouTube scripts |
| [docs/setup-guide.md](docs/setup-guide.md) | Provisioning a server from scratch |
| [docs/runbook.md](docs/runbook.md) | Day-to-day operations: deploying, logs, jobs, backups, incidents |
| [docs/user-guide.md](docs/user-guide.md) | End-user help (rendered in-app under `/help`) |
| [docs/api.md](docs/api.md) | Public API v1 |

## Related repositories

- `~/dev/steadel-woo` — source of the WordPress plugin **Steadel Low-Stock
  Alerts** (slug `steadel-low-stock-alerts`), its `readme.txt` and directory
  artwork.
- `~/dev/steadel-woo-svn` — the WordPress.org SVN checkout used to publish
  releases (see the runbook, §13).

## Development

Requirements: Node 22+, pnpm, Docker.

```bash
cp .env.example .env          # fill APP_ENCRYPTION_KEY + AUTH_SECRET
docker compose up -d postgres redis
pnpm install
pnpm db:migrate
pnpm seed                     # demo login: demo@steadel.com / demo-password-123
pnpm dev                      # app on http://localhost:3000
pnpm worker                   # background jobs (separate terminal)
```

Quality gates (CI enforces):

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm test:e2e   # Playwright smoke (needs postgres/redis + pnpm seed)
```

Charts and the marketing site must stay CSP-safe: no libraries that `eval`
(that is why charts are hand-rolled SVG), no third-party analytics or
trackers. Marketing analytics are first-party and cookieless (`page_views`).

## Repository map

```
src/app/(app)/        merchant app: dashboard, stores, automations, reports, settings
src/app/(auth)/       login, signup, verify, reset, magic link
src/app/(operator)/   operator console under /admin (dark theme, console.css)
src/app/guides/       SEO guides (EN); src/app/de/guides/ German versions
src/app/api/          webhooks (shopify, woocommerce, paddle), public API v1,
                      /api/woo/callback (wc-auth), /api/collect (analytics)
src/jobs/             BullMQ worker: sync, reports, lifecycle emails, purge
src/lib/              domain services, plans/entitlements, crypto, mail, audit
src/emails/           React Email templates (auth, alerts, lifecycle)
drizzle/              migrations (0000 initial → 0002 page_views)
scripts/              seed, migrate, backup.sh
deploy.sh             the only supported way to deploy (see below)
```

## Deployment

Single Hetzner server (`ssh steadel`, app at `/opt/steadel`) running Docker
Compose: app, worker, migrate, postgres, redis, caddy, uptime-kuma.

```bash
ssh steadel
cd /opt/steadel && ./deploy.sh      # pull → build → swap → health check
```

**Never run `docker compose up -d --build` on the server.** It stops the
containers *before* the multi-minute build, and Docker 29.6.1's BuildKit can
panic the daemon mid-build — which left production down twice.
`deploy.sh` builds first while the old containers keep serving, then swaps in
seconds; a failed build costs nothing. Details in the runbook, §2.

Provisioning from scratch: [docs/setup-guide.md](docs/setup-guide.md).
