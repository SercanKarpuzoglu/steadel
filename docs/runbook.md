# Steadel Operations Runbook

For the solo operator. Everything here assumes `ssh steadel` and
`cd /opt/steadel` unless stated otherwise.

## 1. Where things are

| Thing | Location |
|---|---|
| Server | Hetzner Cloud, `ssh steadel` (root, key auth). App lives in `/opt/steadel`. |
| Production secrets | `/opt/steadel/.env` (mode 600). Edits are backed up as `.env.bak-*` alongside it. |
| Containers | `app`, `worker`, `migrate` (runs migrations then exits), `postgres`, `redis`, `caddy`, `uptime-kuma` — all `restart: unless-stopped`. |
| Database shell | `docker compose exec -T postgres psql -U steadel -d steadel` |
| Operator console | https://app.steadel.com/admin — only emails listed in `ADMIN_EMAILS` (currently `sercan@steadel.com`). `sercankarpuzoglu@gmail.com` is a normal **demo** merchant account, not an operator. |
| Uptime Kuma | https://status.steadel.com — admin credentials in `/opt/steadel/.kuma-admin`. |
| Backups | `/var/backups/steadel/` on the server (local only — see §11). |
| WordPress plugin | source `~/dev/steadel-woo`; WordPress.org SVN checkout `~/dev/steadel-woo-svn`. |
| Inbound mail | `*@steadel.com` → Cloudflare Email Routing → `sercan@parsius.com` (Google Workspace). App mail goes out through Brevo SMTP. |

The box is small (≈3.7 GiB RAM + 2 GiB swap). Builds fit, but don't run
anything else heavy alongside a build.

## 2. Deploying

```bash
cd /opt/steadel && ./deploy.sh
```

`deploy.sh` does: `git pull` → `docker compose build` (old containers keep
serving) → `docker compose up -d --no-build` (seconds) → HTTP health check on
app, login and marketing site → `docker compose ps`.

**Never run `docker compose up -d --build` on the server.** Twice it took
production down. Root cause, from the daemon journal: Docker 29.6.1's BuildKit
panics the daemon mid-build (`fatal error: concurrent map iteration and map
write`, `moby/buildkit/solver/jobs.go`). `up --build` stops and recreates the
containers *before* the long build, so when the daemon dies the operation is
abandoned with everything already stopped — and `restart: unless-stopped` does
**not** resurrect a container that was deliberately stopped. With `deploy.sh`
a panic just fails the build; production is untouched. If a build fails for a
transient reason, run the script again.

**Environment-only changes** (editing `.env`) need no build:

```bash
cp .env .env.bak-$(date +%Y%m%d-%H%M%S)   # then edit .env
docker compose up -d app worker             # recreate with the new env
```

**If everything is down** (all containers `Exited`, site returns nothing):

```bash
docker compose up -d --no-build   # restores service on the existing images
```

Then check `journalctl -u docker --since "30 min ago"` for the panic, and
deploy again with `deploy.sh`.

Deploys are verified by hand afterwards: `curl -s -o /dev/null -w "%{http_code}"`
on the changed pages, and a Playwright screenshot for anything visual.

## 3. Reading logs

```bash
docker compose logs -f app        # web requests, auth, webhooks, wc-auth callback
docker compose logs -f worker     # syncs, alerts, reports, lifecycle emails, purge
docker compose logs --since 1h app worker | grep -i error
```

Logs are pino JSON; credentials are redacted at the logger level. With
`LOG_DIR` set, files rotate under that directory instead. Application logs
are deliberately **not** exposed in the operator console — read them here.

## 4. Operator console (`/admin`)

Gated by `requireAdmin()`: the signed-in user's email must be in
`ADMIN_EMAILS` (comma-separated, in `.env`; change it as an env-only deploy,
§2). Non-admins are redirected to `/dashboard`. The console has its own dark
shell (`src/app/(operator)/console.css`), separate from the light merchant app.

| Page | What it is for |
|---|---|
| `/admin` | Overview: MRR, active subscriptions, trials, activation funnel, live activity, system health |
| `/admin/customers` | Every organization; search, status filter. Click through for detail. |
| `/admin/customers/[id]` | Subscription (Paddle), usage, stores, billing history, audit timeline, and the **management actions** below |
| `/admin/billing` | Revenue, Paddle transactions, refunds, upcoming renewals |
| `/admin/live` | Real-time event stream across all orgs |
| `/admin/reports` | Growth, retention, activation, and the first-party **marketing traffic** panel (§9) |
| `/admin/operations` | Job queue health, integration status, **dead-letter queue with Retry / Discard** |
| `/admin/audit` | Every `events_audit` row: actor, action, org, source (operator / customer / system) |
| `/admin/access` | Who the operators are (from `ADMIN_EMAILS`) |

