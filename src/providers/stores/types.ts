/** A product (variant-level) as reported by the e-commerce platform. */
export interface ExternalProduct {
  externalId: string;
  title: string;
  sku: string | null;
  inventoryQty: number;
}

/**
 * Read-only access to a connected store's catalog. Implementations:
 * ShopifyProvider (GraphQL Admin API), WooProvider (REST, M6),
 * MockStoreProvider (dev/tests).
 */
export interface StoreProvider {
  fetchProducts(): Promise<ExternalProduct[]>;
}

export interface ShopifyCredentials {
  accessToken: string;
  scope: string;
}

export function isMockDomain(domain: string): boolean {
  return domain.endsWith(".steadel-mock.test");
}
