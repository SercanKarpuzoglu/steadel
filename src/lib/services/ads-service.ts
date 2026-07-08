import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { adConnections, adLinks, automationRules, products, stores } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { decryptJson, type EncryptedPayload } from "@/lib/crypto";
import { MockMetaProvider } from "@/providers/ads/mock-meta";
import { MetaProvider } from "@/providers/ads/meta";
import {
  isMockAccountRef,
  type AdsProvider,
  type MetaCredentials,
} from "@/providers/ads/types";

export type AdConnection = typeof adConnections.$inferSelect;
export type AdLink = typeof adLinks.$inferSelect;

export function getAdsProvider(connection: AdConnection): AdsProvider {
  if (isMockAccountRef(connection.accountRef)) {
    return new MockMetaProvider(connection.accountRef!);
  }
  if (!connection.credentialsEncrypted || !connection.accountRef) {
    throw new Error(`Ad connection ${connection.id} missing credentials`);
  }
  const credentials = decryptJson<MetaCredentials>(
    connection.credentialsEncrypted as EncryptedPayload,
  );
  return new MetaProvider(connection.accountRef, credentials);
}

/** Creates a mock Meta connection (dev / while the Meta app is in review). */
export async function connectMockMeta(
  orgId: string,
  actorId: string,
): Promise<AdConnection> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const [connection] = await db
    .insert(adConnections)
    .values({
      orgId,
      provider: "meta",
      status: "connected",
      accountRef: `mock-${suffix}`,
    })
    .returning();
  await recordAudit({
    orgId,
    actor: actorId,
    action: "ads.connected",
    payload: { connectionId: connection.id, mock: true },
  });
  return connection;
}

export async function listOrgAdConnections(orgId: string) {
  return db.query.adConnections.findMany({
    where: eq(adConnections.orgId, orgId),
  });
}

/** Links a product to an ad set and ensures the store's ads_guard rule exists. */
export async function linkProductToAdSet(params: {
  orgId: string;
  actorId: string;
  productId: string;
  adConnectionId: string;
  externalAdsetRef: string;
  externalCampaignRef?: string;
  mode: "pause_on_zero" | "pause_below_threshold";
  thresholdQty?: number | null;
}): Promise<AdLink> {
  // Both ends must belong to the caller's org.
  const productRow = await db
    .select({ product: products, store: stores })
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(and(eq(products.id, params.productId), eq(stores.orgId, params.orgId)))
    .limit(1);
  if (!productRow[0]) throw new Error("Product not found in organization");

  const connection = await db.query.adConnections.findFirst({
    where: and(
      eq(adConnections.id, params.adConnectionId),
      eq(adConnections.orgId, params.orgId),
    ),
  });
  if (!connection) throw new Error("Ad connection not found in organization");

  const [link] = await db
    .insert(adLinks)
    .values({
      productId: params.productId,
      adConnectionId: params.adConnectionId,
      externalAdsetRef: params.externalAdsetRef,
      externalCampaignRef: params.externalCampaignRef ?? null,
      mode: params.mode,
      thresholdQty: params.thresholdQty ?? null,
      state: "unknown",
    })
    .returning();

  // The ads_guard rule is the per-store on/off switch for the engine.
  const storeId = productRow[0].store.id;
  const existingRule = await db.query.automationRules.findFirst({
    where: and(
      eq(automationRules.storeId, storeId),
      eq(automationRules.type, "ads_guard"),
    ),
  });
  if (!existingRule) {
    await db.insert(automationRules).values({
      storeId,
      type: "ads_guard",
      config: {},
      enabled: true,
    });
  }

  await recordAudit({
    orgId: params.orgId,
    actor: params.actorId,
    action: "ads.linked",
    payload: { linkId: link.id, productId: params.productId, adset: params.externalAdsetRef },
  });
  return link;
}

export async function unlinkAdSet(params: {
  orgId: string;
  actorId: string;
  linkId: string;
}): Promise<void> {
  const rows = await db
    .select({ link: adLinks })
    .from(adLinks)
    .innerJoin(products, eq(adLinks.productId, products.id))
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(and(eq(adLinks.id, params.linkId), eq(stores.orgId, params.orgId)))
    .limit(1);
  if (!rows[0]) throw new Error("Link not found");
  await db.delete(adLinks).where(eq(adLinks.id, params.linkId));
  await recordAudit({
    orgId: params.orgId,
    actor: params.actorId,
    action: "ads.unlinked",
    payload: { linkId: params.linkId },
  });
}

export async function listOrgAdLinks(orgId: string) {
  return db
    .select({
      link: adLinks,
      product: products,
      store: stores,
      connection: adConnections,
    })
    .from(adLinks)
    .innerJoin(products, eq(adLinks.productId, products.id))
    .innerJoin(stores, eq(products.storeId, stores.id))
    .innerJoin(adConnections, eq(adLinks.adConnectionId, adConnections.id))
    .where(eq(stores.orgId, orgId));
}

export async function linksForProducts(productIds: string[]) {
  if (productIds.length === 0) return [];
  return db
    .select({ link: adLinks, connection: adConnections })
    .from(adLinks)
    .innerJoin(adConnections, eq(adLinks.adConnectionId, adConnections.id))
    .where(inArray(adLinks.productId, productIds));
}
