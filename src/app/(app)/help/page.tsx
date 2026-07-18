import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { listDocs, searchDocs } from "@/lib/docs";
import { isAdminEmail, requireUser } from "@/lib/org";

export const metadata: Metadata = { title: "Help" };

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q = "" } = await searchParams;
  const isAdmin = isAdminEmail(user.email);
  const docs = listDocs(isAdmin);
  const results = q ? await searchDocs(q, isAdmin) : [];

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold">Help</h1>
      <p className="text-sm text-ink-soft">
        Written guides for everything Steadel does. Can&apos;t find an
        answer? Email{" "}
        <a
          href="mailto:support@steadel.com"
          className="text-amber-text hover:underline"
        >
          support@steadel.com
        </a>
        {" "}— we reply within one business day.
      </p>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search the guides…"
          className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 shrink-0 cursor-pointer rounded-md bg-amber px-4 text-sm font-medium text-ink hover:bg-amber-dark"
        >
          Search
        </button>
      </form>

      {q && (
        <Card>
          <CardTitle>Results for “{q}”</CardTitle>
          {results.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No matches.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {results.map((hit) => (
                <li key={hit.slug}>
                  <Link
                    href={`/help/${hit.slug}`}
                    className="font-medium text-amber-text hover:underline"
                  >
                    {hit.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-ink-soft">{hit.snippet}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {docs.map((doc) => (
          <Link key={doc.slug} href={`/help/${doc.slug}`}>
            <Card className="h-full transition hover:border-amber/60">
              <CardTitle>{doc.title}</CardTitle>
              <CardDescription>{doc.description}</CardDescription>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-xs text-ink-soft">
        Legal: <Link href="/privacy" className="hover:underline">Privacy policy</Link>{" "}
        · <Link href="/terms" className="hover:underline">Terms of service</Link>{" "}
        · <Link href="/refunds" className="hover:underline">Refund policy</Link>
      </p>
    </div>
  );
}
