"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { deadLetters, stores } from "@/db/schema";
import { enqueueStoreSync } from "@/jobs/queues";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/org";

/**
 * Retries a dead-lettered store webhook by re-enqueueing a full sync for
 * the affected store (syncs are idempotent), then removes the entry.
 */
export async function retryDeadLetterAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));

  const entry = await db.query.deadLetters.findFirst({
    where: eq(deadLetters.id, id),
  });
  if (!entry) return;

  const payload = entry.payload as { domain?: string; shopDomain?: string };
  const domain = payload.domain ?? payload.shopDomain;
  if (domain) {
    const store = await db.query.stores.findFirst({
      where: eq(stores.domain, domain),
    });
    if (store) await enqueueStoreSync(store.id);
  }

  await db.delete(deadLetters).where(eq(deadLetters.id, id));
  await recordAudit({
    actor: admin.id,
    action: "admin.dead_letter_retried",
    payload: { id, source: entry.source },
  });
  revalidatePath("/admin");
}

export async function discardDeadLetterAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db.delete(deadLetters).where(eq(deadLetters.id, id));
  await recordAudit({
    actor: admin.id,
    action: "admin.dead_letter_discarded",
    payload: { id },
  });
  revalidatePath("/admin");
}
