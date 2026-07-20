import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { adLinks, alertsLog, products, stores } from "@/db/schema";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireOrg } from "@/lib/org";
import { CirclePause, PackageSearch, PackageX, Store } from "lucide-react";
import { AlertTypeIcon } from "@/components/nav-icon";

const ALERT_LABELS: Record<string, string> = {
  out_of_stock: "Out of stock",
  low_stock: "Low stock",
  ads_guard: "Ads guard",
  scheduled_report: "Report",
};

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { org } = await requireOrg();

  const orgStores = await db.query.stores.findMany({
    where: eq(stores.orgId, org.id),
  });
  const storeIds = orgStores.map((s) => s.id);

  const [trackedCount] = storeIds.length
    ? await db
        .select({ value: count() })
        .from(products)
        .where(and(inArray(products.storeId, storeIds), eq(products.tracked, true)))
    : [{ value: 0 }];

  const [outOfStock] = storeIds.length
    ? await db
        .select({ value: count() })
        .from(products)
        .where(
          and(
            inArray(products.storeId, storeIds),
            eq(products.tracked, true),
            lte(products.inventoryQty, 0),
          ),
        )
    : [{ value: 0 }];

  const productIds = storeIds.length
    ? (
        await db
          .select({ id: products.id })
          .from(products)
          .where(inArray(products.storeId, storeIds))
      ).map((p) => p.id)
    : [];
  const [pausedAds] = productIds.length
    ? await db
        .select({ value: count() })
        .from(adLinks)
        .where(
          and(
            inArray(adLinks.productId, productIds),
            eq(adLinks.state, "paused_by_steadel"),
          ),
        )
    : [{ value: 0 }];

  const recentAlerts = await db.query.alertsLog.findMany({
    where: eq(alertsLog.orgId, org.id),
    orderBy: [desc(alertsLog.createdAt)],
    limit: 8,
  });

  const cards = [
    {
      icon: Store,
      label: "Stores",
      value: orgStores.length,
      detail: `${orgStores.filter((s) => s.status === "connected").length} connected`,
      href: "/stores",
    },
    {
      icon: PackageSearch,
      label: "Tracked products",
      value: trackedCount.value,
      detail: "inventory watched",
      href: "/stores",
    },
    {
      icon: PackageX,
      label: "Out of stock",
      value: outOfStock.value,
      detail: "tracked products at zero",
      href: "/stores",
    },
    {
      icon: CirclePause,
      label: "Ads paused by Steadel",
      value: pausedAds.value,
      detail: "will resume on restock",
      href: "/automations",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft">
          A steady overview of {org.name}.
        </p>
      </div>

      {orgStores.length === 0 && (
        <Card className="border-amber bg-amber/10">
          <CardTitle>Finish setting up</CardTitle>
          <CardDescription>
            Connect your store and enable your first automation — it takes
            under three minutes.
          </CardDescription>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex h-10 items-center rounded-md bg-amber px-4 text-sm font-medium text-ink hover:bg-amber-dark"
          >
            Start onboarding
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 [&>*:nth-child(1)]:rise [&>*:nth-child(2)]:rise [&>*:nth-child(2)]:rise-1 [&>*:nth-child(3)]:rise [&>*:nth-child(3)]:rise-2 [&>*:nth-child(4)]:rise [&>*:nth-child(4)]:rise-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="transition hover:border-amber/60">
              <p className="flex items-center gap-2 font-mono text-xs tracking-wide text-ink-soft uppercase">
                <card.icon className="h-4 w-4 text-amber-text" aria-hidden="true" />
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold">{card.value}</p>
              <p className="mt-1 text-xs text-ink-soft">{card.detail}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardTitle>Recent alerts</CardTitle>
        <CardDescription>
          Low-stock warnings, ads-guard actions and report deliveries.
        </CardDescription>
        {recentAlerts.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
            <svg viewBox="0 0 64 64" className="h-10 w-10 opacity-40" aria-hidden="true">
              <rect width="64" height="64" rx="14" fill="#16263d" />
              <path d="M46 18 H28 Q20 18 20 25 Q20 32 28 32 H36 Q44 32 44 39 Q44 46 36 46 H18" fill="none" stroke="#f0a830" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-ink-soft">
              All quiet — no alerts yet. They&apos;ll appear here the moment
              something needs your attention.
            </p>
            <Link
              href="/automations"
              className="rounded-md bg-amber px-4 py-2 text-sm font-medium text-ink transition hover:bg-amber-dark"
            >
              Set up an automation
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {recentAlerts.map((alert) => (
              <li key={alert.id} className="flex items-center gap-3 py-2.5">
                <AlertTypeIcon type={alert.type} />
                <span className="shrink-0 rounded bg-paper-soft px-2 py-0.5 text-xs text-ink-soft">
                  {ALERT_LABELS[alert.type] ?? alert.type}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                  {String(
                    (alert.payload as Record<string, unknown>)?.summary ?? "",
                  )}
                </span>
                <span className="shrink-0 text-xs text-ink-soft">
                  {alert.createdAt.toLocaleString("en-GB")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
