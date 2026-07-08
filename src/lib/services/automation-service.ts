import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { alertsLog, automationRules, organizations, stores, users } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { assertCanAddAutomation } from "@/lib/plans";
import { lowStockHtml } from "@/emails/alert-emails";
import { logger } from "@/lib/logger";
import { sendMail } from "@/lib/mail";
import { sendSlack } from "@/lib/slack";
import type { StockChange } from "./store-service";

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export const lowStockConfigSchema = z.object({
  threshold: z.number().int().min(0).max(1_000_000).default(DEFAULT_LOW_STOCK_THRESHOLD),
  recipients: z.array(z.string().email()).min(1),
});
export type LowStockConfig = z.infer<typeof lowStockConfigSchema>;

export const scheduledReportConfigSchema = z.object({
  frequency: z.enum(["daily", "weekly"]),
  hour: z.number().int().min(0).max(23).default(7), // UTC
  weekday: z.number().int().min(0).max(6).default(1), // JS getUTCDay(), 1 = Monday
  recipients: z.array(z.string().email()).min(1),
});
export type ScheduledReportConfig = z.infer<typeof scheduledReportConfigSchema>;

export type AutomationRule = typeof automationRules.$inferSelect;

/**
 * Pure decision function for the low-stock engine (unit-tested).
 * Alerts only on a downward crossing of the effective threshold so a
 * product sitting at low stock doesn't alert on every sync. First-seen
 * products (oldQty null) never alert — initial imports would stampede.
 */
export function evaluateLowStock(
  change: Pick<StockChange, "oldQty" | "newQty" | "tracked" | "thresholdQty">,
  defaultThreshold: number,
): { alert: boolean; threshold: number } {
  const threshold = change.thresholdQty ?? defaultThreshold;
  if (!change.tracked || change.oldQty === null) {
    return { alert: false, threshold };
  }
  const alert = change.oldQty > threshold && change.newQty <= threshold;
  return { alert, threshold };
}

/** Applies enabled low-stock rules to a batch of sync changes. */
export async function processStockChanges(
  changes: StockChange[],
): Promise<void> {
  if (changes.length === 0) return;

  const storeIds = [...new Set(changes.map((c) => c.storeId))];
  const rules = await db.query.automationRules.findMany({
    where: and(
      inArray(automationRules.storeId, storeIds),
      eq(automationRules.type, "low_stock_alert"),
      eq(automationRules.enabled, true),
    ),
  });
  if (rules.length === 0) return;

  const storeRows = await db.query.stores.findMany({
    where: inArray(stores.id, storeIds),
  });
  const storesById = new Map(storeRows.map((s) => [s.id, s]));

  for (const rule of rules) {
    const parsed = lowStockConfigSchema.safeParse(rule.config);
    if (!parsed.success) {
      logger.warn({ ruleId: rule.id }, "invalid low-stock rule config");
      continue;
    }
    const config = parsed.data;
    const store = storesById.get(rule.storeId);
    if (!store) continue;

    for (const change of changes.filter((c) => c.storeId === rule.storeId)) {
      const { alert, threshold } = evaluateLowStock(change, config.threshold);
      if (!alert) continue;

      const summary =
        change.newQty <= 0
          ? `${change.title} is out of stock`
          : `${change.title} is low on stock (${change.newQty} left, threshold ${threshold})`;

      const slacked = await sendSlack(
        change.orgId,
        `:package: ${summary} — ${store.name}`,
      );

      await db.insert(alertsLog).values({
        orgId: change.orgId,
        storeId: change.storeId,
        type: change.newQty <= 0 ? "out_of_stock" : "low_stock",
        payload: {
          ruleId: rule.id,
          productId: change.productId,
          title: change.title,
          sku: change.sku,
          qty: change.newQty,
          threshold,
          summary,
        },
        deliveredVia: slacked ? "email,slack" : "email",
      });

      const html = await lowStockHtml({
        storeName: store.name,
        productTitle: change.title,
        sku: change.sku,
        qty: change.newQty,
        threshold,
      });
      for (const recipient of config.recipients) {
        await sendMail({
          to: recipient,
          subject:
            change.newQty <= 0
              ? `Out of stock: ${change.title}`
              : `Low stock: ${change.title} (${change.newQty} left)`,
          html,
        });
      }
    }
  }
}

// --- CRUD (org-scoped) ------------------------------------------------------

async function requireStoreInOrgById(storeId: string, orgId: string) {
  const store = await db.query.stores.findFirst({
    where: and(eq(stores.id, storeId), eq(stores.orgId, orgId)),
  });
  if (!store) throw new Error("Store not found in organization");
  return store;
}

export async function listAutomationRules(orgId: string) {
  return db
    .select({ rule: automationRules, store: stores })
    .from(automationRules)
    .innerJoin(stores, eq(automationRules.storeId, stores.id))
    .where(eq(stores.orgId, orgId))
    .orderBy(automationRules.createdAt);
}

export async function getAutomationRule(ruleId: string, orgId: string) {
  const rows = await db
    .select({ rule: automationRules, store: stores })
    .from(automationRules)
    .innerJoin(stores, eq(automationRules.storeId, stores.id))
    .where(and(eq(automationRules.id, ruleId), eq(stores.orgId, orgId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createAutomationRule(params: {
  orgId: string;
  actorId: string;
  storeId: string;
  type: "low_stock_alert" | "scheduled_report" | "ads_guard";
  config: Record<string, unknown>;
}): Promise<AutomationRule> {
  await requireStoreInOrgById(params.storeId, params.orgId);
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, params.orgId),
  });
  if (org) await assertCanAddAutomation(org);
  const [rule] = await db
    .insert(automationRules)
    .values({
      storeId: params.storeId,
      type: params.type,
      config: params.config,
      enabled: true,
    })
    .returning();
  await recordAudit({
    orgId: params.orgId,
    actor: params.actorId,
    action: "automation.created",
    payload: { ruleId: rule.id, type: params.type },
  });
  return rule;
}

export async function updateAutomationRule(params: {
  ruleId: string;
  orgId: string;
  actorId: string;
  config?: Record<string, unknown>;
  enabled?: boolean;
}): Promise<void> {
  const found = await getAutomationRule(params.ruleId, params.orgId);
  if (!found) throw new Error("Rule not found");
  await db
    .update(automationRules)
    .set({
      ...(params.config !== undefined ? { config: params.config } : {}),
      ...(params.enabled !== undefined ? { enabled: params.enabled } : {}),
    })
    .where(eq(automationRules.id, params.ruleId));
  await recordAudit({
    orgId: params.orgId,
    actor: params.actorId,
    action: "automation.updated",
    payload: { ruleId: params.ruleId },
  });
}

export async function deleteAutomationRule(params: {
  ruleId: string;
  orgId: string;
  actorId: string;
}): Promise<void> {
  const found = await getAutomationRule(params.ruleId, params.orgId);
  if (!found) throw new Error("Rule not found");
  await db.delete(automationRules).where(eq(automationRules.id, params.ruleId));
  await recordAudit({
    orgId: params.orgId,
    actor: params.actorId,
    action: "automation.deleted",
    payload: { ruleId: params.ruleId },
  });
}

/** Default recipients for new rules: the org owner's email. */
export async function defaultRecipients(orgId: string): Promise<string[]> {
  const rows = await db
    .select({ email: users.email })
    .from(organizations)
    .innerJoin(users, eq(organizations.ownerUserId, users.id))
    .where(eq(organizations.id, orgId))
    .limit(1);
  return rows[0] ? [rows[0].email] : [];
}
