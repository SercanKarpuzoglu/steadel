import Link from "next/link";
import { Logo } from "@/components/logo";

/** Shared top nav for the marketing site (landing + guides). Dark surface. */
export function MarketingHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" aria-label="Steadel home">
        <Logo on="dark" />
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/guides" className="hidden text-mist transition hover:text-paper sm:inline">
          Guides
        </Link>
        <Link href="/#pricing" className="hidden text-mist transition hover:text-paper sm:inline">
          Pricing
        </Link>
        <Link href="/login" className="text-mist transition hover:text-paper">
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-amber px-4 py-2 font-medium text-ink transition hover:bg-amber-dark"
        >
          Start free trial
        </Link>
      </nav>
    </header>
  );
}

/** Shared footer for the marketing site. */
export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-mist/70 sm:flex-row sm:items-center sm:justify-between">
        <Logo on="dark" />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/guides" className="transition hover:text-paper">Guides</Link>
          <Link href="/privacy" className="transition hover:text-paper">Privacy</Link>
          <Link href="/terms" className="transition hover:text-paper">Terms</Link>
          <Link href="/refunds" className="transition hover:text-paper">Refunds</Link>
          <Link href="/login" className="transition hover:text-paper">Sign in</Link>
        </div>
        <p className="font-mono text-xs">Steadel is a product of Parsius · EU-hosted in Germany 🇩🇪</p>
      </div>
    </footer>
  );
}
