import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { adLinks, alertsLog, organizations, products, users } from "@/db/schema";
import { clearOutbox, getOutbox } from "@/lib/mail";
import { connectMockMeta, linkProductToAdSet } from "@/lib/services/ads-service";
import { signupUser } from "@/lib/services/auth-service";
import { connectMockStore } from "@/lib/services/store-service";
import { runStoreSync } from "@/jobs/worker";
import {
  getMockAdSetStatus,
  setMockAdSetStatus,
} from "@/providers/ads/mock-meta";
import { getMockCatalog, setMockCatalog } from "@/providers/stores/mock";

async function setup() {
  const email = `ads-${randomUUID()}@example.com`;
  await signupUser({ name: "Ads Tester", email, password: "password-123" });
  const user = (await db.query.users.findFirst({
    where: eq(users.email, email),
  }))!;
  const org = (await db.query.organizations.findFirst({
    where: eq(organizations.ownerUserId, user.id),
  }))!;
  const store = await connectMockStore(org.id, user.id);
  await db
    .update(products)
    .set({ tracked: true })
    .where(eq(products.storeId, store.id));
  const connection = await connectMockMeta(org.id, user.id);

  const productRow = (
    await db.query.products.findMany({
      where: eq(products.storeId, store.id),
    })
  ).find((p) => p.externalId === "m-1")!;

  const link = await linkProductToAdSet({
    orgId: org.id,
    actorId: user.id,
    productId: productRow.id,
    adConnectionId: connection.id,
    externalAdsetRef: "adset-1",
    externalCampaignRef: "camp-1",
    mode: "pause_on_zero",
  });
  return { email, user, org, store, connection, product: productRow, link };
}

function setQty(domain: string, externalId: string, qty: number) {
  setMockCatalog(
    domain,
    getMockCatalog(domain).map((p) =>
      p.externalId === externalId ? { ...p, inventoryQty: qty } : p,
    ),
  );
}

describe("ads guard engine (integration, mock providers)", () => {
  let envBefore: string | undefined;

  beforeAll(() => {
    envBefore = process.env.ADS_GUARD_ENABLED;
    process.env.ADS_GUARD_ENABLED = "true";
  });
  afterAll(() => {
    process.env.ADS_GUARD_ENABLED = envBefore;
  });
  beforeEach(() => clearOutbox());

  it("pauses on sell-out and resumes on restock", async () => {
    const { email, org, store, connection, link } = await setup();

    // sell out
    setQty(store.domain, "m-1", 0);
    await runStoreSync(store.id);

    expect(getMockAdSetStatus(connection.accountRef!, "adset-1")).toBe("PAUSED");
    let updated = (await db.query.adLinks.findFirst({
      where: eq(adLinks.id, link.id),
    }))!;
    expect(updated.state).toBe("paused_by_steadel");

    const pausedMail = getOutbox().find(
      (m) => m.to === email && m.subject.includes("paused"),
    );
    expect(pausedMail).toBeDefined();
    expect(pausedMail!.subject).toContain("sold out");

    const pausedLogs = await db.query.alertsLog.findMany({
      where: eq(alertsLog.orgId, org.id),
    });
    expect(pausedLogs.some((l) => l.type === "ads_paused")).toBe(true);

    // restock
    clearOutbox();
    setQty(store.domain, "m-1", 25);
    await runStoreSync(store.id);

    expect(getMockAdSetStatus(connection.accountRef!, "adset-1")).toBe("ACTIVE");
    updated = (await db.query.adLinks.findFirst({
      where: eq(adLinks.id, link.id),
    }))!;
    expect(updated.state).toBe("active");

    const resumedMail = getOutbox().find(
      (m) => m.to === email && m.subject.includes("resumed"),
    );
    expect(resumedMail).toBeDefined();
  });

  it("never resumes an ad set a human paused", async () => {
    const { store, connection, link } = await setup();

    // A human pauses the ad set in Ads Manager.
    setMockAdSetStatus(connection.accountRef!, "adset-1", "PAUSED");

    // Sell out: guard sees PAUSED (not ours) → marks unknown, no action.
    setQty(store.domain, "m-1", 0);
    await runStoreSync(store.id);
    let updated = (await db.query.adLinks.findFirst({
      where: eq(adLinks.id, link.id),
    }))!;
    expect(updated.state).toBe("unknown");
    expect(getMockAdSetStatus(connection.accountRef!, "adset-1")).toBe("PAUSED");

    // Restock: still not ours → stays paused.
    setQty(store.domain, "m-1", 30);
    await runStoreSync(store.id);
    updated = (await db.query.adLinks.findFirst({
      where: eq(adLinks.id, link.id),
    }))!;
    expect(updated.state).toBe("unknown");
    expect(getMockAdSetStatus(connection.accountRef!, "adset-1")).toBe("PAUSED");
  });

  it("does nothing when the flag is off", async () => {
    process.env.ADS_GUARD_ENABLED = "false";
    try {
      const { store, connection } = await setup();
      setQty(store.domain, "m-1", 0);
      await runStoreSync(store.id);
      expect(getMockAdSetStatus(connection.accountRef!, "adset-1")).toBe(
        "ACTIVE",
      );
    } finally {
      process.env.ADS_GUARD_ENABLED = "true";
    }
  });
});
