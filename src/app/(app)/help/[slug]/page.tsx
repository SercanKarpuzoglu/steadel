import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocHtml } from "@/lib/docs";
import { isAdminEmail, requireUser } from "@/lib/org";

export const metadata: Metadata = { title: "Help" };

export default async function HelpDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const doc = await getDocHtml(slug, isAdminEmail(user.email));
  if (!doc) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/help" className="text-sm text-ink-soft hover:text-ink">
        ← All guides
      </Link>
      <article
        className="doc-content"
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />
    </div>
  );
}
