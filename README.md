# Steadel

Stock-aware operations automation for European e-commerce stores (Shopify &
WooCommerce): ads guard, low-stock alerts, scheduled reports. EU-hosted,
GDPR-first.

The full product specification lives in [SPEC.md](SPEC.md). Build progress is
tracked in [PROGRESS.md](PROGRESS.md), architecture decisions in
[DECISIONS.md](DECISIONS.md).

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

## Deployment

Single Hetzner server via Docker Compose (app, worker, postgres, redis,
caddy, uptime-kuma). See [docs/setup-guide.md](docs/setup-guide.md).
