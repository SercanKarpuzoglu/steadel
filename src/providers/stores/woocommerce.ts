import type { ExternalProduct, StoreProvider } from "./types";

export interface WooCredentials {
  siteUrl: string; // https://example.com
  consumerKey: string;
  consumerSecret: string;
}

interface WooProduct {
  id: number;
  name: string;
  sku: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: string; // instock | outofstock | onbackorder
}

function authHeader(credentials: WooCredentials): string {
  return `Basic ${Buffer.from(
    `${credentials.consumerKey}:${credentials.consumerSecret}`,
  ).toString("base64")}`;
}

/**
 * WooCommerce REST API provider (SPEC §5.2). Product-level stock; sites
 * that don't manage stock numerically map instock→1 / outofstock→0 so the
 * ads guard still works.
 */
export class WooProvider implements StoreProvider {
  constructor(private credentials: WooCredentials) {}

  async fetchProducts(): Promise<ExternalProduct[]> {
    const result: ExternalProduct[] = [];
    let page = 1;
    for (;;) {
      const url = new URL(
        "/wp-json/wc/v3/products",
        this.credentials.siteUrl,
      );
      url.searchParams.set("per_page", "100");
      url.searchParams.set("page", String(page));
      url.searchParams.set("status", "publish");

      const res = await fetch(url, {
        headers: { Authorization: authHeader(this.credentials) },
      });
      if (!res.ok) {
        throw new Error(`WooCommerce API ${res.status} for ${url.hostname}`);
      }
      const products = (await res.json()) as WooProduct[];
      for (const product of products) {
        result.push({
          externalId: String(product.id),
          title: product.name,
          sku: product.sku || null,
          inventoryQty: product.manage_stock
            ? (product.stock_quantity ?? 0)
            : product.stock_status === "instock"
              ? 1
              : 0,
        });
      }
      if (products.length < 100) break;
      page += 1;
    }
    return result;
  }
}

/** Connection test: one authenticated request must succeed. */
export async function validateWooCredentials(
  credentials: WooCredentials,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const url = new URL("/wp-json/wc/v3/products", credentials.siteUrl);
    url.searchParams.set("per_page", "1");
    const res = await fetch(url, {
      headers: { Authorization: authHeader(credentials) },
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "The API keys were rejected — check key and secret." };
    }
    if (!res.ok) {
      return { ok: false, error: `The store responded with HTTP ${res.status}.` };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not reach the site — check the URL (https required).",
    };
  }
}

export function normalizeSiteUrl(input: string): string | null {
  let raw = input.trim();
  if (!/^https?:\/\//.test(raw)) raw = `https://${raw}`;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}
