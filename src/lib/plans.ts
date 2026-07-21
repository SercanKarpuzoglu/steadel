import { count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { automationRules, organizations, stores } from "@/db/schema";

export type Plan = "trial" | "starter" | "growth" | "agency";

export interface PlanLimits {
  label: string;
  priceEur: number;
  stores: number;
  /** null = unlimited */
  automations: number | null;
  whiteLabel: boolean;
}

/** SPEC §1 pricing: Starter €29 (1 store, 3 automations), Growth €59 (3 stores, unlimited), Agency €119 (10 stores, white-label). */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  trial: { label: "Trial", priceEur: 0, stores: 1, automations: 3, whiteLabel: false },
  starter: { label: "Starter", priceEur: 29, stores: 1, automations: 3, whiteLabel: false },
  growth: { label: "Growth", priceEur: 59, stores: 3, automations: null, whiteLabel: false },
  agency: { label: "Agency", priceEur: 119, stores: 10, automations: null, whiteLabel: true },
};

export type Org = typeof organizations.$inferSelect;

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export function isTrialExpired(
  org: Pick<Org, "plan" | "trialEndsAt">,
  now: Date = new Date(),
): boolean {
  return (
    org.plan === "trial" && !!org.trialEndsAt && org.trialEndsAt.getTime() < now.getTime()
  );
}

/**
 * Whether the org may create new resources. Read access is never blocked.
 * Paid plans lose write access when the subscription is canceled.
 */
export function canCreateResources(
  org: Pick<Org, "plan" | "trialEndsAt" | "subscriptionStatus">,
  now: Date = new Date(),
): boolean {
  if (org.plan === "trial") return !isTrialExpired(org, now);
  return org.subscriptionStatus !== "canceled";
}

/**
 * Whether the org's automations may run. Terms §4: when a trial ends without
 * payment or a subscription is canceled, the service is suspended and
 * automations stop running — reads (dashboard, export) are never blocked.
 * Same entitlement rule as resource creation, named separately so the two
 * can diverge later.
 */
export function automationsAllowed(
  org: Pick<Org, "plan" | "trialEndsAt" | "subscriptionStatus">,
  now: Date = new Date(),
): boolean {
  return canCreateResources(org, now);
}

/** Entitlement for a store's org — the worker's gate before running anything. */
export async function storeAutomationsAllowed(
  storeId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ org: organizations })
    .from(stores)
    .innerJoin(organizations, eq(stores.orgId, organizations.id))
    .where(eq(stores.id, storeId))
    .limit(1);
  return row ? automationsAllowed(row.org) : false;
}

export function storeLimitReached(plan: Plan, currentStores: number): boolean {
  return currentStores >= PLAN_LIMITS[plan].stores;
}

export function automationLimitReached(
  plan: Plan,
  currentRules: number,
): boolean {
  const limit = PLAN_LIMITS[plan].automations;
  return limit !== null && currentRules >= limit;
}

async function orgUsage(orgId: string) {
  const [storeRow] = await db
    .select({ value: count() })
    .from(stores)
    .where(eq(stores.orgId, orgId));
  const orgStoreIds = (
    await db.query.stores.findMany({
      where: eq(stores.orgId, orgId),
      columns: { id: true },
    })
  ).map((s) => s.id);
  const [ruleRow] = orgStoreIds.length
    ? await db
        .select({ value: count() })
        .from(automationRules)
        .where(inArray(automationRules.storeId, orgStoreIds))
    : [{ value: 0 }];
  return { stores: storeRow.value, automations: ruleRow.value };
}

export async function getOrgUsage(orgId: string) {
  return orgUsage(orgId);
}

/** Throws PlanLimitError when the org cannot add another store. */
export async function assertCanAddStore(org: Org): Promise<void> {
  if (!canCreateResources(org)) {
    throw new PlanLimitError(
      org.plan === "trial"
        ? "Your trial has ended — pick a plan to keep automating."
        : "Your subscription is canceled — reactivate to add stores.",
    );
  }
  const usage = await orgUsage(org.id);
  if (storeLimitReached(org.plan, usage.stores)) {
    throw new PlanLimitError(
      `The ${PLAN_LIMITS[org.plan].label} plan includes ${PLAN_LIMITS[org.plan].stores} store(s). Upgrade to connect more.`,
    );
  }
}

/** Throws PlanLimitError when the org cannot add another automation rule. */
export async function assertCanAddAutomation(org: Org): Promise<void> {
  if (!canCreateResources(org)) {
    throw new PlanLimitError(
      org.plan === "trial"
        ? "Your trial has ended — pick a plan to keep automating."
        : "Your subscription is canceled — reactivate to add automations.",
    );
  }
  const usage = await orgUsage(org.id);
  if (automationLimitReached(org.plan, usage.automations)) {
    throw new PlanLimitError(
      `The ${PLAN_LIMITS[org.plan].label} plan includes ${PLAN_LIMITS[org.plan].automations} automations. Upgrade for unlimited.`,
    );
  }
}

export function billingEnabled(): boolean {
  return (
    process.env.BILLING_ENABLED === "true" || process.env.BILLING_ENABLED === "1"
  );
}

export function planForPriceId(priceId: string): Plan | null {
  if (priceId && priceId === process.env.PADDLE_PRICE_STARTER) return "starter";
  if (priceId && priceId === process.env.PADDLE_PRICE_GROWTH) return "growth";
  if (priceId && priceId === process.env.PADDLE_PRICE_AGENCY) return "agency";
  return null;
}

export function priceIdForPlan(plan: Plan): string | null {
  switch (plan) {
    case "starter":
      return process.env.PADDLE_PRICE_STARTER ?? null;
    case "growth":
      return process.env.PADDLE_PRICE_GROWTH ?? null;
    case "agency":
      return process.env.PADDLE_PRICE_AGENCY ?? null;
    default:
      return null;
  }
}
