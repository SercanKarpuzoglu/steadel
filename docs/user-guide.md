# Steadel User Guide

Welcome to Steadel — steady operations for your store. This guide covers
connecting your shop, setting up automations, and understanding alerts.

## Connecting Shopify

1. Open **Stores** in the sidebar.
2. Enter your shop domain (e.g. `my-shop.myshopify.com`) and click
   **Connect**.
3. Approve the permissions on Shopify. Steadel requests **read-only**
   access to products, inventory and orders — it can never change your
   store data.
4. Your products appear within a minute. Inventory updates arrive via
   Shopify webhooks instantly, with a fallback sync every 15 minutes.

To reconnect a store whose access was revoked, open the store page and
click **Reconnect**.

## Connecting WooCommerce

Steadel talks to WooCommerce through its REST API. You need to create API
keys once:

1. In your WordPress admin, go to **WooCommerce → Settings → Advanced →
   REST API** and click **Add key**.

   ![WooCommerce REST API keys settings](/docs-images/woo-rest-api-settings.png)
2. Description: `Steadel`. Permissions: **Read** is sufficient.
3. Click **Generate API key** and copy the **Consumer key** (`ck_…`) and
   **Consumer secret** (`cs_…`). The secret is shown only once.

   ![Creating a WooCommerce API key for Steadel](/docs-images/woo-key-generated.png)
4. In Steadel, open **Stores**, fill in your site URL (https required) and
   both keys, then click **Connect WooCommerce**.

WooCommerce stores are polled every 10 minutes. Optionally, add a webhook
for instant updates: **WooCommerce → Settings → Advanced → Webhooks → Add
webhook**, topic `Product updated`, delivery URL
`https://app.steadel.com/api/webhooks/woocommerce`, and set the **secret**
to your consumer secret.

## Tracked products & thresholds

Only **tracked** products trigger automations. On a store page you can
toggle tracking per product or use **Track all**. The optional per-product
**threshold** overrides the default threshold of your low-stock alert.

## Automations

### Low-stock alerts

Create one under **Automations → New automation**. Pick the store, a
default threshold (e.g. 5) and recipient email addresses. Steadel alerts
when a tracked product **crosses** the threshold downward — you get one
email per stock-out, not one per sync.

### Scheduled reports

Daily or weekly inventory digests: products tracked, out-of-stock and
low-stock lists, and alert counts. Times are in **UTC**. Agency plans can
white-label the report name under **Settings → Organization**.

### Ads guard (Beta)

Under **Automations → Ads guard**, connect your Meta ad account and link
tracked products to ad sets. When a linked product sells out, Steadel
pauses the ad set and emails you; when it restocks, the ad set resumes.

Safety rules:

- Steadel only pauses ad sets it can see are currently **active**.
- Anything **you** pause manually is left alone — Steadel never resumes an
  ad set it did not pause itself.

## Slack alerts

Add a Slack incoming webhook URL under **Settings → Organization** and all
alerts are also posted to that channel.

## Understanding the alerts feed

The dashboard shows the most recent events: `low_stock`, `out_of_stock`,
`ads_paused`, `ads_resumed`, `scheduled_report`. Each entry shows how it
was delivered (email, Slack).

## Billing FAQ

- **Which plans exist?** Starter €29/mo (1 store, 3 automations), Growth
  €59/mo (3 stores, unlimited automations, API), Agency €119/mo (10
  stores, white-label reports). 14-day free trial, no card required.
- **Who processes payments?** Paddle, as Merchant of Record. Paddle
  handles EU VAT and issues invoices; Steadel never sees card data.
- **How do I cancel?** Settings → Billing → Cancel subscription. You keep
  access until the end of the billing period.
- **What happens when my trial ends?** Your data stays; creating new
  stores/automations is blocked until you pick a plan.

## Your data (GDPR)

- **Export**: Settings → Account → Download JSON export.
- **Delete**: Settings → Account → Delete account. Your account is
  deactivated immediately and all data is permanently erased after 30
  days.
- Steadel is hosted in Germany and stores no customer PII from your shop —
  only product and inventory data.

## Support

Email support only — write to support@steadel.com and we reply within one
business day. There are no calls to book, ever.
