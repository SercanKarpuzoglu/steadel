import type { Metadata } from "next";
import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { requireOrg } from "@/lib/org";
import {
  getAdsProvider,
  listOrgAdConnections,
  listOrgAdLinks,
} from "@/lib/services/ads-service";
import { adsGuardEnabled } from "@/providers/ads/types";
import { connectMockMetaAction, unlinkAdSetAction } from "./actions";
import { LinkForm, type AdSetOption } from "./_components/link-form";

export const metadata: Metadata = { title: "Ads guard" };

const ERRORS: Record<string, string> = {
  "meta-not-configured":
    "Meta API credentials are not configured (or the ads guard flag is off).",
  "meta-oauth-failed": "Meta connection failed or was cancelled.",
  "no-ad-account": "No ad account found on that Meta profile.",
};

export default async function AdsGuardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { org } = await requireOrg();
  const params = await searchParams;

  const connections = await listOrgAdConnections(org.id);
  const links = await listOrgAdLinks(org.id);

  const orgStores = await db.query.stores.findMany({
    where: eq(stores.orgId, org.id),
    columns: { id: true },
  });
  const trackedProducts = orgStores.length
    ? await db.query.products.findMany({
        where: inArray(
          products.storeId,
          orgStores.map((s) => s.id),
        ),
        columns: { id: true, title: true, tracked: true },
      })
    : [];

  const adsetOptions: AdSetOption[] = [];
  for (const connection of connections.filter((c) => c.status === "connected")) {
    try {
      const campaigns = await getAdsProvider(connection).listCampaigns();
      for (const campaign of campaigns) {
        for (const adset of campaign.adsets) {
          adsetOptions.push({
            connectionId: connection.id,
            campaignRef: campaign.ref,
            campaignName: campaign.name,
            adsetRef: adset.ref,
            adsetName: adset.name,
          });
        }
      }
    } catch (err) {
      logger.error(
        { connectionId: connection.id, err: String(err) },
        "listCampaigns failed for ads page",
      );
    }
  }

  const metaConfigured =
    adsGuardEnabled() && !!process.env.META_APP_ID && !!process.env.META_APP_SECRET;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold">Ads guard</h1>
        <span className="rounded bg-amber/20 px-2 py-0.5 font-mono text-xs tracking-wide text-amber-text uppercase">
          Beta
        </span>
      </div>
      <p className="max-w-2xl text-sm text-ink-soft">
        Link tracked products to Meta ad sets. When a product sells out,
        Steadel pauses the linked ad sets and resumes them on restock — it
        never resumes anything you paused yourself.
      </p>

      {params.error && ERRORS[params.error] && (
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {ERRORS[params.error]}
        </p>
      )}

      {connections.length === 0 ? (
        <Card>
          <CardTitle>Connect Meta Ads</CardTitle>
          <CardDescription>
            {metaConfigured
              ? "Authorize Steadel to manage your ad sets (read + pause/resume only)."
              : "The Meta app is awaiting review — use the demo connection to try the guard with mock campaigns."}
          </CardDescription>
          <div className="mt-4 flex items-center gap-4">
            {metaConfigured && (
              <Link
                href="/api/meta/install"
                className="flex h-10 items-center rounded-md bg-amber px-4 text-sm font-medium text-paper hover:bg-amber-dark"
              >
                Connect Meta Ads
              </Link>
            )}
            <form action={connectMockMetaAction}>
              <button
                type="submit"
                className="h-10 cursor-pointer rounded-md border border-line bg-white/60 px-4 text-sm font-medium hover:bg-white"
              >
                Connect demo ad account
              </button>
            </form>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <CardTitle>Link a product to an ad set</CardTitle>
            <CardDescription>
              Only tracked products can guard ads.{" "}
              <Link href="/stores" className="text-amber-text hover:underline">
                Manage tracking
              </Link>
            </CardDescription>
            <div className="mt-4">
              <LinkForm
                products={trackedProducts
                  .filter((p) => p.tracked)
                  .map((p) => ({ id: p.id, title: p.title }))}
                adsets={adsetOptions}
              />
            </div>
          </Card>

          <Card>
            <CardTitle>Linked ad sets</CardTitle>
            {links.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">No links yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left font-mono text-xs tracking-wide text-ink-soft uppercase">
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Ad set</th>
                      <th className="py-2 pr-4">Mode</th>
                      <th className="py-2 pr-4">State</th>
                      <th className="py-2 pr-4">Last action</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {links.map(({ link, product }) => (
                      <tr key={link.id}>
                        <td className="max-w-xs truncate py-2.5 pr-4">
                          {product.title}
                          <span className="ml-2 text-xs text-ink-soft">
                            qty {product.inventoryQty}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs">
                          {link.externalAdsetRef}
                        </td>
                        <td className="py-2.5 pr-4 text-ink-soft">
                          {link.mode === "pause_on_zero"
                            ? "on sell-out"
                            : `below ${link.thresholdQty ?? "product threshold"}`}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={`rounded px-2 py-0.5 font-mono text-xs ${
                              link.state === "paused_by_steadel"
                                ? "bg-red-100 text-red-800"
                                : link.state === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {link.state}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-ink-soft">
                          {link.lastActionAt?.toLocaleString("en-GB") ?? "—"}
                        </td>
                        <td className="py-2.5">
                          <form action={unlinkAdSetAction}>
                            <input type="hidden" name="linkId" value={link.id} />
                            <button
                              type="submit"
                              className="cursor-pointer text-xs text-red-700 hover:underline"
                            >
                              Unlink
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
