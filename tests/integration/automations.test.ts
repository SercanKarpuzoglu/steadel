import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { alertsLog, organizations, products, users } from "@/db/schema";
import { clearOutbox, getOutbox } from "@/lib/mail";
import {
  createAutomationRule,
  processStockChanges,
} from "@/lib/services/automation-service";
import { sendScheduledReport } from "@/lib/services/report-service";
import { signupUser, verifyEmailToken } from "@/lib/services/auth-service";
import { connectMockStore, syncStoreProducts } from "@/lib/services/store-service";
import { purgeDeletedAccounts, runStoreSync } from "@/jobs/worker";
import { getMockCatalog, setMockCatalog } from "@/providers/stores/mock";

function extractToken(html: string, path: string): string {
  const match = html.match(new RegExp(`/${path}\\?token=([A-Za-z0-9_-]+)`));
  if (!match) throw new Error("token not found");
  return match[1];
}

describe("full happy path (SPEC §10)", () => {
  beforeEach(() => clearOutbox());

  it("signup → verify → connect store → alert rule → stock drop → alert email", async () => {
    // 1. signup + verify
    const email = `happy-${randomUUID()}@example.com`;
    const signup = await signupUser({
      name: "Happy Merchant",
      email,
      password: "password-123",
    });
    expect(signup.ok).toBe(true);
    const verifyMail = getOutbox().find((m) => m.to === email)!;
    expect(await verifyEmailToken(extractToken(verifyMail.html, "verify"))).toBe(
      true,
    );

    const user = (await db.query.users.findFirst({
      where: eq(users.email, email),
    }))!;
    const org = (await db.query.organizations.findFirst({
      where: eq(organizations.ownerUserId, user.id),
    }))!;

    // 2. connect mock store + track everything
    const store = await connectMockStore(org.id, user.id);
    await db
      .update(products)
      .set({ tracked: true })
      .where(eq(products.storeId, store.id));

    // 3. create the low-stock alert rule
    await createAutomationRule({
      orgId: org.id,
      actorId: user.id,
      storeId: store.id,
      type: "low_stock_alert",
      config: { threshold: 5, recipients: [email] },
    });

    // 4. simulate a stock drop (42 → 2) and run the worker path
    clearOutbox();
    const catalog = getMockCatalog(store.domain);
    setMockCatalog(
      store.domain,
      catalog.map((p) =>
        p.externalId === "m-1" ? { ...p, inventoryQty: 2 } : p,
      ),
    );
    const changeCount = await runStoreSync(store.id);
    expect(changeCount).toBe(1);

    // 5. alert email rendered + logged
    const alertMail = getOutbox().find((m) => m.to === email);
    expect(alertMail).toBeDefined();
    expect(alertMail!.subject).toBe("Low stock: Linen Throw Blanket (2 left)");
    expect(alertMail!.html).toContain("Linen Throw Blanket");
    expect(alertMail!.html).toContain("LIN-THR-01");

    const logged = await db.query.alertsLog.findMany({
      where: and(eq(alertsLog.orgId, org.id), eq(alertsLog.type, "low_stock")),
    });
    expect(logged).toHaveLength(1);

    // 6. no duplicate alert while stock stays low
    clearOutbox();
    await runStoreSync(store.id);
    expect(getOutbox()).toHaveLength(0);
  });

  it("out-of-stock drops log as out_of_stock", async () => {
    const email = `oos-${randomUUID()}@example.com`;
    await signupUser({ name: "OOS", email, password: "password-123" });
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
    await createAutomationRule({
      orgId: org.id,
      actorId: user.id,
      storeId: store.id,
      type: "low_stock_alert",
      config: { threshold: 5, recipients: [email] },
    });

    setMockCatalog(
      store.domain,
      getMockCatalog(store.domain).map((p) =>
        p.externalId === "m-4" ? { ...p, inventoryQty: 0 } : p,
      ),
    );
    const changes = await syncStoreProducts(store.id);
    await processStockChanges(changes);

    const logged = await db.query.alertsLog.findMany({
      where: and(eq(alertsLog.orgId, org.id), eq(alertsLog.type, "out_of_stock")),
    });
    expect(logged).toHaveLength(1);
  });
});

describe("scheduled reports", () => {
  it("renders and logs a report email", async () => {
    clearOutbox();
    const email = `report-${randomUUID()}@example.com`;
    await signupUser({ name: "Reporter", email, password: "password-123" });
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

    const rule = await createAutomationRule({
      orgId: org.id,
      actorId: user.id,
      storeId: store.id,
      type: "scheduled_report",
      config: { frequency: "weekly", hour: 7, weekday: 1, recipients: [email] },
    });

    clearOutbox();
    expect(await sendScheduledReport(rule)).toBe(true);

    const mail = getOutbox().find((m) => m.to === email);
    expect(mail).toBeDefined();
    expect(mail!.subject).toContain("weekly report");
    expect(mail!.html).toContain("Demo Store");

    const logged = await db.query.alertsLog.findMany({
      where: and(
        eq(alertsLog.orgId, org.id),
        eq(alertsLog.type, "scheduled_report"),
      ),
    });
    expect(logged).toHaveLength(1);
  });
});

describe("30-day account purge", () => {
  it("hard-deletes accounts past the window, keeps recent ones", async () => {
    const oldEmail = `purge-old-${randomUUID()}@example.com`;
    const newEmail = `purge-new-${randomUUID()}@example.com`;

    await signupUser({ name: "Old", email: oldEmail, password: "password-123" });
    await signupUser({ name: "New", email: newEmail, password: "password-123" });

    const oldUser = (await db.query.users.findFirst({
      where: eq(users.email, oldEmail),
    }))!;
    await db
      .update(users)
      .set({ deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) })
      .where(eq(users.id, oldUser.id));
    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.email, newEmail));

    const purged = await purgeDeletedAccounts();
    expect(purged).toBeGreaterThanOrEqual(1);

    expect(
      await db.query.users.findFirst({ where: eq(users.email, oldEmail) }),
    ).toBeUndefined();
    expect(
      await db.query.organizations.findFirst({
        where: eq(organizations.ownerUserId, oldUser.id),
      }),
    ).toBeUndefined();
    expect(
      await db.query.users.findFirst({ where: eq(users.email, newEmail) }),
    ).toBeDefined();
  });
});
