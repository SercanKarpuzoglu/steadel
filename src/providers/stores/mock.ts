import type { ExternalProduct, StoreProvider } from "./types";

/**
 * In-memory store provider for development and tests. Catalogs are keyed by
 * store domain; tests mutate them via setMockCatalog to simulate stock
 * movements between syncs.
 */
const catalogs = new Map<string, ExternalProduct[]>();

const DEFAULT_CATALOG: ExternalProduct[] = [
  { externalId: "m-1", title: "Linen Throw Blanket", sku: "LIN-THR-01", inventoryQty: 42 },
  { externalId: "m-2", title: "Ceramic Pour-Over Set", sku: "CER-POV-02", inventoryQty: 3 },
  { externalId: "m-3", title: "Walnut Serving Board", sku: "WAL-SRV-03", inventoryQty: 0 },
  { externalId: "m-4", title: "Brass Desk Lamp", sku: "BRA-LMP-04", inventoryQty: 17 },
  { externalId: "m-5", title: "Stoneware Mug — Amber", sku: "STO-MUG-AM", inventoryQty: 120 },
];

export function setMockCatalog(domain: string, products: ExternalProduct[]) {
  catalogs.set(domain, products);
}

export function getMockCatalog(domain: string): ExternalProduct[] {
  if (!catalogs.has(domain)) {
    catalogs.set(
      domain,
      DEFAULT_CATALOG.map((p) => ({ ...p })),
    );
  }
  return catalogs.get(domain)!;
}

export class MockStoreProvider implements StoreProvider {
  constructor(private domain: string) {}

  async fetchProducts(): Promise<ExternalProduct[]> {
    return getMockCatalog(this.domain).map((p) => ({ ...p }));
  }
}
