import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyPaddleSignature } from "@/lib/paddle";

const SECRET = "pdl_ntfset_test_secret";

function sign(body: string, ts: number): string {
  const h1 = createHmac("sha256", SECRET).update(`${ts}:${body}`).digest("hex");
  return `ts=${ts};h1=${h1}`;
}

describe("verifyPaddleSignature", () => {
  const now = new Date("2026-07-08T12:00:00Z");
  const ts = Math.floor(now.getTime() / 1000);
  const body = JSON.stringify({ event_id: "evt_1", event_type: "subscription.created" });

  it("accepts a valid signature", () => {
    expect(verifyPaddleSignature(body, sign(body, ts), SECRET, 300, now)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(
      verifyPaddleSignature(body + "x", sign(body, ts), SECRET, 300, now),
    ).toBe(false);
  });

  it("rejects the wrong secret", () => {
    expect(
      verifyPaddleSignature(body, sign(body, ts), "other-secret", 300, now),
    ).toBe(false);
  });

  it("rejects stale timestamps (replay protection)", () => {
    const oldTs = ts - 3600;
    expect(
      verifyPaddleSignature(body, sign(body, oldTs), SECRET, 300, now),
    ).toBe(false);
  });

  it("rejects malformed headers", () => {
    expect(verifyPaddleSignature(body, null, SECRET, 300, now)).toBe(false);
    expect(verifyPaddleSignature(body, "garbage", SECRET, 300, now)).toBe(false);
    expect(verifyPaddleSignature(body, "ts=;h1=", SECRET, 300, now)).toBe(false);
  });
});
