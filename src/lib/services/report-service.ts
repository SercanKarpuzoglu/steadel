import { and, count, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { alertsLog, organizations, products, stores } from "@/db/schema";
import { reportHtml, type ReportData } from "@/emails/alert-emails";
import { sendMail } from "@/lib/mail";
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  scheduledReportConfigSchema,
  type AutomationRule,
} from "./automation-service";

/** Collects the inventory/alert snapshot a scheduled report is built from. */
export async function collectReportData(
  storeId: string,
  periodDays: number,
): Promise<ReportData | null> {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) return null;

  const allProducts = await db.query.products.findMany({
    where: eq(products.storeId, storeId),
  });
  const tracked = allProducts.filter((p) => p.tracked);
  const outOfStock = tracked.filter((p) => p.inventoryQty <= 0);
  const lowStock = tracked.filter(
    (p) =>
      p.inventoryQty > 0 &&
      p.inventoryQty <= (p.thresholdQty ?? DEFAULT_LOW_STOCK_THRESHOLD),
  );

  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const [alertRow] = await db
    .select({ value: count() })
    .from(alertsLog)
    .where(
      and(
        eq(alertsLog.storeId, storeId),
        gte(alertsLog.createdAt, since),
        lte(alertsLog.createdAt, new Date()),
      ),
    );

  return {
    storeName: store.name,
    periodLabel: periodDays === 1 ? "daily" : "weekly",
    totalProducts: allProducts.length,
    trackedProducts: tracked.length,
    outOfStock: outOfStock.map((p) => ({ title: p.title, sku: p.sku })),
    lowStock: lowStock.map((p) => ({
      title: p.title,
      sku: p.sku,
      qty: p.inventoryQty,
    })),
    alertCount: alertRow.value,
    adsPaused: 0, // populated once the ads guard (M4) is live
  };
}

/** Renders and emails one scheduled report; logs delivery to alerts_log. */
export async function sendScheduledReport(rule: AutomationRule): Promise<boolean> {
  const parsed = scheduledReportConfigSchema.safeParse(rule.config);
  if (!parsed.success) return false;
  const config = parsed.data;

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, rule.storeId),
  });
  if (!store) return false;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, store.orgId),
  });
  const brandName =
    org?.plan === "agency" && org.whiteLabelName ? org.whiteLabelName : undefined;

  const periodDays = config.frequency === "daily" ? 1 : 7;
  const data = await collectReportData(rule.storeId, periodDays);
  if (!data) return false;

  const html = await reportHtml(data, brandName);
  const subject = `${brandName ?? "Steadel"} ${data.periodLabel} report — ${data.storeName}`;
  for (const recipient of config.recipients) {
    await sendMail({ to: recipient, subject, html });
  }

  await db.insert(alertsLog).values({
    orgId: store.orgId,
    storeId: store.id,
    type: "scheduled_report",
    payload: {
      ruleId: rule.id,
      frequency: config.frequency,
      recipients: config.recipients.length,
      summary: `${data.periodLabel} report sent for ${data.storeName}`,
    },
    deliveredVia: "email",
  });
  return true;
}

/** True when a report rule is due at the given UTC timestamp (hour granularity). */
export function isReportDue(
  config: { frequency: "daily" | "weekly"; hour: number; weekday: number },
  now: Date,
): boolean {
  if (now.getUTCHours() !== config.hour) return false;
  if (config.frequency === "weekly" && now.getUTCDay() !== config.weekday) {
    return false;
  }
  return true;
}
