import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetMemoryBuckets } from "@/lib/rate-limit";

describe("rateLimit (memory fallback in tests)", () => {
  beforeEach(() => resetMemoryBuckets());

  it("allows up to max calls in a window", async () => {
    for (let i = 0; i < 5; i++) {
      const result = await rateLimit("login:1.2.3.4", 5, 60);
      expect(result.ok).toBe(true);
    }
    const sixth = await rateLimit("login:1.2.3.4", 5, 60);
    expect(sixth.ok).toBe(false);
  });

  it("tracks keys independently", async () => {
    for (let i = 0; i < 5; i++) await rateLimit("login:a", 5, 60);
    expect((await rateLimit("login:a", 5, 60)).ok).toBe(false);
    expect((await rateLimit("login:b", 5, 60)).ok).toBe(true);
  });
});
