import { db } from "@/db";
import { deadLetters, processedWebhooks } from "@/db/schema";
import { logger } from "./logger";

/** True when this delivery id has already been fully processed. */
export async function alreadyProcessed(
  source: string,
  externalId: string,
): Promise<boolean> {
  const row = await db.query.processedWebhooks.findFirst({
    where: (t, { and, eq }) =>
      and(eq(t.source, source), eq(t.externalId, externalId)),
  });
  return !!row;
}

/**
 * Idempotency gate: call AFTER successful processing so failed deliveries can
 * be retried by the sender. Returns false when a concurrent duplicate won.
 */
export async function markProcessed(
  source: string,
  externalId: string,
): Promise<boolean> {
  try {
    await db.insert(processedWebhooks).values({ source, externalId });
    return true;
  } catch {
    return false;
  }
}

/** Stores a failed webhook payload for admin retry (SPEC §7 dead-letter logging). */
export async function recordDeadLetter(
  source: string,
  reason: string,
  payload: unknown,
): Promise<void> {
  logger.error({ source, reason }, "webhook dead-lettered");
  await db.insert(deadLetters).values({
    source,
    reason,
    payload: payload ?? {},
  });
}
