import { logger } from "@/lib/logger";
import { connectWooStore } from "@/lib/services/store-service";
import { consumeWooConnect } from "@/lib/services/woo-connect-service";
import { validateWooCredentials } from "@/providers/stores/woocommerce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WooCommerce wc-auth callback: after the merchant approves, Woo POSTs the
 * generated read-only keys here along with our `user_id` token. We validate
 * the token (single-use, from Redis), confirm the keys work, and attach the
 * store to the initiating org.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    user_id?: string;
    consumer_key?: string;
    consumer_secret?: string;
  } | null;

  const token = body?.user_id;
  const consumerKey = body?.consumer_key;
  const consumerSecret = body?.consumer_secret;
  if (!token || !consumerKey || !consumerSecret) {
    return Response.json({ error: "missing fields" }, { status: 400 });
  }

  const pending = await consumeWooConnect(String(token));
  if (!pending) return Response.json({ error: "expired or unknown token" }, { status: 400 });

  const check = await validateWooCredentials({
    siteUrl: pending.siteUrl,
    consumerKey,
    consumerSecret,
  });
  if (!check.ok) {
    logger.warn({ site: pending.siteUrl }, "woo callback: key validation failed");
    return Response.json({ error: "keys rejected" }, { status: 400 });
  }

  try {
    await connectWooStore({
      orgId: pending.orgId,
      actorId: pending.actorId,
      siteUrl: pending.siteUrl,
      consumerKey,
      consumerSecret,
    });
  } catch (err) {
    // Most likely the store is already connected — don't error the merchant's flow.
    logger.error({ site: pending.siteUrl, err: String(err) }, "woo callback: connect failed");
  }

  return Response.json({ ok: true });
}
