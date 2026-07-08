# Steadel Public API (v1)

Programmatic access to tracked products, alerts and automations.
Available on **Growth** and **Agency** plans.

## Authentication

Create an API key under **Settings → Organization → API access**. Send it
as a Bearer token:

```
Authorization: Bearer sk_steadel_…
```

Keys are shown once at creation and can be revoked anytime. Rate limit:
**60 requests/minute** per organization (HTTP 429 + `Retry-After` beyond
that).

Base URL: `https://app.steadel.com`

## GET /api/v1/products

Tracked products with current stock state.

```bash
curl -s https://app.steadel.com/api/v1/products \
  -H "Authorization: Bearer $STEADEL_KEY"
```

```json
{
  "data": [
    {
      "id": "9c2f…",
      "store": "my-shop.myshopify.com",
      "title": "Linen Throw Blanket",
      "sku": "LIN-THR-01",
      "inventory_qty": 2,
      "threshold_qty": 5,
      "out_of_stock": false,
      "updated_at": "2026-07-08T10:15:00.000Z"
    }
  ]
}
```

## GET /api/v1/alerts

Alert log, newest first. Optional query params: `type`
(`low_stock`, `out_of_stock`, `ads_paused`, `ads_resumed`,
`scheduled_report`) and `limit` (default 100, max 500).

```bash
curl -s "https://app.steadel.com/api/v1/alerts?type=out_of_stock&limit=20" \
  -H "Authorization: Bearer $STEADEL_KEY"
```

```json
{
  "data": [
    {
      "id": "5b1a…",
      "type": "out_of_stock",
      "store_id": "77aa…",
      "payload": { "title": "Walnut Serving Board", "qty": 0, "summary": "…" },
      "delivered_via": "email,slack",
      "created_at": "2026-07-08T09:00:00.000Z"
    }
  ]
}
```

## POST /api/v1/automations/:id/toggle

Flips an automation rule between enabled and paused. Rule IDs are visible
in the dashboard URL when editing a rule.

```bash
curl -s -X POST https://app.steadel.com/api/v1/automations/ab12…/toggle \
  -H "Authorization: Bearer $STEADEL_KEY"
```

```json
{ "data": { "id": "ab12…", "type": "low_stock_alert", "enabled": false } }
```

## Errors

| Status | Meaning |
|---|---|
| 401 | missing/invalid/revoked API key |
| 403 | plan does not include API access |
| 404 | resource not in your organization |
| 429 | rate limit exceeded — respect `Retry-After` |
| 5xx | our fault; retry with backoff |
