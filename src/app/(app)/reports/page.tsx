import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { alertsLog, automationRules, products, stores } from "@/db/schema";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireOrg } from "@/lib/org";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/services/automation-service";
import { AlertsChart, StockChart } from "./_components/report-charts";
import { emailWeeklyAction } from "./actions";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const { org } = await requireOrg();

  const orgStores = await db.query.stores.findMany({
    where: eq(stores.orgId, org.id),
  });
  const storeIds = orgStores.map((s) => s.id);

  // Alert history — last 30 days, bucketed per day.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  since.setUTCHours(0, 0, 0, 0);
  const alerts = await db.query.alertsLog.findMany({
    where: and(eq(alertsLog.orgId, org.id), gte(alertsLog.createdAt, since)),
    orderBy: [desc(alertsLog.createdAt)],
  });
  const buckets = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(5, 10), 0);
  }
  for (const alert of alerts) {
    const key = alert.createdAt.toISOString().slice(5, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const alertSeries = [...buckets.entries()].map(([day, count]) => ({
    day,
    alerts: count,
  }));

  // Inventory: lowest-stock tracked products.
  const tracked = storeIds.length
    ? await db.query.products.findMany({
        where: and(inArray(products.storeId, storeIds), eq(products.tracked, true)),
      })
    : [];
  const lowest = [...tracked]
    .sort((a, b) => a.inventoryQty - b.inventoryQty)
    .slice(0, 10)
    .map((p) => ({
      name: p.title.length > 24 ? `${p.title.slice(0, 24)}…` : p.title,
      qty: p.inventoryQty,
      threshold: p.thresholdQty ?? DEFAULT_LOW_STOCK_THRESHOLD,
    }));

  const hasWeeklyReport = storeIds.length
    ? (
        await db.query.automationRules.findMany({
          where: and(
            inArray(automationRules.storeId, storeIds),
            eq(automationRules.type, "scheduled_report"),
          ),
        })
      ).length > 0
    : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Reports</h1>
        {orgStores.length > 0 &&
          (hasWeeklyReport ? (
            <Link
              href="/automations"
              className="text-sm text-ink-soft hover:text-ink hover:underline"
            >
              Weekly report scheduled ✓ — manage
            </Link>
          ) : (
            <form action={emailWeeklyAction}>
              <button
                type="submit"
                className="h-10 cursor-pointer rounded-md bg-amber px-4 text-sm font-medium text-ink hover:bg-amber-dark"
              >
                Email me this weekly
              </button>
            </form>
          ))}
      </div>

      {orgStores.length === 0 ? (
        <Card>
          <CardTitle>No data yet</CardTitle>
          <CardDescription>
            <Link href="/stores" className="text-amber-text hover:underline">
              Connect a store
            </Link>{" "}
            to see inventory and alert reports here.
          </CardDescription>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Tracked products", value: tracked.length },
              {
                label: "Out of stock",
                value: tracked.filter((p) => p.inventoryQty <= 0).length,
              },
              {
                label: "Low stock",
                value: tracked.filter(
                  (p) =>
                    p.inventoryQty > 0 &&
                    p.inventoryQty <=
                      (p.thresholdQty ?? DEFAULT_LOW_STOCK_THRESHOLD),
                ).length,
              },
              { label: "Alerts (30d)", value: alerts.length },
            ].map((stat) => (
              <Card key={stat.label}>
                <p className="font-mono text-xs tracking-wide text-ink-soft uppercase">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
              </Card>
            ))}
          </div>

          <Card>
            <CardTitle>Alert history — last 30 days</CardTitle>
            <CardDescription>
              Low-stock, out-of-stock, ads-guard and report events per day.
            </CardDescription>
            <div className="mt-4">
              <AlertsChart data={alertSeries} />
            </div>
          </Card>

          <Card>
            <CardTitle>Lowest stock — tracked products</CardTitle>
            <CardDescription>
              The ten tracked products closest to selling out.
            </CardDescription>
            {lowest.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">
                No tracked products yet — enable tracking on a store page.
              </p>
            ) : (
              <div className="mt-4">
                <StockChart data={lowest} />
              </div>
            )}
          </Card>

          <p className="text-xs text-ink-soft">
            Sales charts appear once your store connection includes order
            history (Shopify orders scope) — inventory and alert analytics
            never require it.
          </p>
        </>
      )}
    </div>
  );
}
