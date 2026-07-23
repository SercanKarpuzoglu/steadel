import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireOrg } from "@/lib/org";
import { isMockDomain } from "@/providers/stores/types";
import {
  disconnectStoreAction,
  setThresholdAction,
  syncNowAction,
  toggleTrackedAction,
  trackAllAction,
} from "../actions";

export const metadata: Metadata = { title: "Store" };

type SortKey = "title" | "qty" | "sku";

export default async function StoreDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; sort?: string; dir?: string }>;
}) {
  const { org } = await requireOrg();
  const { id } = await params;
  const { q = "", sort = "title", dir = "asc" } = await searchParams;

  const store = await db.query.stores.findFirst({
    where: and(eq(stores.id, id), eq(stores.orgId, org.id)),
  });
  if (!store) notFound();

  const sortKey: SortKey = ["title", "qty", "sku"].includes(sort)
    ? (sort as SortKey)
    : "title";
  const sortCol =
    sortKey === "qty"
      ? products.inventoryQty
      : sortKey === "sku"
        ? products.sku
        : products.title;
  const orderBy = dir === "desc" ? desc(sortCol) : asc(sortCol);

  const rows = await db.query.products.findMany({
    where: q
      ? and(
          eq(products.storeId, store.id),
          or(ilike(products.title, `%${q}%`), ilike(products.sku, `%${q}%`)),
        )
      : eq(products.storeId, store.id),
    orderBy: [orderBy],
    limit: 500,
  });

  const sortLink = (key: SortKey) => {
    const nextDir = sortKey === key && dir === "asc" ? "desc" : "asc";
    const sp = new URLSearchParams({ sort: key, dir: nextDir });
    if (q) sp.set("q", q);
    return `/stores/${store.id}?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{store.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {store.domain} · status{" "}
            <span className="font-mono">{store.status}</span> · last sync{" "}
            {store.lastSyncAt?.toLocaleString("en-GB") ?? "never"}
          </p>
        </div>
        <div className="flex gap-2">
          <form action={syncNowAction}>
            <input type="hidden" name="storeId" value={store.id} />
            <button
              type="submit"
              className="h-9 cursor-pointer rounded-md border border-line bg-white/60 px-3 text-sm hover:bg-white"
            >
              Sync now
            </button>
          </form>
          {store.status !== "connected" && !isMockDomain(store.domain) && (
            <Link
              href={`/api/shopify/install?shop=${store.domain}`}
              className="flex h-9 items-center rounded-md bg-amber px-3 text-sm font-medium text-paper hover:bg-amber-dark"
            >
              Reconnect
            </Link>
          )}
          <form action={disconnectStoreAction}>
            <input type="hidden" name="storeId" value={store.id} />
            <button
              type="submit"
              className="h-9 cursor-pointer rounded-md border border-red-300 px-3 text-sm text-red-700 hover:bg-red-50"
            >
              Disconnect
            </button>
          </form>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Track a product to include it in low-stock alerts and the ads
              guard. Threshold overrides the automation default.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <form action={trackAllAction}>
              <input type="hidden" name="storeId" value={store.id} />
              <input type="hidden" name="tracked" value="true" />
              <button
                type="submit"
                className="cursor-pointer text-sm text-amber-text hover:underline"
              >
                Track all
              </button>
            </form>
            <span className="text-line">|</span>
            <form action={trackAllAction}>
              <input type="hidden" name="storeId" value={store.id} />
              <input type="hidden" name="tracked" value="false" />
              <button
                type="submit"
                className="cursor-pointer text-sm text-ink-soft hover:underline"
              >
                Untrack all
              </button>
            </form>
          </div>
        </div>

        <form method="GET" className="mt-4 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search title or SKU…"
            className="h-9 w-64 rounded-md border border-line bg-white px-3 text-sm"
          />
          <button
            type="submit"
            className="h-9 cursor-pointer rounded-md border border-line bg-white/60 px-3 text-sm hover:bg-white"
          >
            Search
          </button>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-xs tracking-wide text-ink-soft uppercase">
                <th className="py-2 pr-4">
                  <Link href={sortLink("title")} className="hover:text-ink">
                    Product {sortKey === "title" && (dir === "asc" ? "↑" : "↓")}
                  </Link>
                </th>
                <th className="py-2 pr-4">
                  <Link href={sortLink("sku")} className="hover:text-ink">
                    SKU {sortKey === "sku" && (dir === "asc" ? "↑" : "↓")}
                  </Link>
                </th>
                <th className="py-2 pr-4">
                  <Link href={sortLink("qty")} className="hover:text-ink">
                    Stock {sortKey === "qty" && (dir === "asc" ? "↑" : "↓")}
                  </Link>
                </th>
                <th className="py-2 pr-4">Tracked</th>
                <th className="py-2">Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((product) => (
                <tr key={product.id}>
                  <td className="max-w-xs truncate py-2.5 pr-4">
                    {product.title}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs">
                    {product.sku ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={
                        product.inventoryQty <= 0
                          ? "font-semibold text-red-700"
                          : product.thresholdQty != null &&
                              product.inventoryQty <= product.thresholdQty
                            ? "font-semibold text-amber-text"
                            : ""
                      }
                    >
                      {product.inventoryQty}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <form action={toggleTrackedAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        aria-pressed={product.tracked}
                        className={`h-6 w-11 cursor-pointer rounded-full p-0.5 transition ${
                          product.tracked ? "bg-amber" : "bg-line"
                        }`}
                      >
                        <span
                          className={`block h-5 w-5 rounded-full bg-white shadow transition ${
                            product.tracked ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                    </form>
                  </td>
                  <td className="py-2.5">
                    <form action={setThresholdAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="productId" value={product.id} />
                      <input
                        name="threshold"
                        type="number"
                        min={0}
                        defaultValue={product.thresholdQty ?? ""}
                        placeholder="default"
                        className="h-8 w-20 rounded-md border border-line bg-white px-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="cursor-pointer text-xs text-ink-soft hover:text-ink"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-ink-soft">
                    {q ? "No products match your search." : "No products synced yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
