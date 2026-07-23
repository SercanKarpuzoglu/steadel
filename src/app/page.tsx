import Link from "next/link";

export default function Home() {
  return (
    <main className="theme-dark flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <p className="font-mono text-sm tracking-widest text-paper uppercase">
          Steadel
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold text-paper sm:text-5xl">
          Steady operations for your store.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-mist">
          Stock-aware ads guard, low-stock alerts and scheduled reports for
          Shopify and WooCommerce. EU-hosted, GDPR-first.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded-md bg-paper px-6 py-3 font-medium text-ink transition hover:bg-paper-soft"
        >
          Start free trial
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-mist/30 px-6 py-3 font-medium text-paper transition hover:border-mist/60"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
