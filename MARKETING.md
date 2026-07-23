# Steadel — Go-to-Market & Marketing Plan

Live product, Paddle billing active. This is the plan to get from "it works"
to "it sells." Written for a **solo operator**, **EU-first**, **privacy-first**,
**low/no paid budget** starting point. Prioritised P0 → P2.

## 0. Assumptions (change these and the plan shifts)

- Solo operator, limited hours/week, minimal ad budget at first.
- Primary market: **DACH (Germany first)**, then NL/FR — where "EU-hosted,
  GDPR-first, no US data transfer" is an actual buying criterion, and where
  WooCommerce is heavily used.
- Distribution reality: **no Shopify App Store** (billing conflict, deferred)
  and **ads-guard is Beta** (Meta app not yet approved). So we lead with the
  fully-shipping value and use channels we control.

## 1. Positioning

**One-liner:** *Steadel keeps your store steady — it warns you before products
run out and (soon) pauses the ads for products that already have.*

**ICP (who we chase first):** EU-based Shopify/WooCommerce brands that (a) sell
**physical stock that actually sells out** (fashion, food & drink, cosmetics,
homeware, small-batch/DTC) and (b) **run Meta ads**. Explicitly NOT
print-on-demand / dropshipping (they never run out — no pain).

**Differentiators to hammer (in order):**
1. **EU-hosted in Germany, GDPR-first, zero tracking** — no US data transfer.
   This is the wedge for DACH brands burned by US SaaS / Schrems worries.
2. **Flat, transparent pricing** (€29/59/119) — not a % of ad spend.
3. **Calm & written** — no upsells, no sales calls, human email support.

**Messaging honesty (important):** the *ads guard* is Beta until the Meta app
is approved. Lead the pitch with what ships today — **low-stock alerts +
scheduled reports** ("never get caught out of stock") — and sell ads-guard as
the near-term hero ("Beta, rolling out"). Do not headline a feature we can't
turn on for everyone yet.

## 2. P0 — Launch-readiness (do before any promotion)

| # | Task | Why |
|---|---|---|
| M1 | **Add EU-friendly analytics to the marketing site only** (Plausible/Umami, cookieless, self-host on Hetzner). App stays analytics-free per spec. | Can't optimise a funnel you can't see. Backlog #17. |
| M2 | **Define + instrument the funnel**: visit → trial signup → store connected → activated (first alert fired) → paid. Track each step. | "Activation = first store connected + first alert" is the north-star. |
| M3 | **Rewrite landing hero to lead with the shipping value** (out-of-stock alerts/reports), ads-guard as "Beta". Add a 20–30s demo GIF/screen-capture of connecting a store + an alert email. | Honesty + shows the product in 10 seconds. |
| M4 | **Founder/company assets**: X + LinkedIn profiles (Sercan/Parsius), a simple "who's behind this" page. Buyers trust a real EU operator. | Trust for a solo, privacy-first tool. |
| M5 | **Onboarding email sequence** (transactional/lifecycle, no marketing tracking): welcome → connect-store nudge → "you're protected" → day-10 trial-ending → win-back. Via Brevo. | Trials convert on activation; email drives it. |
| M6 | **2–3 comparison / SEO landing pages**: "GDPR-hosted alternative to [US tool]", "Shopify low-stock alerts", "pause Meta ads when out of stock (WooCommerce)". | Capture high-intent search. |

## 3. P1 — Channels (ranked for a solo EU operator)

| # | Channel | Concrete first move |
|---|---|---|
| C1 | **WooCommerce / WordPress.org plugin directory** | Publish a free "Steadel connector" plugin (billing stays on steadel.com — no store-billing conflict, unlike Shopify). Huge free discovery; the channel Shopify App Store can't be for us. |
| C2 | **SEO content** | 1 article/week: inventory/ads pain, GDPR hosting, Shopify vs Woo stock ops. Target long-tail keywords from M6. Compounding, free. |
| C3 | **Communities** | Be genuinely helpful (not spammy) in r/shopify, r/woocommerce, r/PPC, Indie Hackers, DACH e-commerce Slack/FB/Discord groups. Answer stock/ads questions; link when relevant. |
| C4 | **Build-in-public** | Weekly X/LinkedIn posts: metrics, lessons, EU-SaaS angle. Cheap top-of-funnel + trust. |
| C5 | **Agency partnerships** | The **Agency plan (white-label reports)** is a channel: recruit Shopify/Woo agencies as affiliates/resellers who deploy Steadel across client stores. Warm outbound to 20 EU agencies. |
| C6 | **Directories & launches** | Free listings: G2, Capterra, SaaSHub, EU-SaaS directories. A **Product Hunt** launch once M3 + demo are ready. |
| C7 | **Light targeted outbound** | Hand-picked EU DTC brands visibly running Meta ads with real stock. Short, specific, written (fits the brand). No mass cold spam. |

## 4. First 90 days (sequenced)

- **Weeks 1–2:** P0 (M1–M6). Instrument funnel, fix messaging, demo asset,
  onboarding emails. Recruit 5 friendly beta users for feedback + first
  testimonials.
- **Weeks 3–6:** Ship the WooCommerce plugin (C1) + first 4 SEO pages (C2/M6).
  Start build-in-public (C4). Begin community presence (C3).
- **Weeks 7–12:** Product Hunt + directories (C6). Agency outbound (C5).
  First case study from a real user. Only after funnel data looks healthy,
  test small Google Search ads on high-intent keywords.

## 5. Targets (first 90 days, deliberately modest for solo)

- 1,000 marketing-site visits/mo by week 12.
- 40–60 trials started; **activation (store connected + first alert) ≥ 50%**.
- 8–15 paying orgs (trial→paid ≥ 20%). At ~€22 net/mo each (post-VAT/Paddle),
  this is proof-of-channel, not profit — the goal is a repeatable loop.
- 1 published case study, 1 agency partner signed.

## 6. Dependencies / watch-outs

- **Ads-guard hero depends on Meta app approval** (currently blocked/Beta).
  Until then, market alerts+reports; treat ads-guard as the upgrade story.
- **No Shopify App Store** discovery — over-index on WooCommerce directory +
  SEO + direct to compensate.
- Keep the app **tracking-free** (spec/brand promise). Analytics live only on
  the marketing site — never in-app.
- Solo bandwidth is the real constraint: pick **2 channels and do them well**
  (recommend C1 WooCommerce plugin + C2/C6 SEO/PH) before spreading thin.

## 7. Decisions that would sharpen this plan

- Primary market: DACH-first (assumed) vs broad-EU vs Turkey-first?
- Weekly hours available for marketing?
- Any budget for a demo video / a few hundred € of test ads?
- Comfortable being the face (build-in-public, LinkedIn)?
