import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { decryptJson, type EncryptedPayload } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { enqueueStoreSync } from "@/jobs/queues";
import {
  alreadyProcessed,
  markProcessed,
  recordDeadLetter,
} from "@/lib/webhooks";
import { verifyWebhookHmac } from "@/providers/stores/shopify-auth";
import type { WooCredentials } from "@/providers/stores/woocommerce";

/**
 * WooCommerce webhook receiver. Webhooks are optional (SPEC §5.2 — polling
 * is the primary sync path); users configure them manually with the
 * consumer secret as the webhook secret (see the user guide).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-wc-webhook-signature");
  const source = request.headers.get("x-wc-webhook-source") ?? "";
  const deliveryId = request.headers.get("x-wc-webhook-delivery-id") ?? "";

  // Woo pings with an empty body on webhook creation.
  if (!rawBody || rawBody === "webhook_id") {
    return Response.json({ ok: true, ping: true });
  }

  let domain: string;
  try {
    domain = new URL(source).host;
  } catch {
    return Response.json({ error: "missing source" }, { status: 400 });
  }

  const candidates = await db.query.stores.findMany({
    where: and(eq(stores.domain, domain), ne(stores.status, "disconnected")),
  });

  // Verify against the store's consumer secret (Woo signs body with the
  // webhook secret; our guide tells users to use the consumer secret).
  const store = candidates.find((s) => {
    if (!s.credentialsEncrypted) return false;
    try {
      const creds = decryptJson<WooCredentials>(
        s.credentialsEncrypted as EncryptedPayload,
      );
      return verifyWebhookHmac(rawBody, signature, creds.consumerSecret);
    } catch {
      return false;
    }
  });

  if (!store) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  const idempotencyKey = deliveryId || `${domain}:${signature}`;
  if (await alreadyProcessed("woocommerce", idempotencyKey)) {
    return Response.json({ ok: true, duplicate: true });
  }

  try {
    await enqueueStoreSync(store.id);
    await markProcessed("woocommerce", idempotencyKey);
    logger.info({ domain }, "woocommerce webhook → sync enqueued");
    return Response.json({ ok: true });
  } catch (err) {
    await recordDeadLetter("woocommerce", String(err), {
      domain,
      deliveryId,
      body: rawBody.slice(0, 10_000),
    });
    return Response.json({ error: "processing failed" }, { status: 500 });
  }
}
