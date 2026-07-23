import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireOrg } from "@/lib/org";
import { connectMockStoreAction } from "./actions";
import { WooConnectForm } from "./_components/woo-connect-form";

export const metadata: Metadata = { title: "Stores" };

const ERRORS: Record<string, string> = {
  "invalid-domain":
    "That does not look like a myshopify.com domain. Example: my-shop.myshopify.com",
  "shopify-not-configured":
    "Shopify API credentials are not configured on this server yet.",
  "oauth-failed": "Shopify connection failed or was cancelled. Please try again.",
  "plan-limit":
    "You've reached your plan's store limit — upgrade in Settings → Billing to connect more.",
};

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { org } = await requireOrg();
  const params = await searchParams;

  const orgStores = await db
    .select({
      store: stores,
      productCount: count(products.id),
    })
    .from(stores)
    .leftJoin(products, eq(products.storeId, stores.id))
    .where(eq(stores.orgId, org.id))
    .groupBy(stores.id)
    .orderBy(desc(stores.createdAt));

  const mockEnabled =
    process.env.MOCK_STORE_PROVIDER === "1" || !process.env.SHOPIFY_API_KEY;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Stores</h1>

      {params.error && ERRORS[params.error] && (
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {ERRORS[params.error]}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Connect a Shopify store</CardTitle>
          <CardDescription>
            Enter your shop domain — you&apos;ll approve read-only access to
            products, inventory and orders.
          </CardDescription>
          <form action="/api/shopify/install" method="GET" className="mt-4 flex gap-2">
            <input
              name="shop"
              placeholder="my-shop.myshopify.com"
              required
              className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
            />
            <button
              type="submit"
              className="h-10 shrink-0 cursor-pointer rounded-md bg-amber px-4 text-sm font-medium text-paper hover:bg-amber-dark"
            >
              Connect
            </button>
          </form>
        </Card>

        <Card>
          <CardTitle>Connect a WooCommerce store</CardTitle>
          <CardDescription>
            Enter your site URL and REST API keys (read access is enough).
          </CardDescription>
          <WooConnectForm />
          {mockEnabled && (
            <form action={connectMockStoreAction} className="mt-3">
              <button
                type="submit"
                className="cursor-pointer text-sm text-amber-text hover:underline"
              >
                …or connect a demo store (mock data)
              </button>
            </form>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Your stores</CardTitle>
        {orgStores.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-ink-soft">
              No stores connected yet — connect your first store above and
              your products will appear here within a minute.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-xs tracking-wide text-ink-soft uppercase">
                  <th className="py-2 pr-4">Store</th>
                  <th className="py-2 pr-4">Platform</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Products</th>
                  <th className="py-2">Last sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orgStores.map(({ store, productCount }) => (
                  <tr key={store.id}>
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/stores/${store.id}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {store.name}
                      </Link>
                      <span className="ml-2 text-xs text-ink-soft">
                        {store.domain}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs uppercase">
                      {store.platform}
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={store.status} />
                    </td>
                    <td className="py-2.5 pr-4">{productCount}</td>
                    <td className="py-2.5 text-ink-soft">
                      {store.lastSyncAt?.toLocaleString("en-GB") ?? "never"}
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    connected: "bg-emerald-100 text-emerald-800",
    error: "bg-red-100 text-red-800",
    disconnected: "bg-gray-200 text-gray-700",
  };
  return (
    <span
      className={`rounded px-2 py-0.5 font-mono text-xs ${styles[status] ?? ""}`}
    >
      {status}
    </span>
  );
}
