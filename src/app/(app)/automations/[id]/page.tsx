import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireOrg } from "@/lib/org";
import {
  getAutomationRule,
  lowStockConfigSchema,
  scheduledReportConfigSchema,
} from "@/lib/services/automation-service";
import { RuleForm, type RuleFormDefaults } from "../_components/rule-form";

export const metadata: Metadata = { title: "Edit automation" };

export default async function EditAutomationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { org } = await requireOrg();
  const { id } = await params;
  const found = await getAutomationRule(id, org.id);
  if (!found || found.rule.type === "ads_guard") notFound();

  const { rule, store } = found;
  let defaults: RuleFormDefaults;
  if (rule.type === "low_stock_alert") {
    const config = lowStockConfigSchema.parse(rule.config);
    defaults = {
      ruleId: rule.id,
      type: "low_stock_alert",
      threshold: config.threshold,
      recipients: config.recipients.join(", "),
    };
  } else {
    const config = scheduledReportConfigSchema.parse(rule.config);
    defaults = {
      ruleId: rule.id,
      type: "scheduled_report",
      frequency: config.frequency,
      hour: config.hour,
      weekday: config.weekday,
      recipients: config.recipients.join(", "),
    };
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-semibold">Edit automation</h1>
      <Card>
        <CardTitle>{store.name}</CardTitle>
        <CardDescription>
          Store and automation type cannot change after creation — create a
          new rule instead.
        </CardDescription>
        <div className="mt-4">
          <RuleForm stores={[store]} defaults={defaults} />
        </div>
      </Card>
    </div>
  );
}
