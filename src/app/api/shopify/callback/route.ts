import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { encryptJson } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { requireOrg } from "@/lib/org";
import { syncStoreProducts } from "@/lib/services/store-service";
import {
  exchangeOAuthCode,
  registerWebhooks,
} from "@/providers/stores/shopify";
import {
  isValidShopDomain,
  verifyOAuthHmac,
} from "@/providers/stores/shopify-auth";

export async function GET(request: Request) {
  const { user, org } = await requireOrg();

  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const { shop = "", code = "", state = "" } = query;

  const cookieStore = await cookies();
  const oauthCookie = cookieStore.get("shopify_oauth")?.value;
  cookieStore.delete("shopify_oauth");

  let expected: { state: string; shop: string } | null = null;
  try {
    expected = oauthCookie ? JSON.parse(oauthCookie) : null;
  } catch {
    expected = null;
  }

  if (
    !expected ||
    expected.state !== state ||
    expected.shop !== shop ||
    !isValidShopDomain(shop) ||
    !verifyOAuthHmac(query, process.env.SHOPIFY_API_SECRET ?? "")
  ) {
    logger.warn({ shop }, "shopify oauth callback rejected");
    redirect("/stores?error=oauth-failed");
  }

  const credentials = await exchangeOAuthCode(shop, code);
  const encrypted = encryptJson(credentials);

  const existing = await db.query.stores.findFirst({
    where: and(eq(stores.orgId, org.id), eq(stores.domain, shop)),
  });

  let storeId: string;
  if (existing) {
    await db
      .update(stores)
      .set({ credentialsEncrypted: encrypted, status: "connected" })
      .where(eq(stores.id, existing.id));
    storeId = existing.id;
  } else {
    const [created] = await db
      .insert(stores)
      .values({
        orgId: org.id,
        platform: "shopify",
        name: shop.replace(".myshopify.com", ""),
        domain: shop,
        status: "connected",
        credentialsEncrypted: encrypted,
      })
      .returning();
    storeId = created.id;
  }

  await registerWebhooks(shop, credentials);
  try {
    await syncStoreProducts(storeId);
  } catch (err) {
    logger.error({ storeId, err: String(err) }, "initial sync failed");
  }

  await recordAudit({
    orgId: org.id,
    actor: user.id,
    action: existing ? "store.reconnected" : "store.connected",
    payload: { storeId, domain: shop },
  });

  redirect(`/stores/${storeId}`);
}
