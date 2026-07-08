import "dotenv/config";
import { Worker, type Job } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { logger } from "@/lib/logger";
import { getRedis } from "@/lib/redis";
import { syncStoreProducts } from "@/lib/services/store-service";
import { getSyncQueue, SYNC_QUEUE } from "./queues";

const POLL_INTERVAL_MS = 15 * 60 * 1000; // SPEC §5.1: fallback polling every 15 min

async function handleSyncStore(job: Job) {
  const { storeId } = job.data as { storeId: string };
  const changes = await syncStoreProducts(storeId);
  logger.info({ storeId, changes: changes.length }, "store synced");
  return { changes: changes.length };
}

async function handlePollAllStores() {
  const connected = await db.query.stores.findMany({
    where: eq(stores.status, "connected"),
  });
  for (const store of connected) {
    await getSyncQueue().add(
      "sync-store",
      { storeId: store.id },
      { jobId: `sync-store:${store.id}` },
    );
  }
  logger.info({ count: connected.length }, "poll cycle enqueued");
}

export async function startWorker() {
  // Repeatable poll — BullMQ job scheduler upserts are idempotent.
  await getSyncQueue().upsertJobScheduler(
    "poll-all-stores",
    { every: POLL_INTERVAL_MS },
    { name: "poll-all-stores" },
  );

  const worker = new Worker(
    SYNC_QUEUE,
    async (job) => {
      switch (job.name) {
        case "sync-store":
          return handleSyncStore(job);
        case "poll-all-stores":
          return handlePollAllStores();
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
