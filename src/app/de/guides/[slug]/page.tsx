import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-chrome";
import { GUIDES_DE, getGuideDe } from "../guides-content-de";

const BASE = "https://app.steadel.com";

export function generateStaticParams() {
  return GUIDES_DE.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideDe(slug);
  if (!guide) return {};
  const url = `${BASE}/de/guides/${guide.slug}`;
  return {
    title: { absolute: guide.seoTitle },
    description: guide.seoDescription,
    alternates: {
      canonical: url,
      languages: {
        de: url,
        en: `${BASE}/guides/${guide.enSlug}`,
        "x-default": `${BASE}/guides/${guide.enSlug}`,
      },
    },
    openGraph: {
      title: guide.seoTitle,
      description: guide.seoDescription,
      url,
      siteName: "Steadel",
      type: "article",
      locale: "de_DE",
    },
  };
}

export default async function GuideDePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideDe(slug);
  if (!guide) notFound();

  const others = GUIDES_DE.filter((g) => g.slug !== guide.slug);

  return (
    <div className="theme-dark min-h-screen" lang="de">
      <MarketingHeader lang="de" />

      <article className="mx-auto max-w-2xl px-6 pt-12 pb-16 sm:pt-16">
        <Link href="/de/guides" className="font-mono text-xs tracking-wide text-mist/70 transition hover:text-paper">
          ← Alle Leitfäden
        </Link>
        <p className="mt-6 font-mono text-xs tracking-[0.2em] text-amber uppercase">{guide.eyebrow}</p>
        <h1
          className="mt-4 text-3xl leading-tight font-semibold text-paper sm:text-4xl"
          style={{ fontFamily: "var(--font-heading)", textWrap: "balance" }}
        >
          {guide.h1}
        </h1>
        <p className="mt-3 font-mono text-xs text-mist/60">{guide.readMinutes} Min. Lesezeit</p>
        <p className="mt-6 text-lg leading-relaxed text-mist">{guide.lede}</p>

        <div className="mt-10 space-y-10">
          {guide.sections.map((section) => (
            <section key={section.h2}>
              <h2 className="text-xl font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
                {section.h2}
              </h2>
              {section.paras.map((p, i) => (
                <p key={i} className="mt-3 leading-relaxed text-mist">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-mist">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-amber/30 bg-panel p-6 text-center">
          <p className="text-lg font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
            Nie wieder unbemerkt ausverkauft.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-mist">
            Warnungen bei niedrigem Lagerbestand und geplante Berichte für Shopify &amp; WooCommerce.
            Gehostet in Deutschland, DSGVO-konform. 14 Tage kostenlos, ohne Kreditkarte.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-block rounded-md bg-amber px-6 py-2.5 font-medium text-ink transition hover:bg-amber-dark"
          >
            Kostenlos testen
          </Link>
        </div>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-paper" style={{ fontFamily: "var(--font-heading)" }}>
            Häufige Fragen
          </h2>
          <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {guide.faq.map((item) => (
              <div key={item.q} className="py-4">
                <p className="font-medium text-paper">{item.q}</p>
                <p className="mt-1.5 leading-relaxed text-mist">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related */}
        <section className="mt-12">
          <p className="font-mono text-xs tracking-wide text-mist/60 uppercase">Weitere Leitfäden</p>
          <div className="mt-4 grid gap-3">
            {others.map((g) => (
              <Link
                key={g.slug}
                href={`/de/guides/${g.slug}`}
                className="rounded-xl border border-white/8 bg-panel p-4 transition hover:border-mist/30"
              >
                <p className="font-medium text-paper">{g.h1}</p>
                <p className="mt-1 text-sm text-mist">{g.seoDescription}</p>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm text-mist/70">
            <Link href={`/guides/${guide.enSlug}`} className="underline underline-offset-2 hover:text-paper">
              Read this guide in English
            </Link>
          </p>
        </section>
      </article>

      <MarketingFooter lang="de" />
    </div>
  );
}
