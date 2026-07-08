import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { organizations, products, users } from "@/db/schema";
import { createApiKey } from "@/lib/api-auth";
import { createAutomationRule } from "@/lib/services/automation-service";
import { signupUser } from "@/lib/services/auth-service";
import { connectMockStore } from "@/lib/services/store-service";
import { GET as getProducts } from "@/app/api/v1/products/route";
import { GET as getAlerts } from "@/app/api/v1/alerts/route";
import { POST as toggleAutomation } from "@/app/api/v1/automations/[id]/toggle/route";

async function createOrgWithKey(plan: "growth" | "starter" = "growth") {
  const email = `api-${randomUUID()}@example.com`;
  await signupUser({ name: "API", email, password: "password-123" });
  const user = (await db.query.users.findFirst({
    where: eq(users.email, email),
  }))!;
  const org = (await db.query.organizations.findFirst({
    where: eq(organizations.ownerUserId, user.id),
  }))!;
  await db
    .update(organizations)
    .set({ plan, trialEndsAt: null })
    .where(eq(organizations.id, org.id));
  const key = await createApiKey({ orgId: org.id, actorId: user.id, name: "test" });
  return { user, org, key };
}

function req(path: string, key?: string, method = "GET"): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: key ? { authorization: `Bearer ${key}` } : {},
  });
}

describe("public API v1 (integration)", () => {
  it("returns tracked products with a valid key", async () => {
    const { user, org, key } = await createOrgWithKey();
    const store = await connectMockStore(org.id, user.id);
    await db
      .update(products)
      .set({ tracked: true })
      .where(eq(products.storeId, store.id));

    const res = await getProducts(req("/api/v1/products", key.raw));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: Array<{ title: string; inventory_qty: number }> };
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data[0]).toHaveProperty("inventory_qty");
    expect(json.data[0]).toHaveProperty("out_of_stock");
  });

  it("rejects missing/invalid keys", async () => {
    expect((await getProducts(req("/api/v1/products"))).status).toBe(401);
    expect(
      (await getProducts(req("/api/v1/products", "sk_steadel_invalid"))).status,
    ).toBe(401);
  });

  it("requires Growth+ plan", async () => {
    const { key } = await createOrgWithKey("starter");
    const res = await getProducts(req("/api/v1/products", key.raw));
    expect(res.status).toBe(403);
  });

  it("lists alerts", async () => {
    const { key } = await createOrgWithKey();
    const res = await getAlerts(req("/api/v1/alerts", key.raw));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: unknown[] };
    expect(Array.isArray(json.data)).toBe(true);
  });

  it("toggles an automation and scopes by org", async () => {
    const { user, org, key } = await createOrgWithKey();
    const store = await connectMockStore(org.id, user.id);
    const rule = await createAutomationRule({
      orgId: org.id,
      actorId: user.id,
      storeId: store.id,
      type: "low_stock_alert",
      config: { threshold: 5, recipients: ["a@example.com"] },
    });

    const res = await toggleAutomation(
      req(`/api/v1/automations/${rule.id}/toggle`, key.raw, "POST"),
      { params: Promise.resolve({ id: rule.id }) },
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { enabled: boolean } };
    expect(json.data.enabled).toBe(false);

    // A different org's key cannot touch it.
    const other = await createOrgWithKey();
    const denied = await toggleAutomation(
      req(`/api/v1/automations/${rule.id}/toggle`, other.key.raw, "POST"),
      { params: Promise.resolve({ id: rule.id }) },
    );
    expect(denied.status).toBe(404);
  });

  it("revoked keys stop working", async () => {
    const { user, org, key } = await createOrgWithKey();
    const { revokeApiKey } = await import("@/lib/api-auth");
    await revokeApiKey({ orgId: org.id, actorId: user.id, keyId: key.id });
    const res = await getProducts(req("/api/v1/products", key.raw));
    expect(res.status).toBe(401);
  });
});
