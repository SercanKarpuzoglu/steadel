import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireOrg } from "@/lib/org";
import {
  listAutomationRules,
  lowStockConfigSchema,
  scheduledReportConfigSchema,
} from "@/lib/services/automation-service";
import { deleteRuleAction, toggleRuleAction } from "./actions";

export const metadata: Metadata = { title: "Automations" };

function describeRule(type: string, config: unknown): string {
  if (type === "low_stock_alert") {
    const parsed = lowStockConfigSchema.safeParse(config);
    if (!parsed.success) return "Invalid configuration";
    return `Threshold ${parsed.data.threshold} → ${parsed.data.recipients.join(", ")}`;
  }
  if (type === "scheduled_report") {
    const parsed = scheduledReportConfigSchema.safeParse(config);
    if (!parsed.success) return "Invalid configuration";
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const when =
      parsed.data.frequency === "daily"
        ? `daily at ${parsed.data.hour}:00 UTC`
        : `${days[parsed.data.weekday]} at ${parsed.data.hour}:00 UTC`;
    return `${when} → ${parsed.data.recipients.join(", ")}`;
  }
  if (type === "ads_guard") return "Pauses linked ad sets on sell-out";
  return "";
}

const TYPE_LABELS: Record<string, string> = {
  low_stock_alert: "Low-stock alert",
  scheduled_report: "Scheduled report",
  ads_guard: "Ads guard",
};

export default async function AutomationsPage() {
  const { org } = await requireOrg();
  const rules = await listAutomationRules(org.id);
  const orgStores = await db.query.stores.findMany({
    where: eq(stores.orgId, org.id),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Automations</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/automations/ads"
            className="flex h-10 items-center rounded-md border border-line bg-white/60 px-4 text-sm font-medium hover:bg-white"
          >
            Ads guard
          </Link>
          <Link
            href="/automations/new"
            className="flex h-10 items-center rounded-md bg-amber px-4 text-sm font-medium text-ink hover:bg-amber-dark"
          >
            New automation
          </Link>
        </div>
      </div>

      <Card>
        <CardTitle>Rules</CardTitle>
        <CardDescription>
          Low-stock alerts fire when tracked products cross their threshold;
          reports are emailed on schedule.
        </CardDescription>
        {rules.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            No automations yet.{" "}
            {orgStores.length === 0 ? (
              <>
                <Link href="/stores" className="text-amber-text hover:underline">
                  Connect a store
                </Link>{" "}
                first, then create your first rule.
              </>
            ) : (
              <Link
                href="/automations/new"
                className="text-amber-text hover:underline"
              >
                Create your first rule.
              </Link>
            )}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-xs tracking-wide text-ink-soft uppercase">
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Store</th>
                  <th className="py-2 pr-4">Configuration</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rules.map(({ rule, store }) => (
                  <tr key={rule.id}>
                    <td className="py-2.5 pr-4">
                      {TYPE_LABELS[rule.type] ?? rule.type}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-soft">{store.name}</td>
                    <td className="max-w-md truncate py-2.5 pr-4 text-ink-soft">
                      {describeRule(rule.type, rule.config)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-xs ${
                          rule.enabled
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {rule.enabled ? "enabled" : "paused"}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/automations/${rule.id}`}
                          className="text-xs text-ink-soft hover:text-ink hover:underline"
                        >
                          Edit
                        </Link>
                        <form action={toggleRuleAction}>
                          <input type="hidden" name="ruleId" value={rule.id} />
                          <button
                            type="submit"
                            className="cursor-pointer text-xs text-ink-soft hover:text-ink hover:underline"
                          >
                            {rule.enabled ? "Pause" : "Enable"}
                          </button>
                        </form>
                        <form action={deleteRuleAction}>
                          <input type="hidden" name="ruleId" value={rule.id} />
                          <button
                            type="submit"
                            className="cursor-pointer text-xs text-red-700 hover:underline"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
