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
          "You connect a store, set a threshold (say, 10 units), and pick where to be notified. When a stock change pushes a tracked product below your threshold, Steadel sends an alert by email or Slack — usually within seconds of the change arriving from Shopify or WooCommerce.",
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
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
