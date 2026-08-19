import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-chrome";

const ZIP = "/downloads/steadel-connector-1.0.0.zip";
const VERSION = "1.0.0";
const SIZE = "6 KB";

export const metadata: Metadata = {
  title: { absolute: "Free WooCommerce low-stock plugin — Steadel" },
  description:
    "A free WordPress plugin that shows which WooCommerce products are running low, right in your admin — and connects your store to Steadel for automatic low-stock alerts. EU-hosted, GDPR-first.",
  alternates: { canonical: "https://app.steadel.com/woocommerce-plugin" },
  openGraph: {
    title: "Free WooCommerce low-stock plugin — Steadel",
    description:
      "See which WooCommerce products are running low, right in wp-admin. Free, no account needed.",
    url: "https://app.steadel.com/woocommerce-plugin",
    siteName: "Steadel",
    type: "website",
  },
};

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-amber" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default function WooPluginPage() {
  return (
    <div className="theme-dark min-h-screen">
      <MarketingHeader />

      <section className="mx-auto max-w-3xl px-6 pt-14 pb-16 sm:pt-20">
        <p className="font-mono text-xs tracking-[0.2em] text-amber uppercase">
          Free WordPress plugin
        </p>
        <h1
          className="mt-4 text-3xl font-semibold text-paper sm:text-4xl"
          style={{ fontFamily: "var(--font-heading)", textWrap: "balance" }}
        >
          See what&rsquo;s running low, right inside WordPress.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-mist">
          A small, free plugin that lists the WooCommerce products at or below your
          low-stock threshold — no account, no setup, nothing sent anywhere. When you
          want to be told instead of having to check, it connects your store to
          Steadel in one click.
        </p>

        {/* Download */}
        <div className="mt-9 rounded-2xl border border-amber/30 bg-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
                Steadel — Low-stock alerts &amp; reports
              </p>
              <p className="mt-1 font-mono text-xs text-mist/70">
                v{VERSION} · {SIZE} · GPLv2+ · free forever
              </p>
            </div>
            <a
              href={ZIP}
              download
              className="rounded-md bg-amber px-6 py-3 font-medium text-ink transition hover:bg-amber-dark"
            >
              Download .zip
            </a>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-mist/70">
            We&rsquo;re submitting this to the WordPress.org plugin directory. Until it
            lands there, WordPress won&rsquo;t auto-update a plugin installed this way —
            we&rsquo;ll put the directory link on this page as soon as it&rsquo;s approved,
            and switching over takes a click.
          </p>
        </div>

        {/* What it does */}
        <h2 className="mt-14 text-xl font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
          What it does
        </h2>
        <div className="mt-4 space-y-3">
          {[
            [
              "Shows what's running low — locally",
              "A table of the products at or below the low-stock threshold you already set in WooCommerce. Built from your own data, shown only in your admin. No account required.",
            ],
            [
              "Connects to Steadel in one click",
              "For the part a snapshot can't do: an email or Slack alert the moment stock dips, plus scheduled inventory reports. Uses WooCommerce's own approval screen — no API keys to copy.",
            ],
          ].map(([title, body]) => (
            <div key={title} className="flex gap-3 rounded-xl border border-white/8 bg-panel/60 p-5">
              <Check />
              <div>
                <h3 className="font-semibold text-paper">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-mist">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Install */}
        <h2 className="mt-14 text-xl font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
          Installing it
        </h2>
        <ol className="mt-4 space-y-3">
          {[
            "Download the .zip above.",
            "In WordPress, go to Plugins → Add New Plugin → Upload Plugin, choose the file, and click Install Now.",
            "Click Activate. A Steadel item appears in your admin menu.",
            "Open it to see your low-stock products — and, if you want automatic alerts, click Connect this store to Steadel.",
          ].map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="mt-0.5 font-mono text-sm text-amber">{String(i + 1).padStart(2, "0")}</span>
              <span className="leading-relaxed text-mist">{step}</span>
            </li>
          ))}
        </ol>

        {/* Requirements + privacy */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/8 bg-panel/60 p-5">
            <h3 className="font-semibold text-paper">Requirements</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              WordPress 6.0+, WooCommerce 6.0+, PHP 7.4+. Tested on WordPress 7.0 and
              WooCommerce 10.9.
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-panel/60 p-5">
            <h3 className="font-semibold text-paper">What it sends</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Nothing, on its own. The low-stock list never leaves your site. Data is
              shared only after you click Connect and approve access yourself.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-2xl border border-white/10 bg-panel p-6 text-center">
          <p className="text-lg font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
            Want to be told before you run out?
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-mist">
            Steadel watches your stock and alerts you in time to reorder. EU-hosted in
            Germany, GDPR-first. 14 days free, no card required.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-amber px-6 py-2.5 font-medium text-ink transition hover:bg-amber-dark"
            >
              Start free trial
            </Link>
            <Link
              href="/guides"
              className="rounded-md border border-mist/25 px-6 py-2.5 font-medium text-paper transition hover:border-mist/60"
            >
              Read the guides
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