Customer actions (all written to the audit log with the operator's identity):
change/comp plan, extend trial, resend verification, password-reset link,
GDPR export, **suspend**, **GDPR erase**. Suspend sets `organizations.suspended_at`,
which halts that org's automations independently of Paddle state (the Paddle
webhook overwrites plan/subscription fields, so suspension deliberately lives
in its own column). Reads and exports are never blocked. Suspend and erase are
real and destructive — test them on the demo org, never on a paying customer.

## 5. Jobs and retrying

One BullMQ queue (`sync`) on Redis. The worker registers these schedulers on
start:

| Scheduler | Interval | Does |
|---|---|---|
| `poll-all-stores` | 5 min | enqueues a sync for stores whose last sync is older than their platform interval (Shopify 15 min, WooCommerce 10 min) |
| `report-tick` | hourly | enqueues every due scheduled report, once per period |
| `purge-accounts` | daily | hard-deletes accounts soft-deleted more than 30 days ago |
| `lifecycle-tick` | daily | onboarding / lifecycle emails (§8) |

Note: `upsertJobScheduler` fires each scheduler **immediately on worker
start** as well as on the interval — a worker restart runs every tick once.
All ticks are idempotent, so this is harmless.

- Jobs retry 3× with exponential backoff. Sync jobs use
  `removeOnComplete/removeOnFail: true` (a retained completed jobId would
  silently drop later syncs); report jobs keep retention for period dedup.
- **Failed webhooks** land in `dead_letters` and appear under
  `/admin/operations`. *Retry* re-enqueues a full store sync (safe — syncs
  are idempotent). *Discard* drops the entry.
- A stuck queue usually means Redis restarted: `docker compose restart worker`
  re-registers the schedulers and drains the backlog.
- Webhook idempotency is atomic (`claimWebhook` INSERT … ON CONFLICT, then
  `releaseProcessed`). BullMQ jobIds must not contain `:` (use `-`).

## 6. Common errors

| Symptom | Likely cause | Fix |
|---|---|---|
| Store status `error` | expired/revoked credentials | Store page → **Reconnect** (Shopify) or connect again (WooCommerce one-click, or Advanced keys) |
| No alert emails | SMTP misconfigured, or org is entitlement-suspended | check `SMTP_*`; `docker compose logs app \| grep sendMail`; check `plan` / `trial_ends_at` / `suspended_at` on the org |
| `invalid signature` on webhooks | wrong secret | Shopify: API secret matches the Partner app; Paddle: secret matches the notification destination; WooCommerce: the webhook's secret must be the store's **consumer secret** |
| WooCommerce alert "late" | it's polling | Woo is checked every 10 min by design (§7); instant needs a webhook |
| "Cancel subscription" → *Paddle rejected* | sandbox subscription id left on the org | §16 |
| App 502 | app container restarting | `docker compose logs app`; usually a bad env var after an edit |
| Whole site down after a deploy | BuildKit daemon panic during `up --build` | `docker compose up -d --no-build`, then §2 |
| Build fails with `exit code 1`, nothing in logs | transient memory pressure on the small box | run `./deploy.sh` again; production was untouched |
| Ads not pausing | flag or link state | `ADS_GUARD_ENABLED=true`? product tracked? link state `unknown` = a human paused the ad set. Ads guard is Beta and runs on `MockMetaProvider` until the Meta app is approved. |

## 7. Store connections

### Shopify

OAuth via the Partner app (scopes `read_products`, `read_inventory` only —
`read_orders` is protected customer data and would need Shopify approval).
Stock changes arrive by webhook within seconds; polling every 15 min is the
fallback. The app config lives in Partner Dashboard **versions** and must be
published; the "legacy install flow" checkbox is required for our
non-embedded OAuth.

### WooCommerce — one-click (primary)

`Stores` → enter the store address → **Connect** →
`/stores/connect/woocommerce` stashes `{orgId, actorId, siteUrl}` in Redis
under a random single-use token (`woo_connect:<token>`, 30 min TTL) and
redirects the merchant to the store's `/wc-auth/v1/authorize` with
`scope=read` and that token as `user_id`. The merchant approves; WooCommerce
generates read-only API keys and POSTs them to `/api/woo/callback`, which
consumes the token, validates the keys against the store, and calls
`connectWooStore`. Verified end-to-end against a real store.

Things to know:

