import { createHmac, timingSafeEqual } from "crypto";

// read_orders is intentionally excluded: it is Shopify "protected customer
// data" and needs an approval request before it can ship in an app version.
// Core features (stock tracking, alerts, ads guard) only need products +
// inventory; /reports sales charts light up if the scope is ever granted
// and re-added here.
export const SHOPIFY_SCOPES = "read_products,read_inventory";

/** Valid *.myshopify.com domains only — used before redirecting to OAuth. */
export function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

export function buildAuthorizeUrl(params: {
  shop: string;
  apiKey: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(`https://${params.shop}/admin/oauth/authorize`);
  url.searchParams.set("client_id", params.apiKey);
  url.searchParams.set("scope", SHOPIFY_SCOPES);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  return url.toString();
}

/**
 * Verifies the `hmac` query parameter on the OAuth callback: HMAC-SHA256 of
 * the remaining query string (sorted, hmac excluded), hex-encoded.
 */
export function verifyOAuthHmac(
  query: Record<string, string>,
  secret: string,
): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;
  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("&");
  const digest = createHmac("sha256", secret).update(message).digest("hex");
  return safeCompare(digest, hmac);
}

/**
 * Verifies the X-Shopify-Hmac-Sha256 header on webhooks: HMAC-SHA256 of the
 * raw request body, base64-encoded.
 */
export function verifyWebhookHmac(
  rawBody: string,
  hmacHeader: string | null,
  secret: string,
): boolean {
  if (!hmacHeader) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  return safeCompare(digest, hmacHeader);
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
