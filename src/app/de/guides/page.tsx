import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-chrome";
import { GUIDES_DE } from "./guides-content-de";

const BASE = "https://app.steadel.com";

export const metadata: Metadata = {
  title: { absolute: "Leitfäden — Lagerbestand, WooCommerce & DSGVO | Steadel" },
  description:
    "Praxisnahe Leitfäden zu Lagerbestand-Warnungen, Meldebestand und DSGVO-konformem Hosting für Shopify- und WooCommerce-Shops in der EU.",
  alternates: {
    canonical: `${BASE}/de/guides`,
    languages: {
      de: `${BASE}/de/guides`,
      en: `${BASE}/guides`,
      "x-default": `${BASE}/guides`,
    },
  },
};

export default function GuidesDeIndex() {
  return (
    <div className="theme-dark min-h-screen" lang="de">
      <MarketingHeader lang="de" />

      <section className="mx-auto max-w-3xl px-6 pt-14 pb-16 sm:pt-20">
        <p className="font-mono text-xs tracking-[0.2em] text-amber uppercase">Leitfäden</p>
        <h1
          className="mt-4 text-3xl font-semibold text-paper sm:text-4xl"
          style={{ fontFamily: "var(--font-heading)", textWrap: "balance" }}
        >
          Lagerbestand und Werbebudget im Griff.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-mist">
          Kurze, praxisnahe Leitfäden für Shopify- und WooCommerce-Händler in der EU — wie Sie
          knappe Bestände bemerken, bevor sie Umsatz kosten, und das ohne Ihre Daten in die USA
          zu geben.
        </p>

        <div className="mt-10 grid gap-4">
          {GUIDES_DE.map((g) => (
            <Link
              key={g.slug}
              href={`/de/guides/${g.slug}`}
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
                {g.readMinutes} Min. Lesezeit · Lesen →
              </p>
            </Link>
          ))}
        </div>

        <Link
          href="/woocommerce-plugin"
          className="mt-6 block rounded-2xl border border-amber/30 bg-panel p-6 transition hover:border-amber/60"
        >
          <p className="font-mono text-[11px] tracking-wide text-amber uppercase">Kostenloses Plugin</p>
          <h2 className="mt-2 text-lg font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
            Steadel für WooCommerce
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            Sehen Sie direkt im WordPress-Adminbereich, welche Produkte knapp werden — kostenlos,
            ohne Konto. In einer Minute installiert →
          </p>
        </Link>

        <p className="mt-8 text-sm text-mist/70">
          <Link href="/guides" className="underline underline-offset-2 hover:text-paper">
            These guides in English
          </Link>
        </p>
      </section>

      <MarketingFooter lang="de" />
    </div>
  );
}
