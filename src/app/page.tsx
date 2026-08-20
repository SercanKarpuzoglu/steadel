import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-chrome";

export const metadata: Metadata = {
  title: {
    absolute: "Steadel — Low-stock alerts & reports for EU Shopify & WooCommerce stores",
  },
  description:
    "Steadel warns you before a product runs out — low-stock alerts and scheduled reports for Shopify and WooCommerce. Hosted in Germany, GDPR-first, flat pricing.",
  alternates: { canonical: "https://app.steadel.com/" },
  openGraph: {
    title: "Never get caught out of stock — Steadel",
    description:
      "Low-stock alerts and scheduled reports for EU Shopify & WooCommerce brands. Hosted in Germany, GDPR-first.",
    url: "https://app.steadel.com/",
    siteName: "Steadel",
    type: "website",
  },
};

const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-amber" {...s}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="theme-dark min-h-screen">
      <MarketingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-20 sm:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Copy */}
          <div>
            <p className="rise rise-1 font-mono text-xs tracking-[0.2em] text-amber uppercase">
              For EU Shopify &amp; WooCommerce brands
            </p>
            <h1
              className="rise rise-2 mt-5 text-4xl leading-[1.08] font-semibold text-paper sm:text-5xl"
              style={{ fontFamily: "var(--font-heading)", textWrap: "balance" }}
            >
              Never get caught out of stock.
            </h1>
            <p className="rise rise-3 mt-6 max-w-xl text-lg leading-relaxed text-mist">
              Steadel watches your inventory and warns you <em className="text-paper not-italic">before</em> a
              product runs out — with low-stock alerts and scheduled reports. Hosted in Germany,
              GDPR-first, zero tracking.
            </p>
            <div className="rise rise-4 mt-9 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-md bg-amber px-6 py-3 font-medium text-ink transition hover:bg-amber-dark"
              >
                Start free trial
              </Link>
              <Link
                href="#how"
                className="rounded-md border border-mist/25 px-6 py-3 font-medium text-paper transition hover:border-mist/60"
              >
                See how it works
              </Link>
            </div>
            <p className="rise rise-4 mt-6 font-mono text-xs tracking-wide text-mist/70">
              EU-hosted in Germany · GDPR-first · No tracking cookies · Flat pricing
            </p>
          </div>

          {/* Product visual: a sample low-stock alert */}
          <div className="rise rise-4 relative mx-auto w-full max-w-md lg:mx-0">
            <div aria-hidden className="pointer-events-none absolute -inset-8 rounded-full bg-amber/10 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-panel p-5 shadow-2xl">
              <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                <LogoMark className="h-6 w-6" />
                <span className="text-sm font-medium text-paper">Steadel alerts</span>
                <span className="ml-auto font-mono text-[11px] text-mist/60">now</span>
              </div>
              <p className="mt-4 text-base font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
                2 products are running low
              </p>
              <div className="mt-4 space-y-3">
                {[
                  { emoji: "☕", name: "Ethiopia Yirgacheffe 250g", sku: "KAF-ETH-250", left: "4 left" },
                  { emoji: "🫙", name: "Cold Brew Concentrate 1L", sku: "CLD-BRW-1L", left: "6 left" },
                ].map((p) => (
                  <div key={p.sku} className="flex items-center gap-3 rounded-lg bg-ink/60 p-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-base">{p.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-paper">{p.name}</p>
                      <p className="font-mono text-[11px] text-mist/60">{p.sku}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber/15 px-2.5 py-1 text-xs font-medium text-amber">
                      {p.left}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-xs text-mist/60">Below your threshold of 10</span>
                <span className="text-sm font-medium text-amber">View in dashboard →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost of running out */}
      <section className="border-t border-white/10 bg-panel/40">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-paper sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
              When a bestseller sells out, you lose twice.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-mist">
              You lose the sale — and the ad spend that drove the shopper to an empty product page.
              Most stores only notice after the refunds and the angry emails. Steadel is the quiet
              alarm that goes off first.
            </p>
          </div>
        </div>
      </section>

      {/* What Steadel does today */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <h2 className="text-2xl font-semibold text-paper sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          What Steadel does today
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Low-stock alerts",
              body: "Know before you sell out. Set a threshold per store and get an email or Slack ping within minutes of stock dipping below it — seconds on Shopify.",
            },
            {
              title: "Scheduled reports",
              body: "Inventory health in your inbox, on your schedule. See what's moving, what's low, and what's about to run out — no dashboard-watching.",
            },
            {
              title: "Ads guard",
              body: "Automatically pause Meta ads for products that are already out of stock, so you stop paying for clicks that can't convert.",
              beta: true,
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-white/8 bg-panel p-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
                  {f.title}
                </h3>
                {f.beta && (
                  <span className="rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-[10px] tracking-wide text-amber uppercase">
                    Beta
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-mist">{f.body}</p>
              {f.beta && <p className="mt-3 text-xs text-mist/60">Rolling out — join the beta from your dashboard.</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Why EU brands */}
      <section className="border-y border-white/10 bg-panel/40">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <h2 className="max-w-2xl text-2xl font-semibold text-paper sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
            Built for EU brands who care where their data lives.
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {[
              ["Hosted in Germany", "Your data stays in the EU on infrastructure in Germany. No US transfer, no Schrems worries."],
              ["GDPR-first, zero tracking", "No tracking cookies, no ad pixels. The app itself is analytics-free by design."],
              ["Flat, transparent pricing", "€29 / €59 / €119 a month — a fixed price, never a cut of your ad spend."],
              ["Calm & written", "No upsells, no sales calls, no dark patterns. Just real human support over email."],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3">
                <Check />
                <div>
                  <h3 className="font-semibold text-paper">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-mist">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <h2 className="text-2xl font-semibold text-paper sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Up and running in minutes.
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            ["01", "Connect your store", "Link Shopify or WooCommerce in a couple of clicks — read-only, never write. Steadel reads products and inventory and stores nothing about your customers or orders."],
            ["02", "Set your thresholds", "Tell Steadel what 'low' means for each store. Pick email or Slack for alerts."],
            ["03", "Get alerted before you run out", "Steadel keeps checking your stock around the clock and warns you in time to reorder."],
          ].map(([num, title, body]) => (
            <div key={num}>
              <span className="font-mono text-sm text-amber">{num}</span>
              <h3 className="mt-3 text-lg font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/10 bg-panel/40">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold text-paper sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
              Simple, flat pricing.
            </h2>
            <p className="font-mono text-xs tracking-wide text-mist/70">14-day free trial · no card required · cancel anytime</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { name: "Starter", price: "29", blurb: "1 store, core alerts & reports.", features: ["1 store", "Low-stock alerts", "Scheduled reports"] },
              { name: "Growth", price: "59", blurb: "For growing multi-store brands.", features: ["3 stores", "Unlimited automations", "Priority email support"], featured: true },
              { name: "Agency", price: "119", blurb: "White-label for agencies.", features: ["10 stores", "White-label reports", "Everything in Growth"] },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-xl border p-6 ${p.featured ? "border-amber/50 bg-panel" : "border-white/8 bg-panel/60"}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
                    {p.name}
                  </h3>
                  {p.featured && (
                    <span className="rounded-full bg-amber px-2 py-0.5 font-mono text-[10px] tracking-wide text-ink uppercase">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-3">
                  <span className="text-3xl font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
                    €{p.price}
                  </span>
                  <span className="text-sm text-mist">/mo</span>
                </p>
                <p className="mt-2 text-sm text-mist">{p.blurb}</p>
                <ul className="mt-5 space-y-2">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex gap-2 text-sm text-mist">
                      <Check />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-6 block rounded-md px-4 py-2.5 text-center text-sm font-medium transition ${
                    p.featured
                      ? "bg-amber text-ink hover:bg-amber-dark"
                      : "border border-mist/25 text-paper hover:border-mist/60"
                  }`}
                >
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold text-paper sm:text-4xl" style={{ fontFamily: "var(--font-heading)", textWrap: "balance" }}>
          Keep your store steady.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-mist">
          Start protecting your bestsellers today. Free for 14 days, no card required.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-md bg-amber px-7 py-3 font-medium text-ink transition hover:bg-amber-dark"
        >
          Start free trial
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
