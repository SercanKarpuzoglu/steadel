import { describe, expect, it } from "vitest";
import { decideAdsAction } from "@/lib/services/ads-guard-service";

describe("decideAdsAction state machine (SPEC §5.3 safety rules)", () => {
  const zero = { mode: "pause_on_zero" as const, thresholdQty: null };

  it("pauses an active ad set when stock hits zero", () => {
    expect(
      decideAdsAction({ qty: 0, ...zero, linkState: "active", providerStatus: "ACTIVE" }),
    ).toBe("pause");
    expect(
      decideAdsAction({ qty: 0, ...zero, linkState: "unknown", providerStatus: "ACTIVE" }),
    ).toBe("pause");
  });

  it("does nothing when we already paused it", () => {
    expect(
      decideAdsAction({
        qty: 0,
        ...zero,
        linkState: "paused_by_steadel",
        providerStatus: "PAUSED",
      }),
    ).toBe("none");
  });

  it("marks human-paused ad sets unknown instead of claiming them", () => {
    expect(
      decideAdsAction({ qty: 0, ...zero, linkState: "active", providerStatus: "PAUSED" }),
    ).toBe("mark_unknown");
    expect(
      decideAdsAction({ qty: 0, ...zero, linkState: "unknown", providerStatus: "PAUSED" }),
    ).toBe("mark_unknown");
  });

  it("does nothing when the provider is unreachable", () => {
    expect(
      decideAdsAction({ qty: 0, ...zero, linkState: "active", providerStatus: null }),
    ).toBe("none");
  });

  it("resumes on restock only when Steadel paused it", () => {
    expect(
      decideAdsAction({
        qty: 12,
        ...zero,
        linkState: "paused_by_steadel",
        providerStatus: "PAUSED",
      }),
    ).toBe("resume");
    // human-paused: NEVER resume
    expect(
      decideAdsAction({ qty: 12, ...zero, linkState: "unknown", providerStatus: "PAUSED" }),
    ).toBe("none");
    expect(
      decideAdsAction({ qty: 12, ...zero, linkState: "active", providerStatus: "PAUSED" }),
    ).toBe("none");
  });

  it("records observed-active ad sets without acting", () => {
    expect(
      decideAdsAction({ qty: 12, ...zero, linkState: "unknown", providerStatus: "ACTIVE" }),
    ).toBe("mark_active");
    expect(
      decideAdsAction({ qty: 12, ...zero, linkState: "active", providerStatus: "ACTIVE" }),
    ).toBe("none");
  });

  it("honours pause_below_threshold mode", () => {
    const belowFive = {
      mode: "pause_below_threshold" as const,
      thresholdQty: 5,
    };
    expect(
      decideAdsAction({
        qty: 4,
        ...belowFive,
        linkState: "active",
        providerStatus: "ACTIVE",
      }),
    ).toBe("pause");
    expect(
      decideAdsAction({
        qty: 6,
        ...belowFive,
        linkState: "paused_by_steadel",
        providerStatus: "PAUSED",
      }),
    ).toBe("resume");
    // threshold missing → falls back to zero behaviour
    expect(
      decideAdsAction({
        qty: 3,
        mode: "pause_below_threshold",
        thresholdQty: null,
        linkState: "active",
        providerStatus: "ACTIVE",
      }),
    ).toBe("none");
  });
});
