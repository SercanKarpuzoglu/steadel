"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrg } from "@/lib/org";
import { PlanLimitError } from "@/lib/plans";
import {
  createAutomationRule,
  deleteAutomationRule,
  getAutomationRule,
  lowStockConfigSchema,
  scheduledReportConfigSchema,
  updateAutomationRule,
} from "@/lib/services/automation-service";

export type FormState = { error?: string } | undefined;

function parseRecipients(raw: string): string[] {
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

export async function saveRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, user } = await requireOrg();

  const ruleId = String(formData.get("ruleId") ?? "");
  const storeId = String(formData.get("storeId") ?? "");
  const type = String(formData.get("type") ?? "");
  const recipients = parseRecipients(String(formData.get("recipients") ?? ""));

  let config: Record<string, unknown>;
  if (type === "low_stock_alert") {
    const parsed = lowStockConfigSchema.safeParse({
      threshold: Number(formData.get("threshold") ?? 5),
      recipients,
    });
    if (!parsed.success) {
      return { error: "Check the threshold and enter at least one valid email." };
    }
    config = parsed.data;
  } else if (type === "scheduled_report") {
    const parsed = scheduledReportConfigSchema.safeParse({
      frequency: String(formData.get("frequency") ?? "weekly"),
      hour: Number(formData.get("hour") ?? 7),
      weekday: Number(formData.get("weekday") ?? 1),
      recipients,
    });
    if (!parsed.success) {
      return { error: "Check the schedule and enter at least one valid email." };
    }
    config = parsed.data;
  } else {
    return { error: "Unknown automation type." };
  }

  if (ruleId) {
    await updateAutomationRule({ ruleId, orgId: org.id, actorId: user.id, config });
  } else {
    if (!z.string().uuid().safeParse(storeId).success) {
      return { error: "Pick a store." };
    }
    try {
      await createAutomationRule({
        orgId: org.id,
        actorId: user.id,
        storeId,
        type: type as "low_stock_alert" | "scheduled_report",
        config,
      });
    } catch (err) {
      if (err instanceof PlanLimitError) return { error: err.message };
      throw err;
    }
  }
  revalidatePath("/automations");
  redirect("/automations");
}

export async function toggleRuleAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const ruleId = z.string().uuid().parse(formData.get("ruleId"));
  const found = await getAutomationRule(ruleId, org.id);
  if (!found) return;
  await updateAutomationRule({
    ruleId,
    orgId: org.id,
    actorId: user.id,
    enabled: !found.rule.enabled,
  });
  revalidatePath("/automations");
}

export async function deleteRuleAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const ruleId = z.string().uuid().parse(formData.get("ruleId"));
  await deleteAutomationRule({ ruleId, orgId: org.id, actorId: user.id });
  revalidatePath("/automations");
}
