import { describe, expect, it } from "vitest";
import { evaluateLowStock } from "@/lib/services/automation-service";
import { isReportDue } from "@/lib/services/report-service";

describe("evaluateLowStock", () => {
  const base = { tracked: true, thresholdQty: null as number | null };

  it("alerts when stock crosses the threshold downward", () => {
    expect(
      evaluateLowStock({ ...base, oldQty: 10, newQty: 5 }, 5),
    ).toEqual({ alert: true, threshold: 5 });
    expect(
      evaluateLowStock({ ...base, oldQty: 6, newQty: 0 }, 5),
    ).toMatchObject({ alert: true });
  });

  it("alerts when an already-low product goes out of stock", () => {
    // Regression: 3 → 0 was silently missed while the ads guard still paused
    // the ad set. Going to zero from any positive level must alert.
    expect(
      evaluateLowStock({ ...base, oldQty: 3, newQty: 0 }, 5),
    ).toMatchObject({ alert: true });
    expect(
      evaluateLowStock({ ...base, oldQty: 1, newQty: 0 }, 5),
    ).toMatchObject({ alert: true });
  });

  it("does not alert while stock stays below the threshold (no re-spam)", () => {
    expect(
      evaluateLowStock({ ...base, oldQty: 4, newQty: 3 }, 5),
    ).toMatchObject({ alert: false });
  });

  it("does not alert on restock", () => {
    expect(
      evaluateLowStock({ ...base, oldQty: 2, newQty: 50 }, 5),
    ).toMatchObject({ alert: false });
  });

  it("ignores untracked products", () => {
    expect(
      evaluateLowStock({ ...base, tracked: false, oldQty: 10, newQty: 0 }, 5),
    ).toMatchObject({ alert: false });
  });

  it("never alerts for first-seen products", () => {
    expect(
      evaluateLowStock({ ...base, oldQty: null, newQty: 0 }, 5),
    ).toMatchObject({ alert: false });
  });

  it("prefers the per-product threshold over the rule default", () => {
    expect(
      evaluateLowStock({ ...base, thresholdQty: 20, oldQty: 25, newQty: 18 }, 5),
    ).toEqual({ alert: true, threshold: 20 });
    expect(
      evaluateLowStock({ ...base, thresholdQty: 2, oldQty: 10, newQty: 4 }, 5),
    ).toEqual({ alert: false, threshold: 2 });
  });
});

describe("isReportDue", () => {
  it("daily rules fire at the configured UTC hour", () => {
    const config = { frequency: "daily" as const, hour: 7, weekday: 1 };
    expect(isReportDue(config, new Date("2026-07-08T07:15:00Z"))).toBe(true);
    expect(isReportDue(config, new Date("2026-07-08T08:15:00Z"))).toBe(false);
  });

  it("weekly rules also require the weekday to match", () => {
    const config = { frequency: "weekly" as const, hour: 7, weekday: 1 };
    // 2026-07-06 is a Monday (getUTCDay() === 1)
    expect(isReportDue(config, new Date("2026-07-06T07:00:00Z"))).toBe(true);
    expect(isReportDue(config, new Date("2026-07-07T07:00:00Z"))).toBe(false);
  });
});
