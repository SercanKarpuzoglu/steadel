import fs from "fs/promises";
import path from "path";
import { marked } from "marked";

export interface DocMeta {
  slug: string;
  title: string;
  description: string;
  adminOnly: boolean;
}

export const DOCS: DocMeta[] = [
  {
    slug: "user-guide",
    title: "User guide",
    description:
      "Connecting Shopify & WooCommerce, automations, alerts, billing FAQ.",
    adminOnly: false,
  },
  {
    slug: "api",
    title: "API reference",
    description: "Public API v1 — authentication, endpoints, curl examples.",
    adminOnly: false,
  },
  {
    slug: "setup-guide",
    title: "Setup guide (owner)",
    description: "Deploying Steadel on Hetzner: Docker, DNS, TLS, backups.",
    adminOnly: true,
  },
  {
    slug: "runbook",
    title: "Runbook (owner)",
    description: "Operations: logs, retries, key rotation, incidents.",
    adminOnly: true,
  },
];

function docsDir(): string {
  return path.join(process.cwd(), "docs");
}

export function listDocs(includeAdmin: boolean): DocMeta[] {
  return DOCS.filter((d) => includeAdmin || !d.adminOnly);
}

export async function getDocHtml(
  slug: string,
  includeAdmin: boolean,
): Promise<{ meta: DocMeta; html: string } | null> {
  const meta = listDocs(includeAdmin).find((d) => d.slug === slug);
  if (!meta) return null;
  try {
    const markdown = await fs.readFile(
      path.join(docsDir(), `${slug}.md`),
      "utf8",
    );
    const html = await marked.parse(markdown);
    return { meta, html };
  } catch {
    return null;
  }
}

export interface DocSearchHit {
  slug: string;
  title: string;
  snippet: string;
}

/** Case-insensitive full-text search across the rendered guides. */
export async function searchDocs(
  query: string,
  includeAdmin: boolean,
): Promise<DocSearchHit[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: DocSearchHit[] = [];
  for (const meta of listDocs(includeAdmin)) {
    try {
      const markdown = await fs.readFile(
        path.join(docsDir(), `${meta.slug}.md`),
        "utf8",
      );
      const lower = markdown.toLowerCase();
      const index = lower.indexOf(q);
      if (index === -1) continue;
      const start = Math.max(0, index - 60);
      const end = Math.min(markdown.length, index + q.length + 120);
      const snippet = `${start > 0 ? "…" : ""}${markdown
        .slice(start, end)
        .replace(/[#`*|]/g, "")
        .trim()}…`;
      hits.push({ slug: meta.slug, title: meta.title, snippet });
    } catch {
      // doc missing on disk — skip
    }
  }
  return hits;
}
