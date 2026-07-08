import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { organizations, orgMembers, products, users } from "@/db/schema";
import {
  connectMockStore,
  disconnectStore,
  syncStoreProducts,
} from "@/lib/services/store-service";
import { alreadyProcessed, markProcessed } from "@/lib/webhooks";
import { getMockCatalog, setMockCatalog } from "@/providers/stores/mock";

async function createOrg() {
  const [user] = await db
    .insert(users)
    .values({
      email: `store-test-${randomUUID()}@example.com`,
      passwordHash: "x",
      name: "Store Tester",
      emailVerifiedAt: new Date(),
    })
    .returning();
  const [org] = await db
    .insert(organizations)
    .values({ name: "Test Org", ownerUserId: user.id, plan: "trial" })
    .returning();
  await db
    .insert(orgMembers)
    .values({ orgId: org.id, userId: user.id, role: "owner" });
  return { user, org };
}

describe("store sync (integration, mock provider)", () => {
  it("connects a mock store and imports the catalog", async () => {
    const { user, org } = await createOrg();
    const store = await connectMockStore(org.id, user.id);

    expect(store.status).toBe("connected");
    const rows = await db.query.products.findMany({
      where: eq(products.storeId, store.id),
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.tracked === false)).toBe(true);
  });

  it("detects stock changes between syncs", async () => {
    const { user, org } = await createOrg();
    const store = await connectMockStore(org.id, user.id);

    const catalog = getMockCatalog(store.domain);
    const target = catalog.find((p) => p.externalId === "m-2")!;
    setMockCatalog(
      store.domain,
      catalog.map((p) =>
        p.externalId === "m-2" ? { ...p, inventoryQty: 0 } : p,
      ),
    );

    const changes = await syncStoreProducts(store.id);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      orgId: org.id,
      storeId: store.id,
      oldQty: target.inventoryQty,
      newQty: 0,
    });

    // stable catalog → no changes
    expect(await syncStoreProducts(store.id)).toHaveLength(0);
  });

  it("reports first-seen products with oldQty null", async () => {
    const { user, org } = await createOrg();
    const store = await connectMockStore(org.id, user.id);

    const catalog = getMockCatalog(store.domain);
    setMockCatalog(store.domain, [
      ...catalog,
      { externalId: "m-new", title: "New Thing", sku: null, inventoryQty: 7 },
    ]);

    const changes = await syncStoreProducts(store.id);
    expect(changes).toHaveLength(1);
    expect(changes[0].oldQty).toBeNull();
    expect(changes[0].newQty).toBe(7);
  });

  it("skips syncing disconnected stores", async () => {
    const { user, org } = await createOrg();
    const store = await connectMockStore(org.id, user.id);
    await disconnectStore(store.id, org.id, user.id);

    setMockCatalog(store.domain, []);
    expect(await syncStoreProducts(store.id)).toHaveLength(0);
  });
});

describe("webhook idempotency", () => {
  it("marks a delivery processed exactly once", async () => {
    const id = `wh-${randomUUID()}`;
    expect(await alreadyProcessed("shopify", id)).toBe(false);
    expect(await markProcessed("shopify", id)).toBe(true);
    expect(await alreadyProcessed("shopify", id)).toBe(true);
    expect(await markProcessed("shopify", id)).toBe(false);
  });
});
