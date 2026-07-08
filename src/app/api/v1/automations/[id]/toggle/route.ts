import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { automationRules, stores } from "@/db/schema";
import { authenticateApiRequest } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";

/** POST /api/v1/automations/:id/toggle — flips a rule's enabled state (SPEC §7). */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const rows = await db
    .select({ rule: automationRules })
    .from(automationRules)
    .innerJoin(stores, eq(automationRules.storeId, stores.id))
    .where(and(eq(automationRules.id, id), eq(stores.orgId, auth.org.id)))
    .limit(1);
  if (!rows[0]) {
    return Response.json({ error: "Automation not found" }, { status: 404 });
  }

  const rule = rows[0].rule;
  const [updated] = await db
    .update(automationRules)
    .set({ enabled: !rule.enabled })
    .where(eq(automationRules.id, rule.id))
    .returning();

  await recordAudit({
    orgId: auth.org.id,
    actor: "api",
    action: "automation.toggled_via_api",
    payload: { ruleId: rule.id, enabled: updated.enabled },
  });

  return Response.json({
    data: { id: updated.id, type: updated.type, enabled: updated.enabled },
  });
}
