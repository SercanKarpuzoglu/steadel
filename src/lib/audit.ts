import { db } from "@/db";
import { eventsAudit } from "@/db/schema";

/** Records a sensitive action in the audit log (SPEC §8). */
export async function recordAudit(params: {
  orgId?: string | null;
  actor: string; // user id or "system"
  action: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(eventsAudit).values({
    orgId: params.orgId ?? null,
    actor: params.actor,
    action: params.action,
    payload: params.payload ?? {},
  });
}
