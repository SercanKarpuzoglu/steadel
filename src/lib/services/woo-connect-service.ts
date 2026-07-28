import { randomBytes } from "node:crypto";
import { getRedis } from "@/lib/redis";

/**
 * One-click WooCommerce connect via the official wc-auth flow. We stash the
 * initiating org + site behind a short-lived, single-use token (Redis, no
 * migration) and pass that token to WooCommerce as `user_id`; Woo echoes it
 * back to our callback along with the generated read-only API keys.
 */
export type PendingWoo = { orgId: string; actorId: string; siteUrl: string };

const TTL_SECONDS = 30 * 60;
const KEY = (token: string) => `woo_connect:${token}`;

function appUrl(): string {
  return process.env.APP_URL ?? "https://app.steadel.com";
}

export async function createWooConnect(pending: PendingWoo): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await getRedis().set(KEY(token), JSON.stringify(pending), "EX", TTL_SECONDS);
  return token;
}

export async function consumeWooConnect(token: string): Promise<PendingWoo | null> {
  const redis = getRedis();
  const raw = await redis.get(KEY(token));
  if (!raw) return null;
  await redis.del(KEY(token)); // single use
  try {
    return JSON.parse(raw) as PendingWoo;
  } catch {
    return null;
  }
}

/** Build the WooCommerce authorize URL the merchant is redirected to. */
export function buildWooAuthorizeUrl(siteUrl: string, token: string): string {
  const url = new URL("/wc-auth/v1/authorize", siteUrl);
  url.searchParams.set("app_name", "Steadel");
  url.searchParams.set("scope", "read"); // Steadel only reads products/inventory
  url.searchParams.set("user_id", token);
  url.searchParams.set("return_url", `${appUrl()}/stores?connected=woo`);
  url.searchParams.set("callback_url", `${appUrl()}/api/woo/callback`);
  return url.toString();
}
