# Steadel Setup Guide (Owner's Deployment Manual)

Everything needed to run app.steadel.com on a single Hetzner server.

## 1. Provision the server

1. Hetzner Cloud → new server: **Ubuntu 24.04**, CX32 (4 vCPU / 8 GB) is
   plenty to start. Add your SSH key.
2. Order a **Storage Box** (BX11) for backups; note its credentials.
3. Basic hardening:

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2 ufw
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable
adduser steadel && usermod -aG docker steadel
```

## 2. DNS (Cloudflare)

| Record | Type | Value | Proxy |
|---|---|---|---|
| app.steadel.com | A | server IP | DNS only (grey cloud — Caddy does TLS) |
| status.steadel.com | A | server IP | DNS only |

## 3. Deploy

```bash
su - steadel
git clone https://github.com/SercanKarpuzoglu/steadel.git && cd steadel
cp .env.example .env
openssl rand -hex 32    # → APP_ENCRYPTION_KEY
openssl rand -base64 32 # → AUTH_SECRET
nano .env               # fill everything (see table below)
docker compose up -d --build
```

The `migrate` service applies database migrations before `app` and
`worker` start. Caddy obtains TLS certificates automatically.

## 4. Environment variables

| Variable | Required | Description |
|---|---|---|
| `APP_URL` | yes | `https://app.steadel.com` (no trailing slash) |
| `DATABASE_URL` | in compose | set automatically to the postgres container |
| `REDIS_URL` | in compose | set automatically to the redis container |
| `POSTGRES_PASSWORD` | yes | password for the postgres container |
| `APP_ENCRYPTION_KEY` | yes | 64-char hex; encrypts store/ads credentials. **Losing it means reconnecting every store.** |
| `AUTH_SECRET` | yes | session JWT secret |
| `ADMIN_EMAILS` | yes | comma-separated admin emails for /admin |
| `SMTP_HOST/PORT/USER/PASS/FROM` | yes | EU-region SMTP provider credentials |
| `SHOPIFY_API_KEY/SECRET` | for Shopify | from the Partner dashboard app |
| `ADS_GUARD_ENABLED` | no | `true` to enable the Meta ads guard |
| `META_APP_ID/SECRET` | for ads guard | Meta developer app credentials |
| `BILLING_ENABLED` | yes in prod | `true` to require Paddle subscriptions |
| `PADDLE_ENV` | yes | `sandbox` or `production` |
| `PADDLE_API_KEY` | for billing | Paddle API key |
| `PADDLE_WEBHOOK_SECRET` | for billing | from the Paddle notification destination |
| `PADDLE_CLIENT_TOKEN` | for billing | client-side token for the checkout overlay |
| `PADDLE_PRICE_STARTER/GROWTH/AGENCY` | for billing | Paddle price IDs |
| `LOG_DIR` | no | e.g. `/var/log/steadel` for file logs |
| `LOG_LEVEL` | no | `info` (default) |
| `MOCK_STORE_PROVIDER` | no | `1` to offer demo stores |

External webhook URLs to configure:

- Shopify: registered automatically on install.
- Paddle: notification destination → `https://app.steadel.com/api/webhooks/paddle`
  with events `subscription.created/updated/canceled` + `transaction.completed`.
- WooCommerce: users configure manually (see user guide).

Paddle checkout requirements (learned the hard way in sandbox — both apply
to the live account too):

1. **Default payment link** must be set (Paddle → Checkout → Checkout
   settings → `https://app.steadel.com`), otherwise the overlay fails with a
   generic "Something went wrong".
2. **Lock quantity to 1** on every price (`quantity: {minimum: 1, maximum: 1}`
   via API or dashboard) — otherwise the overlay shows a quantity selector
   and customers can buy N seats of a per-organization plan.
3. The webhook "secret key" is the `pdl_ntfset_…` value from the destination
   details (not the `ntfset_…` destination id).

## 5. Backups (nightly pg_dump → Storage Box)

As the steadel user, `crontab -e`:

```cron
15 2 * * * cd ~/steadel && docker compose exec -T postgres pg_dump -U steadel steadel | gzip > /tmp/steadel-$(date +\%F).sql.gz && scp -P 23 /tmp/steadel-$(date +\%F).sql.gz uXXXXX@uXXXXX.your-storagebox.de:backups/ && find /tmp -name 'steadel-*.sql.gz' -mtime +2 -delete
```

Verify restores quarterly (see runbook §5).

## 6. Updates

```bash
cd ~/steadel
git pull
docker compose up -d --build   # migrate runs first, then app+worker restart
docker image prune -f
```

## 7. Monitoring

Uptime Kuma runs at status.steadel.com (protect it: in Kuma's first-run
screen set an admin password; consider restricting by IP in Caddyfile).
Add an HTTP monitor for `https://app.steadel.com/login` and one for each
webhook endpoint. Logs: `docker compose logs -f app worker`.
