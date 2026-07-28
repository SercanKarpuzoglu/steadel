import { db } from "@/db";
import { pageViews } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternal|embedly|monitor|headless|lighthouse/i;

function referrerHost(ref: unknown): string | null {
  if (typeof ref !== "string" || !ref) return null;
  try {
    const host = new URL(ref).host.replace(/^www\./, "");
    if (!host || host.endsWith("steadel.com")) return null; // internal / self
    return host.slice(0, 120);
  } catch {
    return null;
  }
}

/**
 * First-party, cookieless pageview collector for the marketing site.
 * No IP, no user id, no cookie — only path, external referrer host, coarse
 * country (Cloudflare header) and device class. Always 204s so it never
 * disrupts the page.
 */
export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") ?? "";
    if (BOT_RE.test(ua)) return new Response(null, { status: 204 });

    const body = (await request.json().catch(() => ({}))) as { path?: unknown; ref?: unknown };
    const path = typeof body.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 512) : null;
    if (!path) return new Response(null, { status: 204 });

    const country = (request.headers.get("cf-ipcountry") ?? "").slice(0, 2).toUpperCase() || null;
    const device = /mobile|android|iphone|ipad|ipod/i.test(ua) ? "mobile" : "desktop";

    await db.insert(pageViews).values({
      path,
      referrerHost: referrerHost(body.ref),
      country: country === "XX" || country === "T1" ? null : country,
      device,
    });
  } catch {
    // Analytics must never break a page view — swallow everything.
  }
  return new Response(null, { status: 204 });
}
