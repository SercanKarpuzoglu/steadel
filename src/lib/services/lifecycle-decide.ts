import type { Plan } from "@/lib/plans";

export type LifecycleStage =
  | "welcome"
  | "connect_store"
  | "protected"
  | "trial_ending"
  | "win_back";

export type TickStage = Exclude<LifecycleStage, "welcome">;

export const DAY = 86_400_000;

/**
 * Decide the single lifecycle email (if any) an org should receive now.
 * Pure and dependency-free so it is unit-testable. At most one stage per run;
 * each stage is sent at most once ever (tracked via `sent`).
 */
export function decideStage(input: {
  now: Date;
  createdAt: Date;
  plan: Plan;
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
  hasStore: boolean;
  hasAlert: boolean;
  sent: Set<LifecycleStage>;
}): TickStage | null {
  const { now, createdAt, plan, trialEndsAt, subscriptionStatus, hasStore, hasAlert, sent } = input;
  const ageDays = (now.getTime() - createdAt.getTime()) / DAY;
  const isTrial = plan === "trial";
  const paying = plan !== "trial" && subscriptionStatus !== "canceled";
  const trialExpired = isTrial && !!trialEndsAt && trialEndsAt.getTime() < now.getTime();
  const trialDaysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY)
    : null;
  const daysSinceExpiry = trialEndsAt ? (now.getTime() - trialEndsAt.getTime()) / DAY : -Infinity;

  // Activation win — celebrate the first alert regardless of plan.
  if (hasAlert && !sent.has("protected")) return "protected";
  // Trial about to end (still active) — nudge to a plan.
  if (
    isTrial &&
    !trialExpired &&
    trialDaysLeft !== null &&
    trialDaysLeft >= 0 &&
    trialDaysLeft <= 3 &&
    !sent.has("trial_ending")
  )
    return "trial_ending";
  // Trial lapsed without paying — win back a couple of days later.
  if (trialExpired && !paying && daysSinceExpiry >= 2 && !sent.has("win_back")) return "win_back";
  // Signed up but never connected a store.
  if (isTrial && !trialExpired && !hasStore && ageDays >= 2 && !sent.has("connect_store"))
    return "connect_store";
  return null;
}
