import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { deadLetters, processedWebhooks } from "@/db/schema";
import { logger } from "./logger";

/**
 * Atomically claims a delivery for processing. Returns true if this caller
 * won the claim, false if it was already claimed (a duplicate/retry).
 *
 * The `(source, external_id)` unique index makes the INSERT the lock, so two
 * concurrent duplicate deliveries can never both proceed — closing the
 * check-then-act race a separate SELECT would leave open. On processing
 * failure the caller MUST call `releaseProcessed` so the sender's retry can
 * re-claim.
 */
export async function claimWebhook(
  source: string,
  externalId: string,
): Promise<boolean> {
  const inserted = await db
    .insert(processedWebhooks)
    .values({ source, externalId })
    .onConflictDoNothing()
    .returning();
  return inserted.length > 0;
}

/** Releases a claim so a failed delivery can be retried by the sender. */
export async function releaseProcessed(
  source: string,
  externalId: string,
): Promise<void> {
  await db
    .delete(processedWebhooks)
    .where(
      and(
        eq(processedWebhooks.source, source),
        eq(processedWebhooks.externalId, externalId),
      ),
    );
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
