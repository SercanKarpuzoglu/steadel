import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { alertsLog, automationRules, organizations, products, stores } from "@/db/schema";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/org";

export const metadata: Metadata = { title: "Admin — organization" };

/** Read-only org inspection (SPEC §6 screen 13, "impersonate-read-only"). */
export default async function AdminOrgPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, id),
  });
  if (!org) notFound();

  const orgStores = await db.query.stores.findMany({
    where: eq(stores.orgId, org.id),
  });
  const storeIds = orgStores.map((s) => s.id);
  const orgProducts = storeIds.length
    ? await db.query.products.findMany({
        where: inArray(products.storeId, storeIds),
      })
    : [];
  const rules = storeIds.length
    ? await db.query.automationRules.findMany({
        where: inArray(automationRules.storeId, storeIds),
      })
    : [];
  const alerts = await db.query.alertsLog.findMany({
    where: eq(alertsLog.orgId, org.id),
    orderBy: [desc(alertsLog.createdAt)],
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-ink-soft hover:text-ink">
        ← Admin
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold">{org.name}</h1>
        <span className="rounded bg-paper-soft px-2 py-0.5 font-mono text-xs uppercase">
          read-only
        </span>
      </div>
      <p className="text-sm text-ink-soft">
        Plan <span className="font-mono uppercase">{org.plan}</span>
        {org.subscriptionStatus && <> · subscription {org.subscriptionStatus}</>}
        {org.trialEndsAt && (
          <> · trial ends {org.trialEndsAt.toLocaleDateString("en-GB")}</>
        )}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Stores", value: orgStores.length },
          { label: "Products", value: orgProducts.length },
          {
            label: "Tracked",
            value: orgProducts.filter((p) => p.tracked).length,
          },
          { label: "Rules", value: rules.length },
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
        <CardTitle>Stores</CardTitle>
        {orgStores.length === 0 ? (
          <CardDescription>None connected.</CardDescription>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {orgStores.map((store) => (
              <li key={store.id} className="flex items-center gap-3">
                <span className="font-medium">{store.name}</span>
                <span className="text-ink-soft">{store.domain}</span>
                <span className="font-mono text-xs">{store.status}</span>
                <span className="text-xs text-ink-soft">
                  last sync {store.lastSyncAt?.toLocaleString("en-GB") ?? "never"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Recent alerts</CardTitle>
        {alerts.length === 0 ? (
          <CardDescription>No alerts yet.</CardDescription>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex items-center gap-3">
                <span className="rounded bg-paper-soft px-2 py-0.5 font-mono text-xs">
                  {alert.type}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink-soft">
                  {String((alert.payload as Record<string, unknown>)?.summary ?? "")}
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
