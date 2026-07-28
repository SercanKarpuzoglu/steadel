import { describe, it, expect } from "vitest";
import { decideStage, DAY, type LifecycleStage } from "@/lib/services/lifecycle-decide";

const now = new Date("2026-07-28T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);
const inDays = (n: number) => new Date(now.getTime() + n * DAY);
const none = () => new Set<LifecycleStage>();

const base = {
  now,
  createdAt: daysAgo(1),
  plan: "trial" as const,
  trialEndsAt: inDays(13),
  subscriptionStatus: null,
  hasStore: false,
  hasAlert: false,
  sent: none(),
};

describe("decideStage (lifecycle emails)", () => {
  it("sends nothing in the first 2 days when nothing has happened", () => {
    expect(decideStage({ ...base, createdAt: daysAgo(1) })).toBeNull();
  });

  it("nudges to connect a store after 2 days with no store", () => {
    expect(decideStage({ ...base, createdAt: daysAgo(2) })).toBe("connect_store");
  });

  it("does not repeat the connect-store nudge once sent", () => {
    expect(
      decideStage({ ...base, createdAt: daysAgo(3), sent: new Set(["connect_store"]) }),
    ).toBeNull();
  });

  it("celebrates activation once an alert has fired (highest priority)", () => {
    expect(decideStage({ ...base, createdAt: daysAgo(5), hasStore: true, hasAlert: true })).toBe(
      "protected",
    );
  });

  it("warns when the trial ends within 3 days", () => {
    expect(decideStage({ ...base, createdAt: daysAgo(11), hasStore: true, trialEndsAt: inDays(2) })).toBe(
      "trial_ending",
    );
  });

  it("does not warn about trial end while there is plenty of time left", () => {
    expect(decideStage({ ...base, hasStore: true, trialEndsAt: inDays(10) })).toBeNull();
  });

  it("wins back a lapsed trial a couple of days after it expires", () => {
    expect(
      decideStage({ ...base, createdAt: daysAgo(17), hasStore: true, trialEndsAt: daysAgo(3) }),
    ).toBe("win_back");
  });

  it("does not email a paying customer with no new activation", () => {
    expect(
      decideStage({
        ...base,
        plan: "growth",
        trialEndsAt: null,
        subscriptionStatus: "active",
        hasStore: true,
      }),
    ).toBeNull();
  });

  it("falls through to trial_ending when protected was already sent", () => {
    expect(
      decideStage({
        ...base,
        createdAt: daysAgo(11),
        hasStore: true,
        hasAlert: true,
        trialEndsAt: inDays(1),
        sent: new Set(["protected"]),
      }),
    ).toBe("trial_ending");
  });
});
