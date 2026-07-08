import { createHmac, randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";
import { PlanLimitError } from "@/lib/plans";
import { createAutomationRule } from "@/lib/services/automation-service";
import { signupUser } from "@/lib/services/auth-service";
import { connectMockStore } from "@/lib/services/store-service";
import { POST as paddleWebhook } from "@/app/api/webhooks/paddle/route";

const WEBHOOK_SECRET = "pdl_test_webhook_secret";

function signedRequest(payload: object): Request {
  const body = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000);
  const h1 = createHmac("sha256", WEBHOOK_SECRET)
    .update(`${ts}:${body}`)
    .digest("hex");
  return new Request("http://localhost/api/webhooks/paddle", {
    method: "POST",
    headers: { "paddle-signature": `ts=${ts};h1=${h1}` },
    body,
  });
}

async function createOrg() {
  const email = `billing-${randomUUID()}@example.com`;
  await signupUser({ name: "Biller", email, password: "password-123" });
  const user = (await db.query.users.findFirst({
    where: eq(users.email, email),
  }))!;
  const org = (await db.query.organizations.findFirst({
    where: eq(organizations.ownerUserId, user.id),
  }))!;
  return { user, org };
}

beforeAll(() => {
  process.env.PADDLE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.PADDLE_PRICE_STARTER = "pri_starter";
  process.env.PADDLE_PRICE_GROWTH = "pri_growth";
  process.env.PADDLE_PRICE_AGENCY = "pri_agency";
});

describe("paddle webhook (integration)", () => {
  it("subscription.created upgrades the org plan", async () => {
    const { org } = await createOrg();
    const response = await paddleWebhook(
      signedRequest({
        event_id: `evt_${randomUUID()}`,
        event_type: "subscription.created",
        data: {
          id: `sub_${randomUUID()}`,
          status: "active",
          customer_id: `ctm_${randomUUID()}`,
          custom_data: { orgId: org.id },
          items: [{ price: { id: "pri_growth" } }],
        },
      }),
    );
    expect(response.status).toBe(200);

    const updated = (await db.query.organizations.findFirst({
      where: eq(organizations.id, org.id),
    }))!;
    expect(updated.plan).toBe("growth");
    expect(updated.subscriptionStatus).toBe("active");
    expect(updated.paddleSubscriptionId).toContain("sub_");
    expect(updated.trialEndsAt).toBeNull();
  });

  it("is idempotent per event_id", async () => {
    const { org } = await createOrg();
    const eventId = `evt_${randomUUID()}`;
    const payload = {
      event_id: eventId,
      event_type: "subscription.created",
      data: {
        id: `sub_${randomUUID()}`,
        status: "active",
        custom_data: { orgId: org.id },
        items: [{ price: { id: "pri_starter" } }],
      },
    };
    const first = await paddleWebhook(signedRequest(payload));
    expect(first.status).toBe(200);
    const second = await paddleWebhook(signedRequest(payload));
    const json = (await second.json()) as { duplicate?: boolean };
    expect(json.duplicate).toBe(true);
  });

  it("rejects invalid signatures", async () => {
    const response = await paddleWebhook(
      new Request("http://localhost/api/webhooks/paddle", {
        method: "POST",
        headers: { "paddle-signature": "ts=1;h1=bad" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(401);
  });

  it("subscription.canceled blocks new resources", async () => {
    const { user, org } = await createOrg();
    // upgrade first
    await paddleWebhook(
      signedRequest({
        event_id: `evt_${randomUUID()}`,
        event_type: "subscription.created",
        data: {
          id: `sub_cancel_${randomUUID()}`,
          status: "active",
          custom_data: { orgId: org.id },
          items: [{ price: { id: "pri_starter" } }],
        },
      }),
    );
    const store = await connectMockStore(org.id, user.id);

    // cancel
    const updated = (await db.query.organizations.findFirst({
      where: eq(organizations.id, org.id),
    }))!;
    await paddleWebhook(
      signedRequest({
        event_id: `evt_${randomUUID()}`,
        event_type: "subscription.canceled",
        data: { id: updated.paddleSubscriptionId!, status: "canceled" },
      }),
    );

    const canceled = (await db.query.organizations.findFirst({
      where: eq(organizations.id, org.id),
    }))!;
    expect(canceled.subscriptionStatus).toBe("canceled");

    await expect(
      createAutomationRule({
        orgId: org.id,
        actorId: user.id,
        storeId: store.id,
        type: "low_stock_alert",
        config: { threshold: 5, recipients: ["x@example.com"] },
      }),
    ).rejects.toThrow(PlanLimitError);
  });
});

describe("plan limit enforcement (integration)", () => {
  it("starter/trial caps automations at 3", async () => {
    const { user, org } = await createOrg();
    const store = await connectMockStore(org.id, user.id);

    for (let i = 0; i < 3; i++) {
      await createAutomationRule({
        orgId: org.id,
        actorId: user.id,
        storeId: store.id,
        type: "low_stock_alert",
        config: { threshold: 5, recipients: [`a${i}@example.com`] },
      });
    }

    await expect(
      createAutomationRule({
        orgId: org.id,
        actorId: user.id,
        storeId: store.id,
        type: "low_stock_alert",
        config: { threshold: 5, recipients: ["overflow@example.com"] },
      }),
    ).rejects.toThrow(PlanLimitError);
  });

  it("expired trials cannot create automations", async () => {
    const { user, org } = await createOrg();
    const store = await connectMockStore(org.id, user.id);
    await db
      .update(organizations)
      .set({ trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) })
      .where(eq(organizations.id, org.id));

    await expect(
      createAutomationRule({
        orgId: org.id,
        actorId: user.id,
        storeId: store.id,
        type: "low_stock_alert",
        config: { threshold: 5, recipients: ["late@example.com"] },
      }),
    ).rejects.toThrow(PlanLimitError);
  });
});