- WooCommerce only offers store-wide **Read** or **Write** scopes, so its
  approval screen lists "View customers / View orders" even though Steadel
  reads only products and inventory. The landing, the GDPR guide, the Stores
  page and the plugin all say this plainly — keep it that way.
- Because the keys never pass through the merchant, one-click users **cannot
  see their consumer secret**, and therefore cannot set up the optional
  webhook. Instant updates require the **Advanced: connect with API keys**
  path, where they create the key themselves. Otherwise Woo is **polled every
  10 minutes** — which the copy states. Plugin v1.1 idea: the plugin runs
  inside WordPress with full rights and could register the webhook itself.
- `connectWooStore` registers no webhook (read scope can't).

### WooCommerce — API keys (advanced)

Merchant creates a Read key under WooCommerce → Settings → Advanced → REST
API and pastes site URL + `ck_…` + `cs_…` under the Advanced disclosure on the
Stores page. Same downstream path.

## 8. Lifecycle (onboarding) emails

Sent through the same Brevo `sendMail` as everything else, using the
templates in `src/emails/lifecycle-emails.tsx`.

- **welcome** — sent once, on the account's first email verification
  (`verifyEmailToken`), not at signup, so nobody gets two emails at once.
- The daily `lifecycle-tick` sends **at most one** of these per org per run,
  decided by the pure function in `src/lib/services/lifecycle-decide.ts`:
  `protected` (first alert has fired — celebrate), `trial_ending` (trial,
  ≤3 days left), `win_back` (trial lapsed ≥2 days, not paying),
  `connect_store` (trial, ≥2 days old, no store yet).
- Idempotent: every send is recorded as `events_audit` action
  `email.lifecycle` with `payload.stage`; a stage is never sent twice.
- Skipped entirely: unverified users, suspended orgs, and any owner whose
  email is in `ADMIN_EMAILS` (operators never get nurture mail).

Who got what:

```sql
select o.name, e.payload->>'stage' as stage, e.created_at
from events_audit e join organizations o on o.id = e.org_id
where e.action = 'email.lifecycle' order by e.created_at desc;
```

To stop a stage for one org without code, insert an `email.lifecycle` audit
row for it with that stage.

## 9. Marketing analytics (first-party)

There is no third-party analytics anywhere, and the app itself is
analytics-free. Marketing pages only (`/`, `/guides/*`, `/de/guides/*`,
`/woocommerce-plugin`) mount a cookieless `sendBeacon` to `/api/collect`,
which stores path, external referrer host, coarse country (Cloudflare header
— only populated if the record is ever proxied; it is currently DNS-only) and
device class in `page_views`. No IP, no cookie, no user id. Headless/bot user
agents are dropped, so Playwright checks don't pollute the numbers. Shown on
`/admin/reports` → *Marketing traffic*. The activation funnel below it comes
from the database (signups → store → alert → paid), so top-of-funnel and the
rest sit on one page.

## 10. Key rotation

### `APP_ENCRYPTION_KEY`

Rotating the data-encryption key requires re-encrypting stored credentials.
Procedure (downtime ~1 min):

1. `docker compose stop worker`.
2. Every connected store must be reconnected after rotation, **or** write a
   one-off script that decrypts with the old key and re-encrypts with the new
   one (`lib/crypto.ts` helpers). There is no automated re-encryption job —
   plan for reconnects.
3. Update `.env`, `docker compose up -d app worker`.

### `AUTH_SECRET`

Safe to rotate anytime; all users are signed out and sign in again.

### SMTP / API keys / `ADMIN_EMAILS`

Env-only change: back up `.env`, edit, `docker compose up -d app worker`.

## 11. Backups and restore

Backups are **local to the server** — the owner chose not to order a Storage
Box. `scripts/backup.sh` (also at `/opt/steadel/scripts/backup.sh`) runs
nightly at 02:15 from `/etc/cron.d/steadel-backup`, logging to
`/var/log/steadel-backup.log`. It writes `pg_dump` to
`/var/backups/steadel/steadel-YYYY-MM-DD.sql.gz`, verifies the archive, and
keeps 14 days. Offsite copies can be enabled later by setting
`BACKUP_SCP_TARGET=` in `.env` — the script already supports it.

Restore:

```bash
ls -la /var/backups/steadel/                     # pick a file
docker compose stop app worker
gunzip -c /var/backups/steadel/steadel-YYYY-MM-DD.sql.gz \
  | docker compose exec -T postgres psql -U steadel -d steadel
docker compose up -d --no-build
```

Quarterly drill: restore into a scratch database (`createdb steadel_drill`,
psql into it) and spot-check `users` / `stores` / `organizations` row counts.
Because the box is the single copy, a lost server means lost backups —
that is the accepted risk until offsite is switched on.

## 12. Monitoring

Uptime Kuma at https://status.steadel.com (container `uptime-kuma`, Caddy
route in the server Caddyfile), 4 monitors, alerting through Brevo. Admin
login is in `/opt/steadel/.kuma-admin` (mode 600). The `/admin` overview's
"System health" card is the in-app view of the same signals.

