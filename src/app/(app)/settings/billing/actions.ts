"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { requireOrg } from "@/lib/org";
import {
  cancelSubscription,
  changeSubscriptionPlan,
} from "@/lib/paddle";
import { billingEnabled, priceIdForPlan, type Plan } from "@/lib/plans";

export type FormState = { error?: string; message?: string } | undefined;

const SELECTABLE: Plan[] = ["starter", "growth", "agency"];

/** Dev-mode plan switch — only available while BILLING_ENABLED=false. */
export async function devSetPlanAction(formData: FormData): Promise<void> {
  if (billingEnabled()) return;
  const { org, user, role } = await requireOrg();
  if (role !== "owner") return;
  const plan = String(formData.get("plan")) as Plan;
  if (!SELECTABLE.includes(plan)) return;
  await db
    .update(organizations)
    .set({ plan, trialEndsAt: null, subscriptionStatus: "dev" })
    .where(eq(organizations.id, org.id));
  await recordAudit({
    orgId: org.id,
    actor: user.id,
    action: "billing.dev_plan_set",
    payload: { plan },
  });
  revalidatePath("/settings/billing");
}

export async function changePlanAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, user, role } = await requireOrg();
  if (role !== "owner") return { error: "Only the owner can change the plan." };
  if (!billingEnabled()) return { error: "Billing is disabled in this environment." };
  if (!org.paddleSubscriptionId) return { error: "No active subscription." };

  const plan = String(formData.get("plan")) as Plan;
  const priceId = priceIdForPlan(plan);
  if (!SELECTABLE.includes(plan) || !priceId) {
    return { error: "Unknown plan." };
  }

  try {
    await changeSubscriptionPlan(org.paddleSubscriptionId, priceId);
  } catch {
    return { error: "Paddle rejected the plan change. Try again shortly." };
  }
  await recordAudit({
    orgId: org.id,
    actor: user.id,
    action: "billing.plan_change_requested",
    payload: { plan },
  });
  revalidatePath("/settings/billing");
  return { message: "Plan change requested — it becomes active momentarily." };
}

export async function cancelSubscriptionAction(
  _prev: FormState,
  _formData: FormData,
): Promise<FormState> {
  const { org, user, role } = await requireOrg();
  if (role !== "owner") return { error: "Only the owner can cancel." };
  if (!billingEnabled()) return { error: "Billing is disabled in this environment." };
  if (!org.paddleSubscriptionId) return { error: "No active subscription." };

  try {
    await cancelSubscription(org.paddleSubscriptionId);
  } catch {
    return { error: "Paddle rejected the cancellation. Try again shortly." };
  }
  await recordAudit({
    orgId: org.id,
    actor: user.id,
    action: "billing.cancel_requested",
  });
  revalidatePath("/settings/billing");
  return {
    message:
      "Cancellation scheduled for the end of the billing period. You keep access until then.",
  };
}
