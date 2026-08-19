import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-chrome";
import { GUIDES } from "./guides-content";

export const metadata: Metadata = {
  title: { absolute: "Guides — inventory alerts, Shopify & WooCommerce, GDPR | Steadel" },
  description:
    "Practical guides on low-stock alerts, inventory reports and stock-aware ads for EU Shopify and WooCommerce stores. EU-hosted, GDPR-first.",
  alternates: { canonical: "https://app.steadel.com/guides" },
};

export default function GuidesIndex() {
  return (
    <div className="theme-dark min-h-screen">
      <MarketingHeader />

      <section className="mx-auto max-w-3xl px-6 pt-14 pb-16 sm:pt-20">
        <p className="font-mono text-xs tracking-[0.2em] text-amber uppercase">Guides</p>
        <h1
          className="mt-4 text-3xl font-semibold text-paper sm:text-4xl"
          style={{ fontFamily: "var(--font-heading)", textWrap: "balance" }}
        >
          Keeping stock and ad spend under control.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-mist">
          Short, practical guides for EU Shopify and WooCommerce brands — on catching low stock
          before it costs you, and doing it without shipping your data to the US.
        </p>

        <div className="mt-10 grid gap-4">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group rounded-2xl border border-white/8 bg-panel p-6 transition hover:border-mist/30"
            >
              <p className="font-mono text-[11px] tracking-wide text-amber uppercase">{g.eyebrow}</p>
              <h2
                className="mt-2 text-lg font-semibold text-paper"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {g.h1}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-mist">{g.seoDescription}</p>
              <p className="mt-3 font-mono text-xs text-mist/60">
                {g.readMinutes} min read · Read →
              </p>
            </Link>
          ))}
        </div>

        <Link
          href="/woocommerce-plugin"
          className="mt-6 block rounded-2xl border border-amber/30 bg-panel p-6 transition hover:border-amber/60"
        >
          <p className="font-mono text-[11px] tracking-wide text-amber uppercase">Free plugin</p>
          <h2 className="mt-2 text-lg font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
            Steadel for WooCommerce
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            See which products are running low right inside wp-admin — free, no account
            needed. Download it and install in a minute →
          </p>
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