## 13. Releasing the WordPress plugin

The plugin is published at https://wordpress.org/plugins/steadel-low-stock-alerts/
(slug is permanent; the display name can change). Source lives in
`~/dev/steadel-woo`; releases go out through Subversion — WordPress.org's SVN
is a release system, so push only finished versions.

1. In `~/dev/steadel-woo`: bump `Version:` in `steadel-low-stock-alerts.php`
   **and** `Stable tag:` in `readme.txt` (they must match), add a changelog
   entry, keep `Tested up to:` at the current WordPress — Plugin Check treats
   a stale value as an ERROR that hides the plugin from search.
2. Run Plugin Check before every release (throwaway WordPress in a
   container: install `plugin-check`, copy the plugin in, `wp plugin check
   steadel-low-stock-alerts`). Aim for "No errors found".
3. In `~/dev/steadel-woo-svn`: copy the three plugin files into `trunk/`,
   `svn cp trunk tags/<version>`, and put any new directory artwork in
   `assets/` (icons, banners, `screenshot-N.png` — never in `trunk/`).
4. `svn commit -m "<version>: <summary>" --username parsius`. SVN prompts for
   the SVN password, which is **separate** from the WordPress.org login
   password (profiles.wordpress.org → Account & Security → SVN password).
5. Keep the site in step: refresh `public/downloads/steadel-low-stock-alerts-<version>.zip`
   and the version on `/woocommerce-plugin`, then `deploy.sh`.

Account note: `parsius` is a **brand** account on WordPress.org — it can own
and release the plugin but is a forum "Spectator" and **cannot answer support
topics**. A personal account (`sercankarpuzoglu`, checked available) still
needs to be created and given the plugin's support role before the first
support thread arrives. Approval correspondence comes from
`plugins@wordpress.org`; keep it whitelisted — an unreachable owner can get
a plugin closed.

## 14. Incident checklist

1. **Assess**: app-down, data-wrong, or third-party (Shopify / Paddle / Meta /
   Brevo) outage? Check status.steadel.com and the provider status pages
   first. Site returning nothing at all right after a deploy = §2's daemon
   panic; fix is one command.
2. **Contain**: `docker compose stop worker` stops all outbound actions
   (emails, ad pausing, syncs) without taking the app down.
3. **Diagnose**: logs (§3), `/admin/operations` for queue and dead letters,
   `df -h`, `free -h`, `docker stats`, `journalctl -u docker`.
4. **Communicate**: reply to affected users by email; no status-page
   theatrics needed at this scale.
5. **Recover**: `docker compose up -d --no-build`, or restore a backup (§11)
   for data problems.
6. **Post-mortem**: one numbered entry in `DECISIONS.md` if a decision changed
   (the deploy procedure is #47 for a reason).

## 15. GDPR requests

- Export and delete are self-serve (Settings → Account). Operators can also
  run **Export** and **Erase** from `/admin/customers/[id]`; both are
  audit-logged with the operator's identity.
- Deletions purge automatically 30 days after the request via the worker's
  daily purge job.

## 16. Switching Paddle sandbox → production

When flipping `PADDLE_ENV=sandbox` to `production` (and swapping the
`PADDLE_*` keys), **clear any sandbox billing state left on organizations**.
Sandbox and live are separate universes: a `sub_…`/`ctm_…` created in
sandbox does not exist in live, so any live API call referencing it fails —
e.g. "Cancel subscription" returns *"Paddle rejected the cancellation"*
because the live API 404s on the stored sandbox subscription id.

Verify, then reset the affected orgs:

```bash
# Does the stored subscription actually exist in LIVE?
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $PADDLE_API_KEY" \
  https://api.paddle.com/subscriptions/<stored sub_id>     # 404 => sandbox leftover
```

Then set `plan='trial'`, `subscription_status=NULL`,
`paddle_subscription_id=NULL`, `paddle_customer_id=NULL` and a fresh
`trial_ends_at` for those orgs, so a real live checkout can create a clean
subscription. Real customers are unaffected — this only applies to orgs that
"subscribed" during sandbox testing.

Unit economics for reference: a €29 sale nets ≈ €22 after Turkish VAT and
Paddle's fee. Sales are in EUR but the payout currency is USD; switching the
payout to EUR would avoid a double conversion.
