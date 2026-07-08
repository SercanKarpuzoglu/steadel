import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { decryptJson, type EncryptedPayload } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { MockStoreProvider } from "@/providers/stores/mock";
import { ShopifyProvider } from "@/providers/stores/shopify";
import {
  isMockDomain,
  type ShopifyCredentials,
  type StoreProvider,
} from "@/providers/stores/types";

export type Store = typeof stores.$inferSelect;

/** A stock movement observed during sync — consumed by the automation engine. */
export interface StockChange {
  productId: string;
  storeId: string;
  orgId: string;
  title: string;
  sku: string | null;
  oldQty: number | null; // null = product first seen
  newQty: number;
  tracked: boolean;
  thresholdQty: number | null;
}

export function getProviderForStore(store: Store): StoreProvider {
  if (isMockDomain(store.domain)) {
    return new MockStoreProvider(store.domain);
  }
  if (store.platform === "shopify") {
    if (!store.credentialsEncrypted) {
      throw new Error(`Store ${store.id} has no credentials`);
    }
    const credentials = decryptJson<ShopifyCredentials>(
      store.credentialsEncrypted as EncryptedPayload,
    );
    return new ShopifyProvider(store.domain, credentials);
  }
  throw new Error(`No provider for platform ${store.platform}`);
}

/**
 * Pulls the full catalog from the platform and upserts it. Returns the list
 * of inventory changes so callers (webhooks, polling, automations) can react.
 */
export async function syncStoreProducts(storeId: string): Promise<StockChange[]> {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new Error(`Store ${storeId} not found`);
  if (store.status === "disconnected") return [];

  let external;
  try {
    external = await getProviderForStore(store).fetchProducts();
  } catch (err) {
    logger.error({ storeId, err: String(err) }, "store sync failed");
    await db
      .update(stores)
      .set({ status: "error" })
      .where(eq(stores.id, storeId));
    throw err;
  }

  const existing = await db.query.products.findMany({
    where: eq(products.storeId, storeId),
  });
  const byExternalId = new Map(existing.map((p) => [p.externalId, p]));

  const changes: StockChange[] = [];
  for (const item of external) {
    const current = byExternalId.get(item.externalId);
    if (!current) {
      const [inserted] = await db
        .insert(products)
        .values({
          storeId,
          externalId: item.externalId,
          title: item.title,
          sku: item.sku,
          inventoryQty: item.inventoryQty,
        })
        .returning();
      changes.push({
        productId: inserted.id,
        storeId,
        orgId: store.orgId,
        title: item.title,
        sku: item.sku,
        oldQty: null,
        newQty: item.inventoryQty,
        tracked: inserted.tracked,
        thresholdQty: inserted.thresholdQty,
      });
      continue;
    }
    if (
      current.title !== item.title ||
      current.sku !== item.sku ||
      current.inventoryQty !== item.inventoryQty
    ) {
      await db
        .update(products)
        .set({
          title: item.title,
          sku: item.sku,
          inventoryQty: item.inventoryQty,
          updatedAt: new Date(),
        })
        .where(eq(products.id, current.id));
    }
    if (current.inventoryQty !== item.inventoryQty) {
      changes.push({
        productId: current.id,
        storeId,
        orgId: store.orgId,
        title: item.title,
        sku: item.sku,
        oldQty: current.inventoryQty,
        newQty: item.inventoryQty,
        tracked: current.tracked,
        thresholdQty: current.thresholdQty,
      });
    }
  }

  await db
    .update(stores)
    .set({ lastSyncAt: new Date(), status: "connected" })
    .where(eq(stores.id, storeId));

  return changes;
}

/** Connects a demo store backed by the mock provider (dev / trials without Shopify). */
export async function connectMockStore(
  orgId: string,
  actorId: string,
): Promise<Store> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const [store] = await db
    .insert(stores)
    .values({
      orgId,
      platform: "shopify",
      name: "Demo Store",
      domain: `demo-${suffix}.steadel-mock.test`,
      status: "connected",
    })
    .returning();
  await syncStoreProducts(store.id);
  await recordAudit({
    orgId,
    actor: actorId,
    action: "store.connected",
    payload: { storeId: store.id, domain: store.domain, mock: true },
  });
  return store;
}

export async function disconnectStore(
  storeId: string,
  orgId: string,
  actorId: string,
): Promise<void> {
  await db
    .update(stores)
    .set({ status: "disconnected", credentialsEncrypted: null })
    .where(eq(stores.id, storeId));
  await recordAudit({
    orgId,
    actor: actorId,
    action: "store.disconnected",
    payload: { storeId },
  });
}
