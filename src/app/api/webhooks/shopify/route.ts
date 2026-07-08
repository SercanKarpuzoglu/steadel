import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { logger } from "@/lib/logger";
import { enqueueStoreSync } from "@/jobs/queues";
import {
  alreadyProcessed,
  markProcessed,
  recordDeadLetter,
} from "@/lib/webhooks";
import { verifyWebhookHmac } from "@/providers/stores/shopify-auth";

const GDPR_TOPICS = new Set([
  "customers/data_request",
  "customers/redact",
  "shop/redact",
]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic") ?? "";
  const webhookId = request.headers.get("x-shopify-webhook-id") ?? "";
  const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "";

  if (!verifyWebhookHmac(rawBody, hmac, process.env.SHOPIFY_API_SECRET ?? "")) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  if (webhookId && (await alreadyProcessed("shopify", webhookId))) {
    return Response.json({ ok: true, duplicate: true });
  }

  try {
    if (GDPR_TOPICS.has(topic)) {
      // We store no customer PII — acknowledge and keep an audit trail.
      logger.info({ topic, shopDomain }, "shopify GDPR webhook acknowledged");
    } else if (topic === "app/uninstalled") {
      await db
        .update(stores)
        .set({ status: "disconnected", credentialsEncrypted: null })
        .where(eq(stores.domain, shopDomain));
      logger.info({ shopDomain }, "store disconnected via app/uninstalled");
    } else if (
      topic === "inventory_levels/update" ||
      topic === "products/update"
    ) {
      const store = await db.query.stores.findFirst({
        where: eq(stores.domain, shopDomain),
      });
      if (store && store.status !== "disconnected") {
        await enqueueStoreSync(store.id);
      }
    } else {
      logger.info({ topic, shopDomain }, "unhandled shopify topic");
    }

    if (webhookId) await markProcessed("shopify", webhookId);
    return Response.json({ ok: true });
  } catch (err) {
    await recordDeadLetter("shopify", String(err), {
      topic,
      shopDomain,
      webhookId,
      body: rawBody.slice(0, 10_000),
    });
    return Response.json({ error: "processing failed" }, { status: 500 });
  }
}
