import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { verifyPaddleSignature } from "@/lib/paddle";
import { planForPriceId } from "@/lib/plans";
import {
  alreadyProcessed,
  markProcessed,
  recordDeadLetter,
} from "@/lib/webhooks";

interface PaddleEvent {
  event_id: string;
  event_type: string;
  data: {
    id: string;
    status?: string;
    customer_id?: string;
    custom_data?: { orgId?: string } | null;
    items?: Array<{ price?: { id?: string } }>;
  };
}

async function resolveOrg(event: PaddleEvent) {
  const orgId = event.data.custom_data?.orgId;
  if (orgId) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
    if (org) return org;
  }
  if (event.data.id) {
    const bySub = await db.query.organizations.findFirst({
      where: eq(organizations.paddleSubscriptionId, event.data.id),
    });
    if (bySub) return bySub;
  }
  if (event.data.customer_id) {
    return db.query.organizations.findFirst({
      where: eq(organizations.paddleCustomerId, event.data.customer_id),
    });
  }
  return undefined;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature");

  if (
    !verifyPaddleSignature(
      rawBody,
      signature,
      process.env.PADDLE_WEBHOOK_SECRET ?? "",
    )
  ) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: PaddleEvent;
  try {
    event = JSON.parse(rawBody) as PaddleEvent;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  if (await alreadyProcessed("paddle", event.event_id)) {
    return Response.json({ ok: true, duplicate: true });
  }

  try {
    switch (event.event_type) {
      case "subscription.created":
      case "subscription.updated": {
        const org = await resolveOrg(event);
        if (!org) {
          logger.warn({ eventId: event.event_id }, "paddle event without org");
          break;
        }
        const priceId = event.data.items?.[0]?.price?.id ?? "";
        const plan = planForPriceId(priceId);
        await db
          .update(organizations)
          .set({
            paddleSubscriptionId: event.data.id,
            paddleCustomerId: event.data.customer_id ?? org.paddleCustomerId,
            subscriptionStatus: event.data.status ?? null,
            ...(plan ? { plan, trialEndsAt: null } : {}),
          })
          .where(eq(organizations.id, org.id));
        await recordAudit({
          orgId: org.id,
          actor: "system",
          action: "billing.subscription_updated",
          payload: { eventType: event.event_type, plan, status: event.data.status },
        });
        break;
      }
      case "subscription.canceled": {
        const org = await resolveOrg(event);
        if (!org) break;
        await db
          .update(organizations)
          .set({ subscriptionStatus: "canceled" })
          .where(eq(organizations.id, org.id));
        await recordAudit({
          orgId: org.id,
          actor: "system",
          action: "billing.subscription_canceled",
          payload: { subscriptionId: event.data.id },
        });
        break;
      }
      case "transaction.completed": {
        const org = await resolveOrg(event);
        if (org && event.data.customer_id && !org.paddleCustomerId) {
          await db
            .update(organizations)
            .set({ paddleCustomerId: event.data.customer_id })
            .where(eq(organizations.id, org.id));
        }
        break;
      }
      default:
        logger.info({ type: event.event_type }, "unhandled paddle event");
    }

    await markProcessed("paddle", event.event_id);
    return Response.json({ ok: true });
  } catch (err) {
    await recordDeadLetter("paddle", String(err), {
      eventId: event.event_id,
      eventType: event.event_type,
      body: rawBody.slice(0, 10_000),
    });
    return Response.json({ error: "processing failed" }, { status: 500 });
  }
}
