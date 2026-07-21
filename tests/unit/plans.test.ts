import { describe, expect, it } from "vitest";
import {
  automationLimitReached,
  automationsAllowed,
  canCreateResources,
  isTrialExpired,
  PLAN_LIMITS,
  storeLimitReached,
} from "@/lib/plans";

describe("plan limits (SPEC §1 pricing)", () => {
  it("encodes the published plan limits", () => {
    expect(PLAN_LIMITS.starter).toMatchObject({ priceEur: 29, stores: 1, automations: 3 });
    expect(PLAN_LIMITS.growth).toMatchObject({ priceEur: 59, stores: 3, automations: null });
    expect(PLAN_LIMITS.agency).toMatchObject({ priceEur: 119, stores: 10, automations: null, whiteLabel: true });
  });

  it("store limits", () => {
    expect(storeLimitReached("starter", 0)).toBe(false);
    expect(storeLimitReached("starter", 1)).toBe(true);
    expect(storeLimitReached("growth", 2)).toBe(false);
    expect(storeLimitReached("growth", 3)).toBe(true);
    expect(storeLimitReached("agency", 9)).toBe(false);
    expect(storeLimitReached("agency", 10)).toBe(true);
  });

  it("automation limits — unlimited plans never cap", () => {
    expect(automationLimitReached("starter", 2)).toBe(false);
    expect(automationLimitReached("starter", 3)).toBe(true);
    expect(automationLimitReached("growth", 10_000)).toBe(false);
    expect(automationLimitReached("agency", 10_000)).toBe(false);
  });
});

describe("trial & subscription state", () => {
  const now = new Date("2026-07-08T12:00:00Z");

  it("trial expiry", () => {
    expect(
      isTrialExpired({ plan: "trial", trialEndsAt: new Date("2026-07-10") }, now),
    ).toBe(false);
    expect(
      isTrialExpired({ plan: "trial", trialEndsAt: new Date("2026-07-01") }, now),
    ).toBe(true);
    expect(
      isTrialExpired({ plan: "starter", trialEndsAt: new Date("2026-07-01") }, now),
    ).toBe(false);
  });

  it("write access follows trial/subscription state", () => {
    expect(
      canCreateResources(
        { plan: "trial", trialEndsAt: new Date("2026-07-10"), subscriptionStatus: null },
        now,
      ),
    ).toBe(true);
    expect(
      canCreateResources(
        { plan: "trial", trialEndsAt: new Date("2026-07-01"), subscriptionStatus: null },
        now,
      ),
    ).toBe(false);
    expect(
      canCreateResources(
        { plan: "growth", trialEndsAt: null, subscriptionStatus: "active" },
        now,
      ),
    ).toBe(true);
    expect(
      canCreateResources(
        { plan: "growth", trialEndsAt: null, subscriptionStatus: "canceled" },
        now,
      ),
    ).toBe(false);
  });
});

describe("automationsAllowed (terms §4 — service suspended when unpaid)", () => {
  const now = new Date("2026-07-21");

  it("runs automations during a live trial and on an active subscription", () => {
    expect(
      automationsAllowed(
        { plan: "trial", trialEndsAt: new Date("2026-08-04"), subscriptionStatus: null },
        now,
      ),
    ).toBe(true);
    expect(
      automationsAllowed(
        { plan: "starter", trialEndsAt: null, subscriptionStatus: "active" },
        now,
      ),
    ).toBe(true);
  });

  it("suspends automations once the trial expires without payment", () => {
    expect(
      automationsAllowed(
        { plan: "trial", trialEndsAt: new Date("2026-07-01"), subscriptionStatus: null },
        now,
      ),
    ).toBe(false);
  });

  it("suspends automations after a subscription is canceled", () => {
    // Scheduled cancellation keeps access until the period ends (still active)…
    expect(
      automationsAllowed(
        { plan: "starter", trialEndsAt: null, subscriptionStatus: "active" },
        now,
      ),
    ).toBe(true);
    // …and stops once Paddle reports the subscription as canceled.
    expect(
      automationsAllowed(
        { plan: "starter", trialEndsAt: null, subscriptionStatus: "canceled" },
        now,
      ),
    ).toBe(false);
  });
});
