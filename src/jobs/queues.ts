import { Queue } from "bullmq";
import { getRedis } from "@/lib/redis";

export const SYNC_QUEUE = "sync";

const globalForQueues = globalThis as unknown as { syncQueue?: Queue };

export function getSyncQueue(): Queue {
  if (!globalForQueues.syncQueue) {
    globalForQueues.syncQueue = new Queue(SYNC_QUEUE, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 500,
        removeOnFail: 1000,
      },
    });
  }
  return globalForQueues.syncQueue;
}

/**
 * Enqueues a store sync. The jobId collapses webhook bursts: while a sync for
 * a store is pending, duplicates are ignored.
 */
export async function enqueueStoreSync(storeId: string): Promise<void> {
  await getSyncQueue().add(
    "sync-store",
    { storeId },
    { jobId: `sync-store:${storeId}` },
  );
}
