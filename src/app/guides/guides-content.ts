export type GuideSection = { h2: string; paras: string[]; bullets?: string[] };
export type Guide = {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  h1: string;
  lede: string;
  readMinutes: number;
  sections: GuideSection[];
  faq: { q: string; a: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "gdpr-low-stock-alerts",
    seoTitle: "GDPR-hosted low-stock alerts for Shopify & WooCommerce",
    seoDescription:
      "Get low-stock alerts and inventory reports without sending your store data to the US. EU-hosted in Germany, GDPR-first, no tracking. How it works and how to set it up.",
    eyebrow: "Guide · Inventory & privacy",
    h1: "GDPR-hosted low-stock alerts for Shopify & WooCommerce",
    lede: "If you run an EU store, the tool that watches your inventory sees your products, your stock levels, and your sales patterns. Here is how to get reliable low-stock alerts without that data leaving the EU.",
    readMinutes: 4,
    sections: [
      {
        h2: "Why where your inventory tool runs matters",
        paras: [
          "Most low-stock apps are built by US companies and process your data on US infrastructure. For an EU merchant that means a transfer of personal and commercial data across the Atlantic — the exact thing the Schrems rulings made risky, and the thing your own privacy policy has to disclose to customers.",
          "Inventory data feels harmless until you remember it is tied to orders, and orders are tied to people. Keeping the whole chain inside the EU is the simplest way to stay clearly on the right side of the GDPR.",
        ],
      },
      {
        h2: "What 'GDPR-hosted' actually means for Steadel",
        paras: [
          "Steadel runs entirely on infrastructure in Germany. Your store data is read, processed, and stored in the EU — there is no US sub-processor in the path for the core product.",
        ],
        bullets: [
          "Hosted in Germany; data stays in the EU.",
          "No tracking cookies and no advertising pixels — the app itself is analytics-free by design.",
          "Read-only, never write. Steadel reads products and inventory, and stores nothing about your customers or orders.",
        ],
      },
      {
        h2: "How the alerts work",
        paras: [
          "You connect a store, set a threshold (say, 10 units), and pick where to be notified. When a stock change pushes a tracked product below your threshold, Steadel sends an alert by email or Slack. Shopify pushes changes to Steadel by webhook, so alerts land within seconds; WooCommerce stores are checked every 10 minutes, so allow a few minutes there.",
          "Scheduled reports add the slower, calmer view: a regular digest of what is low, what is moving, and what is about to run out, delivered to your inbox so nobody has to sit and watch a dashboard.",
        ],
      },
      {
        h2: "Setting it up",
        paras: ["It takes a few minutes and no engineering:"],
        bullets: [
          "Start a free trial and connect Shopify or WooCommerce.",
          "Set a low-stock threshold per store (you can tune it later).",
          "Choose email or Slack for alerts, and a schedule for reports.",
        ],
      },
    ],
    faq: [
      {
        q: "Is my store data sent to the US?",
        a: "No. Steadel's core product runs on infrastructure in Germany and processes your data in the EU.",
      },
      {
        q: "What access does Steadel need?",
        a: "Read-only — Steadel never asks for write access. On Shopify it requests just the products and inventory scopes. WooCommerce's approval screen is coarser: it only offers store-wide Read or Write, so it lists more than Steadel uses. Steadel requests Read, reads only products and inventory, and stores nothing about your customers or orders.",
      },
      {
        q: "Does it work with both Shopify and WooCommerce?",
        a: "Yes — both are supported, with the same alerts and reports.",
      },
    ],
  },
  {
    slug: "shopify-low-stock-alerts",
    seoTitle: "Shopify low-stock alerts, without a US app",
    seoDescription:
      "Set up low-stock alerts for your Shopify store with an EU-hosted, GDPR-first tool. Real-time email or Slack notifications and scheduled inventory reports.",
    eyebrow: "Guide · Shopify",
    h1: "Shopify low-stock alerts, without a US app",
    lede: "Shopify tells you a product is out of stock after it happens. To catch it before, you need something watching stock changes and warning you in time to reorder. Here is how to do that with an EU-hosted tool.",
    readMinutes: 4,
    sections: [
      {
        h2: "The problem with finding out late",
        paras: [
          "By the time a bestseller shows 'sold out' on your storefront, you have already lost the sales you could have had that day — and, if you run ads, the spend that sent shoppers to an empty page.",
          "The fix is not more dashboards. It is a single, timely alert that reaches you where you already are, with enough lead time to actually do something about it.",
        ],
      },
      {
        h2: "How Steadel watches your Shopify stock",
        paras: [
          "Steadel connects to Shopify with read-only access to products and inventory. When Shopify reports an inventory change, Steadel checks it against the threshold you set and, if the product has dropped below it, sends an alert right away.",
        ],
        bullets: [
          "Real-time low-stock alerts by email or Slack.",
          "Per-store thresholds you can tune as you learn your sell-through.",
          "Scheduled reports — a regular inventory digest in your inbox.",
        ],
      },
      {
        h2: "Why EU merchants pick an EU-hosted option",
        paras: [
          "Many Shopify inventory apps process data in the US. Steadel is hosted in Germany and keeps your data in the EU, with no tracking cookies and no ad pixels. For a GDPR-conscious brand that is one fewer sub-processor to disclose and one fewer cross-border transfer to justify.",
        ],
      },
      {
        h2: "Setting it up on Shopify",
        paras: ["Connect and configure in a few minutes:"],
        bullets: [
          "Start a free trial (no card required) and connect your Shopify store.",
          "Set your low-stock threshold and pick email or Slack.",
          "Optionally schedule a weekly report so nothing slips through.",
        ],
      },
    ],
    faq: [
      {
        q: "Does Steadel need write access to my Shopify store?",
        a: "No. It uses read-only access to products and inventory to send alerts and reports.",
      },
      {
        q: "How fast are the alerts?",
        a: "Alerts are sent as soon as Steadel receives and evaluates the stock change from Shopify — typically within seconds.",
      },
      {
        q: "Can I use Slack instead of email?",
        a: "Yes. You can receive low-stock alerts by email, Slack, or both.",
      },
    ],
  },
  {
    slug: "pause-meta-ads-out-of-stock",
    seoTitle: "Pause Meta ads when a product is out of stock (WooCommerce)",
    seoDescription:
      "Stop paying for Meta ads that send shoppers to sold-out products. How stock-aware ad pausing works for WooCommerce with Steadel — currently in Beta.",
    eyebrow: "Guide · Ads & inventory",
    h1: "How to pause Meta ads when a product is out of stock (WooCommerce)",
    lede: "Running Meta ads for a product that has sold out burns budget on clicks that can't convert. Here is how stock-aware ad pausing works — and what ships today versus what is still in Beta.",
    readMinutes: 4,
    sections: [
      {
        h2: "Why sold-out ads quietly waste money",
        paras: [
          "Ad platforms keep spending as long as the campaign is live — they have no idea a product is out of stock. So the ad keeps running, the clicks keep coming, and each one lands on a page that cannot take the order. You pay for the traffic and get the bounce.",
          "For stores that sell physical stock that genuinely runs out — fashion, food and drink, cosmetics, small-batch DTC — this happens more often than most owners realise.",
        ],
      },
      {
        h2: "What stock-aware ad pausing does",
        paras: [
          "The idea is simple: link an ad set to the product it promotes, and when that product drops to zero (or below a threshold you set), pause the ad automatically. When stock is back, it can resume. No more manual watching, no more paying to advertise an empty shelf.",
        ],
      },
      {
        h2: "What ships today vs. Beta",
        paras: [
          "Steadel's low-stock alerts and scheduled reports for WooCommerce ship today and are the reliable core — you will always know before you run out.",
          "The ads guard — automatically pausing Meta ads for out-of-stock products — is currently in Beta and rolling out. We would rather be honest about that than promise a switch we can't flip for everyone yet. If it is the reason you are here, start a trial and ask to join the beta.",
        ],
        bullets: [
          "Today: real-time low-stock alerts + scheduled reports (Shopify & WooCommerce).",
          "Beta, rolling out: pause Meta ads for out-of-stock products.",
        ],
      },
      {
        h2: "Getting started on WooCommerce",
        paras: ["Start with the part that ships today and layer the ads guard on when you are in the beta:"],
        bullets: [
          "Start a free trial and connect your WooCommerce store.",
          "Set thresholds and turn on low-stock alerts.",
          "Ask to join the ads-guard beta from your dashboard.",
        ],
      },
    ],
    faq: [
      {
        q: "Can Steadel pause my Meta ads automatically today?",
        a: "The ads guard is in Beta and rolling out. Low-stock alerts and scheduled reports ship today; you can request beta access to the ads guard from your dashboard.",
      },
      {
        q: "Does this work with WooCommerce?",
        a: "Yes. Low-stock alerts and reports support WooCommerce today, and the ads guard beta covers Meta ads.",
      },
      {
        q: "Is my data kept in the EU?",
        a: "Yes. Steadel is hosted in Germany and keeps your store data in the EU, with no tracking cookies.",
      },
    ],
  },
  {
    slug: "woocommerce-low-stock-notifications",
    seoTitle: "WooCommerce low-stock notifications: what's built in, and what it misses",
    seoDescription:
      "WooCommerce can email you when stock runs low. Here is how to turn it on, what the built-in notifications actually cover, where they fall short, and what to do about it.",
    eyebrow: "Guide · WooCommerce",
    h1: "WooCommerce low-stock notifications: what's built in, and what it misses",
    lede: "WooCommerce ships with low-stock emails, and for a small catalogue they may be all you need. It is worth knowing exactly what they do before paying for anything else — so here is the honest version.",
    readMinutes: 5,
    sections: [
      {
        h2: "Turning on the built-in notifications",
        paras: [
          "WooCommerce has this feature already, and a surprising number of stores never switch it on. In your WordPress admin go to WooCommerce → Settings → Products → Inventory. There you can enable low-stock and out-of-stock notifications, set the thresholds at which they fire, and choose which address (or addresses) they go to.",
          "If you sell physical stock and have not looked at that screen, do it before anything else. It costs nothing and it is better than finding out from a customer.",
        ],
        bullets: [
          "Enable low stock notifications — the master switch for the emails.",
          "Low stock threshold — the store-wide number at which a product counts as low.",
          "Notification recipient(s) — who gets the email; defaults to the admin address.",
        ],
      },
      {
        h2: "Per-product thresholds",
        paras: [
          "One number rarely fits a whole catalogue. A product you sell forty of a week is in trouble at 20 units; something you sell one of a month is fine at 3. WooCommerce lets you override the store-wide threshold on individual products, under the product's Inventory tab.",
          "Use it on your bestsellers at least. It is the difference between an alert that arrives in time to reorder and one that arrives after the fact.",
        ],
      },
      {
        h2: "Where the built-in emails fall short",
        paras: [
          "The limitations are not bugs — they are the natural edge of a feature that ships with a store platform rather than a tool built for the job.",
        ],
        bullets: [
          "Email only. There is no Slack, and no other channel — if your team lives somewhere else, the alert does not.",
          "One email per product event. With a large catalogue that becomes a stream people learn to ignore, which is the same as having no alerts.",
          "No summary. There is no regular digest of what is low across the store, so nobody ever sees the whole picture at once.",
          "No history. Once the email is read or lost, there is no record to look back at.",
          "One store at a time. If you run several stores, there is no combined view — you are checking each one separately.",
        ],
      },
      {
        h2: "A free middle step",
        paras: [
          "If you just want to see what is low right now without any of the above, our free WordPress plugin adds a Steadel screen to your admin that lists the products at or below your existing WooCommerce threshold. It needs no account, and it sends nothing anywhere — the list is built from your own store data and shown only to you.",
          "That covers the 'let me look' case. It does not cover the 'tell me without me having to look' case, which is the one that actually prevents stock-outs.",
        ],
      },
      {
        h2: "When it is worth adding a tool",
        paras: [
          "If the built-in emails are enough for you, use them — genuinely. It is worth paying for something else only when one of these is true: you want alerts in Slack as well as email, you want a scheduled digest instead of a stream of one-off messages, you run more than one store, or the built-in emails are getting lost and you keep being surprised.",
          "That is what Steadel does: alerts by email or Slack, scheduled inventory reports, and Shopify and WooCommerce stores side by side. WooCommerce stores are checked every 10 minutes, so allow a few minutes for an alert. It is hosted in Germany and keeps your data in the EU.",
        ],
      },
    ],
    faq: [
      {
        q: "Does WooCommerce send low-stock emails by default?",
        a: "The feature is built in and configurable under WooCommerce → Settings → Products → Inventory, where you set the thresholds and the recipient. Check that screen rather than assuming either way — many stores have never opened it.",
      },
      {
        q: "Can I set a different threshold for one product?",
        a: "Yes. Each product's Inventory tab can override the store-wide low-stock threshold, which is worth doing for anything that sells quickly.",
      },
      {
        q: "Do I need a plugin at all?",
        a: "Not for basic email alerts — WooCommerce covers that. A tool earns its place when you need Slack, scheduled digests, several stores in one view, or alerts you will not lose in an inbox.",
      },
    ],
  },
  {
    slug: "low-stock-threshold",
    seoTitle: "How to set a low-stock threshold you can actually trust",
    seoDescription:
      "A low-stock threshold is only useful if it fires while you can still reorder. Here is the simple arithmetic — sales velocity, lead time and a buffer — with a worked example.",
    eyebrow: "Guide · Inventory",
    h1: "How to set a low-stock threshold you can actually trust",
    lede: "Most stores pick a round number, alert on it, and then wonder why the warnings keep arriving too late. The threshold is not a preference — it is arithmetic, and the arithmetic is not hard.",
    readMinutes: 5,
    sections: [
      {
        h2: "Why one number for the whole catalogue fails",
        paras: [
          "Set the threshold at 10 for everything and you get two failures at once. Your fast seller hits 10 on a Friday afternoon and is gone by Saturday, long before the restock lands — the alert was useless. Meanwhile your slow seller sits at 9 for four months, alerting you about a problem that will not arrive until spring.",
          "The number that matters is not how many units are left. It is how many days of selling are left, measured against how long a restock takes.",
        ],
      },
      {
        h2: "The arithmetic",
        paras: [
          "Three inputs, one number:",
        ],
        bullets: [
          "Daily sales — how many units of this product you sell on an average day.",
          "Lead time — the days between deciding to reorder and having stock on the shelf, including your supplier's turnaround and your own admin.",
          "Buffer — a few extra days for the week the product goes unexpectedly well, or the supplier is slow.",
        ],
      },
      {
        h2: "A worked example",
        paras: [
          "Say you sell a house coffee blend. You move about 6 bags a day. Your roaster needs 5 working days, and getting the order placed realistically takes you another 2. So your true lead time is 7 days, and you want 3 days of buffer.",
          "6 a day × (7 + 3) days = 60. Your threshold for that product is 60 bags, not 10. An alert at 10 would reach you roughly eight days too late — which is exactly why the old threshold felt useless.",
          "Now run the same sum for a product you sell one of every other day, with the same supplier: 0.5 × 10 = 5. Same store, same supplier, thresholds of 60 and 5. That is the point.",
        ],
      },
      {
        h2: "Where to put the numbers",
        paras: [
          "In WooCommerce, the store-wide default lives under WooCommerce → Settings → Products → Inventory, and each product's Inventory tab can override it. Set the store-wide number for the long tail, then do the arithmetic properly for your top sellers — the twenty or so products that make most of your revenue. Those are the ones where being out of stock actually costs you.",
          "In Steadel you set a threshold per store and adjust as you learn, and alerts go to email or Slack.",
        ],
      },
      {
        h2: "Revisit it when the season turns",
        paras: [
          "Sales velocity is not fixed. A product that moved 6 a day in October may move 20 a day in December, and a threshold calculated in the quiet season will fire far too late in the busy one. Recheck your top sellers before any period you expect to be busy.",
          "The honest test is simple: when an alert arrives, could you still have reordered in time? If the answer is no more than once, the number is too low, not the tool.",
        ],
      },
    ],
    faq: [
      {
        q: "What if I do not know my lead time?",
        a: "Use the longest a restock has actually taken recently, not the one your supplier quotes. Include your own delay in placing the order — that part is often bigger than people expect.",
      },
      {
        q: "Should every product get its own threshold?",
        a: "No. Do the arithmetic for the products that carry your revenue, and leave the long tail on a sensible store-wide default. The effort belongs where a stock-out actually costs money.",
      },
      {
        q: "My alerts are too noisy. Is the threshold wrong?",
        a: "Usually the threshold is fine and it is the delivery that is wrong — a stream of one-off emails is easy to tune out. A scheduled digest of what is low, plus immediate alerts only for the products you care about, tends to fix it.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
