# Steadel Operations Runbook

For the solo operator. Everything here assumes SSH access to the Hetzner
box and `cd ~/steadel`.

## 1. Reading logs

```bash
docker compose logs -f app        # web requests, auth, webhooks
docker compose logs -f worker     # syncs, alerts, reports, ads guard
docker compose logs --since 1h app worker | grep -i error
```

Logs are pino JSON. Credentials are redacted at the logger level. With
`LOG_DIR` set, files rotate under that directory instead.

## 2. Retrying failed jobs

BullMQ retries jobs 3× with exponential backoff automatically. To inspect
the queue: **/admin** shows live job counts (waiting/active/failed) and
the dead-letter list.

- **Failed webhooks** appear under /admin → Dead letters. The *Retry sync*
  button re-enqueues a full store sync (safe: syncs are idempotent).
- A stuck queue usually means Redis restarted; `docker compose restart
  worker` re-registers the schedulers and drains the backlog.

## 3. Common errors

| Symptom | Likely cause | Fix |
|---|---|---|
| Store status `error` | expired/revoked store credentials | Store page → Reconnect (Shopify) or re-enter keys (Woo) |
| No alert emails | SMTP misconfigured | check `SMTP_*` env; `docker compose logs app \| grep sendMail` |
| `invalid signature` on webhooks | wrong secret | Shopify: API secret matches Partner app; Paddle: webhook secret matches notification destination |
| Ads not pausing | flag or link state | `ADS_GUARD_ENABLED=true`? product tracked? link state `unknown` means a human paused the ad set |
| App 502 | app container restarting | `docker compose logs app`; usually a bad env var after an edit |

## 4. Key rotation

### APP_ENCRYPTION_KEY

Rotating the data-encryption key requires re-encrypting stored
credentials. Procedure (downtime ~1 min):

1. Announce maintenance; `docker compose stop worker`.
2. Every connected store/ads connection must be reconnected after
   rotation, **or** write a one-off script that decrypts with the old key
   and re-encrypts with the new one (`lib/crypto.ts` helpers). v1 has no
   automated re-encryption job — plan for reconnects.
3. Update `.env`, `docker compose up -d`.

### AUTH_SECRET

Safe to rotate anytime; all users are signed out and sign in again.

### SMTP / API keys

Update `.env`, `docker compose up -d app worker`. No data impact.

## 5. Restoring from backup

```bash
# newest backup from the Storage Box
scp -P 23 uXXXXX@uXXXXX.your-storagebox.de:backups/steadel-YYYY-MM-DD.sql.gz .
docker compose stop app worker
gunzip -c steadel-YYYY-MM-DD.sql.gz | docker compose exec -T postgres psql -U steadel -d steadel
docker compose up -d
```

Quarterly drill: restore into a scratch database
(`createdb steadel_drill` + psql into it) and spot-check `users` /
`stores` row counts.

## 6. Incident checklist

1. **Assess**: is it app-down, data-wrong, or third-party (Shopify /
   Paddle / Meta) outage? Check status.steadel.com and provider status
   pages first.
2. **Contain**: `docker compose stop worker` stops all outbound actions
   (emails, ad pausing) without taking the app down.
3. **Diagnose**: logs (§1), queue health (/admin), disk space (`df -h`),
   memory (`docker stats`).
4. **Communicate**: reply to affected users by email; no status page
   theatrics needed at this scale.
5. **Recover**: restart services, or restore backup (§5) for data issues.
6. **Post-mortem**: one paragraph in `DECISIONS.md` if a decision changed.

## 7. GDPR requests

- Export/delete are self-serve (Settings → Account). For manual requests,
  verify the requester owns the account email, then use the same flows.
- Account deletions purge automatically 30 days after the request via the
  worker's daily purge job.

## 8. Switching Paddle sandbox → production

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
