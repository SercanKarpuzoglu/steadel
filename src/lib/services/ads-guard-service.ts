import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { adLinks, alertsLog, automationRules, stores } from "@/db/schema";
import { adsGuardHtml } from "@/emails/alert-emails";
import { logger } from "@/lib/logger";
import { sendMail } from "@/lib/mail";
import { sendSlack } from "@/lib/slack";
import type { AdSetStatus } from "@/providers/ads/types";
import { adsGuardEnabled } from "@/providers/ads/types";
import { defaultRecipients } from "./automation-service";
import { getAdsProvider, linksForProducts } from "./ads-service";
import type { StockChange } from "./store-service";

export type AdsAction =
  | "pause"
  | "resume"
  | "mark_unknown"
  | "mark_active"
  | "none";

/**
 * Pure state machine for one ad link (unit-tested). Safety rules (SPEC §5.3):
 * - pause only ad sets we can see are ACTIVE;
 * - an ad set found already PAUSED (a human did it) is marked `unknown`
 *   and never touched again until it is seen ACTIVE;
 * - resume ONLY when `state = paused_by_steadel` — never resume a human's pause.
 */
export function decideAdsAction(params: {
  qty: number;
  mode: "pause_on_zero" | "pause_below_threshold";
  thresholdQty: number | null;
  linkState: "active" | "paused_by_steadel" | "unknown";
  providerStatus: AdSetStatus | null;
}): AdsAction {
  const threshold =
    params.mode === "pause_below_threshold" ? (params.thresholdQty ?? 0) : 0;
  const shouldBePaused = params.qty <= threshold;

  if (shouldBePaused) {
    if (params.linkState === "paused_by_steadel") return "none";
    if (params.providerStatus === "ACTIVE") return "pause";
    if (params.providerStatus === "PAUSED") return "mark_unknown";
    return "none"; // provider unreachable / adset gone — do nothing
  }

  // Stock is above the threshold again.
  if (params.linkState === "paused_by_steadel") return "resume";
  if (params.providerStatus === "ACTIVE" && params.linkState !== "active") {
    return "mark_active"; // observed running — record it without acting
  }
  return "none";
}

/** Applies the ads guard to a batch of stock changes from a sync. */
export async function processAdsGuardChanges(
  changes: StockChange[],
): Promise<void> {
  if (!adsGuardEnabled()) return;
  const tracked = changes.filter((c) => c.tracked);
  if (tracked.length === 0) return;

  // Engine is gated per store by an enabled ads_guard rule.
  const storeIds = [...new Set(tracked.map((c) => c.storeId))];
  const guardRules = await db.query.automationRules.findMany({
    where: and(
      inArray(automationRules.storeId, storeIds),
      eq(automationRules.type, "ads_guard"),
      eq(automationRules.enabled, true),
    ),
  });
  const guardedStores = new Set(guardRules.map((r) => r.storeId));
  const guarded = tracked.filter((c) => guardedStores.has(c.storeId));
  if (guarded.length === 0) return;

  const links = await linksForProducts(guarded.map((c) => c.productId));
  if (links.length === 0) return;

  const storeRows = await db.query.stores.findMany({
    where: inArray(stores.id, storeIds),
  });
  const storesById = new Map(storeRows.map((s) => [s.id, s]));

  // One status snapshot per connection per run.
  const statusByConnection = new Map<string, Map<string, AdSetStatus>>();
  const adsetNames = new Map<string, string>();
  for (const { connection } of links) {
    if (statusByConnection.has(connection.id)) continue;
    try {
      const campaigns = await getAdsProvider(connection).listCampaigns();
      const statuses = new Map<string, AdSetStatus>();
      for (const campaign of campaigns) {
        for (const adset of campaign.adsets) {
          statuses.set(adset.ref, adset.status);
          adsetNames.set(adset.ref, adset.name);
        }
      }
      statusByConnection.set(connection.id, statuses);
    } catch (err) {
      logger.error(
        { connectionId: connection.id, err: String(err) },
        "ads provider unreachable — skipping guard for this connection",
      );
      statusByConnection.set(connection.id, new Map());
    }
  }

  for (const change of guarded) {
    const productLinks = links.filter((l) => l.link.productId === change.productId);
    for (const { link, connection } of productLinks) {
      const providerStatus =
        statusByConnection.get(connection.id)?.get(link.externalAdsetRef) ?? null;
      const action = decideAdsAction({
        qty: change.newQty,
        mode: link.mode,
        thresholdQty: link.thresholdQty ?? change.thresholdQty,
        linkState: link.state,
        providerStatus,
      });
      if (action === "none") continue;

      const provider = getAdsProvider(connection);
      const adsetName = adsetNames.get(link.externalAdsetRef) ?? link.externalAdsetRef;
      const store = storesById.get(change.storeId);
      const recipients = await defaultRecipients(change.orgId);

      try {
        if (action === "pause") {
          await provider.pauseAdSet(link.externalAdsetRef);
          await db
            .update(adLinks)
            .set({ state: "paused_by_steadel", lastActionAt: new Date() })
            .where(eq(adLinks.id, link.id));
          const summary = `Steadel paused "${adsetName}" because ${change.title} sold out`;
          const slacked = await sendSlack(change.orgId, `:no_entry: ${summary}`);
          await db.insert(alertsLog).values({
            orgId: change.orgId,
            storeId: change.storeId,
            type: "ads_paused",
            payload: {
              linkId: link.id,
              adset: link.externalAdsetRef,
              adsetName,
              productId: change.productId,
              title: change.title,
              qty: change.newQty,
              summary,
            },
            deliveredVia: slacked ? "email,slack" : "email",
          });
          const html = await adsGuardHtml({
            action: "paused",
            adsetName,
            productTitle: change.title,
            qty: change.newQty,
            storeName: store?.name ?? "your store",
          });
          for (const to of recipients) {
            await sendMail({
              to,
              subject: `Ads guard: paused "${adsetName}" — ${change.title} sold out`,
              html,
            });
          }
        } else if (action === "resume") {
          await provider.resumeAdSet(link.externalAdsetRef);
          await db
            .update(adLinks)
            .set({ state: "active", lastActionAt: new Date() })
            .where(eq(adLinks.id, link.id));
          const summary = `Steadel resumed "${adsetName}" — ${change.title} is back in stock (${change.newQty})`;
          const slacked = await sendSlack(change.orgId, `:white_check_mark: ${summary}`);
          await db.insert(alertsLog).values({
            orgId: change.orgId,
            storeId: change.storeId,
            type: "ads_resumed",
            payload: {
              linkId: link.id,
              adset: link.externalAdsetRef,
              adsetName,
              productId: change.productId,
              title: change.title,
              qty: change.newQty,
              summary,
            },
            deliveredVia: slacked ? "email,slack" : "email",
          });
          const html = await adsGuardHtml({
            action: "resumed",
            adsetName,
            productTitle: change.title,
            qty: change.newQty,
            storeName: store?.name ?? "your store",
          });
          for (const to of recipients) {
            await sendMail({
              to,
              subject: `Ads guard: resumed "${adsetName}" — ${change.title} restocked`,
              html,
            });
          }
        } else if (action === "mark_unknown") {
          await db
            .update(adLinks)
            .set({ state: "unknown", lastActionAt: new Date() })
            .where(eq(adLinks.id, link.id));
        } else if (action === "mark_active") {
          await db
            .update(adLinks)
            .set({ state: "active" })
            .where(eq(adLinks.id, link.id));
        }
      } catch (err) {
        logger.error(
          { linkId: link.id, action, err: String(err) },
          "ads guard action failed",
        );
      }
    }
  }
}
