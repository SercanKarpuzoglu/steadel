import Link from "next/link";
import { Logo } from "@/components/logo";
import { MarketingAnalytics } from "@/components/marketing-analytics";

type Lang = "en" | "de";

const T = {
  en: { guides: "Guides", pricing: "Pricing", signIn: "Sign in", trial: "Start free trial",
        plugin: "WooCommerce plugin", privacy: "Privacy", terms: "Terms", refunds: "Refunds",
        tagline: "Steadel is a product of Parsius · EU-hosted in Germany \u{1F1E9}\u{1F1EA}",
        guidesHref: "/guides" },
  de: { guides: "Leitf\u00e4den", pricing: "Preise", signIn: "Anmelden", trial: "Kostenlos testen",
        plugin: "WooCommerce-Plugin", privacy: "Datenschutz", terms: "AGB", refunds: "Erstattungen",
        tagline: "Steadel ist ein Produkt von Parsius \u00b7 Gehostet in Deutschland \u{1F1E9}\u{1F1EA}",
        guidesHref: "/de/guides" },
} as const;

/** Shared top nav for the marketing site (landing + guides). Dark surface. */
export function MarketingHeader({ lang = "en" }: { lang?: Lang }) {
  const t = T[lang];
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <MarketingAnalytics />
      <Link href="/" aria-label="Steadel home">
        <Logo on="dark" />
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link href={t.guidesHref} className="hidden text-mist transition hover:text-paper sm:inline">
          {t.guides}
        </Link>
        <Link href="/#pricing" className="hidden text-mist transition hover:text-paper sm:inline">
          {t.pricing}
        </Link>
        <Link href="/login" className="text-mist transition hover:text-paper">
          {t.signIn}
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-amber px-4 py-2 font-medium text-ink transition hover:bg-amber-dark"
        >
          {t.trial}
        </Link>
      </nav>
    </header>
  );
}

/** Shared footer for the marketing site. */
export function MarketingFooter({ lang = "en" }: { lang?: Lang }) {
  const t = T[lang];
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-mist/70 sm:flex-row sm:items-center sm:justify-between">
        <Logo on="dark" />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href={t.guidesHref} className="transition hover:text-paper">{t.guides}</Link>
          <Link href="/woocommerce-plugin" className="transition hover:text-paper">{t.plugin}</Link>
          <Link href="/privacy" className="transition hover:text-paper">{t.privacy}</Link>
          <Link href="/terms" className="transition hover:text-paper">{t.terms}</Link>
          <Link href="/refunds" className="transition hover:text-paper">{t.refunds}</Link>
          <a
            href="https://www.youtube.com/@Steadel_App"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-paper"
          >
            YouTube
          </a>
          <Link href="/login" className="transition hover:text-paper">{t.signIn}</Link>
        </div>
        <p className="font-mono text-xs">{t.tagline}</p>
      </div>
    </footer>
  );
}
