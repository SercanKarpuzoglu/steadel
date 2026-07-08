import { logger } from "@/lib/logger";
import type { ExternalProduct, ShopifyCredentials, StoreProvider } from "./types";

const API_VERSION = "2025-01";

async function shopifyGraphql<T>(
  domain: string,
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(
    `https://${domain}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  if (!res.ok) {
    throw new Error(`Shopify API ${res.status} for ${domain}`);
  }
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

interface ProductsPage {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Array<{
      id: string;
      title: string;
      variants: {
        nodes: Array<{
          id: string;
          title: string;
          sku: string | null;
          inventoryQuantity: number | null;
        }>;
      };
    }>;
  };
}

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($cursor: String) {
    products(first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        variants(first: 100) {
          nodes {
            id
            title
            sku
            inventoryQuantity
          }
        }
      }
    }
  }
`;

export class ShopifyProvider implements StoreProvider {
  constructor(
    private domain: string,
    private credentials: ShopifyCredentials,
  ) {}

  async fetchProducts(): Promise<ExternalProduct[]> {
    const result: ExternalProduct[] = [];
    let cursor: string | null = null;
    do {
      const page: ProductsPage = await shopifyGraphql<ProductsPage>(
        this.domain,
        this.credentials.accessToken,
        PRODUCTS_QUERY,
        { cursor },
      );
      for (const product of page.products.nodes) {
        for (const variant of product.variants.nodes) {
          const title =
            variant.title && variant.title !== "Default Title"
              ? `${product.title} — ${variant.title}`
              : product.title;
          result.push({
            externalId: variant.id,
            title,
            sku: variant.sku || null,
            inventoryQty: variant.inventoryQuantity ?? 0,
          });
        }
      }
      cursor = page.products.pageInfo.hasNextPage
        ? page.products.pageInfo.endCursor
        : null;
    } while (cursor);
    return result;
  }
}

/** Exchanges the OAuth code for a permanent access token. */
export async function exchangeOAuthCode(
  shop: string,
  code: string,
): Promise<ShopifyCredentials> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });
  if (!res.ok) {
    throw new Error(`Shopify token exchange failed (${res.status})`);
  }
  const json = (await res.json()) as { access_token: string; scope: string };
  return { accessToken: json.access_token, scope: json.scope };
}

const WEBHOOK_TOPICS = [
  "INVENTORY_LEVELS_UPDATE",
  "PRODUCTS_UPDATE",
  "APP_UNINSTALLED",
] as const;

const WEBHOOK_CREATE_MUTATION = /* GraphQL */ `
  mutation Subscribe($topic: WebhookSubscriptionTopic!, $url: URL!) {
    webhookSubscriptionCreate(
      topic: $topic
      webhookSubscription: { callbackUrl: $url, format: JSON }
    ) {
      userErrors {
        field
        message
      }
    }
  }
`;

/** Registers our webhook subscriptions after install; failures are logged, not fatal (polling covers gaps). */
export async function registerWebhooks(
  domain: string,
  credentials: ShopifyCredentials,
): Promise<void> {
  const callbackUrl = `${process.env.APP_URL}/api/webhooks/shopify`;
  for (const topic of WEBHOOK_TOPICS) {
    try {
      await shopifyGraphql(domain, credentials.accessToken, WEBHOOK_CREATE_MUTATION, {
        topic,
        url: callbackUrl,
      });
    } catch (err) {
      logger.warn({ domain, topic, err: String(err) }, "webhook registration failed");
    }
  }
}
