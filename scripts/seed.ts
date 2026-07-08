import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  automationRules,
  organizations,
  orgMembers,
  products,
  stores,
  users,
} from "../src/db/schema";

const DEMO_EMAIL = "demo@steadel.com";
const DEMO_PASSWORD = "demo-password-123";

const DEMO_PRODUCTS = [
  { externalId: "1001", title: "Linen Throw Blanket", sku: "LIN-THR-01", inventoryQty: 42, tracked: true },
  { externalId: "1002", title: "Ceramic Pour-Over Set", sku: "CER-POV-02", inventoryQty: 3, tracked: true },
  { externalId: "1003", title: "Walnut Serving Board", sku: "WAL-SRV-03", inventoryQty: 0, tracked: true },
  { externalId: "1004", title: "Brass Desk Lamp", sku: "BRA-LMP-04", inventoryQty: 17, tracked: true },
  { externalId: "1005", title: "Wool Slippers (EU 42)", sku: "WOO-SLP-42", inventoryQty: 8, tracked: false },
  { externalId: "1006", title: "Stoneware Mug — Amber", sku: "STO-MUG-AM", inventoryQty: 120, tracked: true },
];

async function main() {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, DEMO_EMAIL),
  });
  if (existing) {
    console.log("Demo user already exists — skipping seed.");
    process.exit(0);
  }

  const passwordHash = await hash(DEMO_PASSWORD, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const [user] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      passwordHash,
      name: "Demo Merchant",
      emailVerifiedAt: new Date(),
    })
    .returning();

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const [org] = await db
    .insert(organizations)
    .values({
      name: "Demo Store GmbH",
      ownerUserId: user.id,
      plan: "trial",
      trialEndsAt,
    })
    .returning();

  await db
    .insert(orgMembers)
    .values({ orgId: org.id, userId: user.id, role: "owner" });

  const [store] = await db
    .insert(stores)
    .values({
      orgId: org.id,
      platform: "shopify",
      name: "Demo Store",
      domain: "demo-store.myshopify.com",
      status: "connected",
      lastSyncAt: new Date(),
    })
    .returning();

  await db
    .insert(products)
    .values(DEMO_PRODUCTS.map((p) => ({ ...p, storeId: store.id })));

  await db.insert(automationRules).values({
    storeId: store.id,
    type: "low_stock_alert",
    config: { threshold: 5, recipients: [DEMO_EMAIL] },
    enabled: true,
  });

  console.log(`Seeded demo org "${org.name}"`);
  console.log(`  Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
