import { headers } from "next/headers";
import { getRedis } from "./redis";

// In-memory fallback used in tests / when Redis is unavailable.
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
}

/**
 * Fixed-window rate limiter. Returns ok=false once `max` calls have been made
 * for `key` within the window.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (process.env.NODE_ENV === "test" || process.env.RATE_LIMIT_MEMORY === "1") {
    return memoryLimit(key, max, windowSeconds);
  }
  try {
    const redis = getRedis();
    const redisKey = `rl:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, windowSeconds);
    return { ok: count <= max, remaining: Math.max(0, max - count) };
  } catch {
    // Fail open on Redis trouble rather than locking users out.
    return memoryLimit(key, max, windowSeconds);
  }
}

function memoryLimit(
  key: string,
  max: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true, remaining: max - 1 };
  }
  bucket.count += 1;
  return { ok: bucket.count <= max, remaining: Math.max(0, max - bucket.count) };
}

/** Client IP for rate-limit keys; trusts Caddy's X-Forwarded-For. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

/** Test hook. */
export function resetMemoryBuckets() {
  memoryBuckets.clear();
}
