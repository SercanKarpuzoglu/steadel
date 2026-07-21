import "dotenv/config";
import { Worker, type Job } from "bullmq";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { automationRules, organizations, stores, users } from "@/db/schema";
import { logger } from "@/lib/logger";
import { storeAutomationsAllowed } from "@/lib/plans";
import { getRedis } from "@/lib/redis";
import { processAdsGuardChanges } from "@/lib/services/ads-guard-service";
import { processStockChanges, scheduledReportConfigSchema } from "@/lib/services/automation-service";
import { isReportDue, sendScheduledReport } from "@/lib/services/report-service";
import { syncStoreProducts } from "@/lib/services/store-service";
import { enqueueStoreSync, getSyncQueue, SYNC_QUEUE } from "./queues";

// SPEC §5.1/§5.2: fallback polling — Shopify every 15 min, WooCommerce every
// 10 min. A 5-minute tick enqueues stores whose last sync is older than
// their platform interval.
const POLL_TICK_MS = 5 * 60 * 1000;
const SYNC_INTERVAL_MS: Record<string, number> = {
  shopify: 15 * 60 * 1000,
  woocommerce: 10 * 60 * 1000,
};
const REPORT_TICK_MS = 60 * 60 * 1000; // hourly report due-check
const PURGE_TICK_MS = 24 * 60 * 60 * 1000; // daily deleted-account purge
const PURGE_AFTER_DAYS = 30;

/**
 * Sync + downstream automations — the worker's main path for a store, and the
 * single choke point for entitlement: webhook-, poll- and manually triggered
 * runs all land here. Suspended orgs (expired trial / canceled subscription)
 * are skipped so no alerts, ad actions or syncs run for them (terms §4).
 */
export async function runStoreSync(storeId: string): Promise<number> {
  if (!(await storeAutomationsAllowed(storeId))) {
    logger.info({ storeId }, "automations suspended for org — sync skipped");
    return 0;
  }
  const changes = await syncStoreProducts(storeId);
  await processStockChanges(changes);
  await processAdsGuardChanges(changes); // no-op unless ADS_GUARD_ENABLED
  return changes.length;
}

async function handleSyncStore(job: Job) {
  const { storeId } = job.data as { storeId: string };
  const changes = await runStoreSync(storeId);
  logger.info({ storeId, changes }, "store synced");
  return { changes };
}

async function handlePollAllStores() {
  const connected = await db.query.stores.findMany({
    where: eq(stores.status, "connected"),
  });
  const now = Date.now();
  let enqueued = 0;
  for (const store of connected) {
    const interval = SYNC_INTERVAL_MS[store.platform] ?? SYNC_INTERVAL_MS.shopify;
    if (store.lastSyncAt && now - store.lastSyncAt.getTime() < interval) {
      continue;
    }
    await enqueueStoreSync(store.id);
    enqueued += 1;
  }
  if (enqueued > 0) logger.info({ enqueued }, "poll cycle enqueued");
}

/** Hourly: enqueue every due report exactly once per period (dedup by jobId). */
async function handleReportTick() {
  const now = new Date();
  const rules = await db.query.automationRules.findMany({
    where: and(
      eq(automationRules.type, "scheduled_report"),
      eq(automationRules.enabled, true),
    ),
  });
  let due = 0;
  for (const rule of rules) {
    const parsed = scheduledReportConfigSchema.safeParse(rule.config);
    if (!parsed.success) continue;
    if (!isReportDue(parsed.data, now)) continue;
    // Suspended orgs get no scheduled reports either (terms §4).
    if (!(await storeAutomationsAllowed(rule.storeId))) continue;
    const dateKey = now.toISOString().slice(0, 10);
    await getSyncQueue().add(
      "send-report",
      { ruleId: rule.id },
      { jobId: `report-${rule.id}-${dateKey}` },
    );
    due += 1;
  }
  if (due > 0) logger.info({ due }, "reports enqueued");
}

async function handleSendReport(job: Job) {
  const { ruleId } = job.data as { ruleId: string };
  const rule = await db.query.automationRules.findFirst({
    where: eq(automationRules.id, ruleId),
  });
  if (!rule || !rule.enabled) return { skipped: true };
  const sent = await sendScheduledReport(rule);
  return { sent };
}

/** GDPR erasure: hard-delete accounts soft-deleted more than 30 days ago. */
export async function purgeDeletedAccounts(): Promise<number> {
  const cutoff = new Date(Date.now() - PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const doomed = await db.query.users.findMany({
    where: and(lt(users.deletedAt, cutoff)),
  });
  for (const user of doomed) {
    // Orgs owned by the user cascade to stores/products/rules/alerts.
    await db.delete(organizations).where(eq(organizations.ownerUserId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
    logger.info({ userId: user.id }, "account purged after 30-day window");
  }
  return doomed.length;
}

export async function startWorker() {
  const queue = getSyncQueue();
  await queue.upsertJobScheduler(
    "poll-all-stores",
    { every: POLL_TICK_MS },
    { name: "poll-all-stores" },
  );
  await queue.upsertJobScheduler(
    "report-tick",
    { every: REPORT_TICK_MS },
    { name: "report-tick" },
  );
  await queue.upsertJobScheduler(
    "purge-accounts",
    { every: PURGE_TICK_MS },
    { name: "purge-accounts" },
  );

  const worker = new Worker(
    SYNC_QUEUE,
    async (job) => {
      switch (job.name) {
        case "sync-store":
          return handleSyncStore(job);
        case "poll-all-stores":
          return handlePollAllStores();
        case "report-tick":
          return handleReportTick();
        case "send-report":
          return handleSendReport(job);
        case "purge-accounts":
          return { purged: await purgeDeletedAccounts() };
        default:
          logger.warn({ name: job.name }, "unknown job");
      }
    },
    { connection: getRedis(), concurrency: 5 },
  );

  worker.on("failed", (job, err) => {
    logger.error({ job: job?.name, id: job?.id, err: String(err) }, "job failed");
  });

  logger.info("worker started");
  return worker;
}

if (process.argv[1]?.endsWith("worker.ts")) {
  startWorker().catch((err) => {
    logger.error({ err: String(err) }, "worker crashed on start");
    process.exit(1);
  });
}
