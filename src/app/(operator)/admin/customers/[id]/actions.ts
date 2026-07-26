"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  alertsLog,
  automationRules,
  eventsAudit,
  organizations,
  orgMembers,
  stores,
  users,
} from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/org";
import { cancelSubscription, changeSubscriptionPlan } from "@/lib/paddle";
import { billingEnabled, priceIdForPlan, type Plan } from "@/lib/plans";
import {
  requestPasswordReset,
  resendVerification as resendVerificationEmail,
} from "@/lib/services/auth-service";

export type ActionResult = { ok: boolean; message: string };
export type ExportResult = ActionResult & { filename?: string; json?: string };

const PAID: Plan[] = ["starter", "growth", "agency"];

async function loadOrg(orgId: string) {
  return db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
}

function revalidate(orgId: string) {
  revalidatePath(`/admin/customers/${orgId}`);
  revalidatePath("/admin/customers");
}

/** Change the plan — via Paddle when a live subscription exists, else a direct comp. */
export async function changePlan(orgId: string, plan: Plan): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (![...PAID, "trial"].includes(plan)) return { ok: false, message: "Unknown plan." };
  const org = await loadOrg(orgId);
  if (!org) return { ok: false, message: "Customer not found." };

  const viaPaddle = Boolean(org.paddleSubscriptionId) && billingEnabled() && plan !== "trial";
  if (viaPaddle) {
    const priceId = priceIdForPlan(plan);
    if (!priceId) return { ok: false, message: "No Paddle price configured for that plan." };
    try {
      await changeSubscriptionPlan(org.paddleSubscriptionId as string, priceId);
    } catch {
      return { ok: false, message: "Paddle rejected the change — try again shortly." };
    }
    await db.update(organizations).set({ plan }).where(eq(organizations.id, orgId));
  } else {
    // Direct comp / dev change — no Paddle involved.
    await db
      .update(organizations)
      .set({
        plan,
        subscriptionStatus: plan === "trial" ? null : "comp",
        trialEndsAt:
          plan === "trial" ? new Date(Date.now() + 14 * 86_400_000) : null,
      })
      .where(eq(organizations.id, orgId));
  }

  await recordAudit({
    orgId,
    actor: admin.id,
    action: "admin.plan_changed",
    payload: { plan, via: viaPaddle ? "paddle" : "comp" },
  });
  revalidate(orgId);
  return {
    ok: true,
    message: viaPaddle
      ? `Plan change to ${plan} requested via Paddle.`
      : `Plan set to ${plan} (comp).`,
  };
}

export async function extendTrial(orgId: string, days: number): Promise<ActionResult> {
  const admin = await requireAdmin();
  const n = Math.max(1, Math.min(90, Math.round(days)));
  const org = await loadOrg(orgId);
  if (!org) return { ok: false, message: "Customer not found." };
  if (org.plan !== "trial") {
    return { ok: false, message: "Only trial accounts can have their trial extended." };
  }
  const base = Math.max(Date.now(), org.trialEndsAt?.getTime() ?? Date.now());
  const trialEndsAt = new Date(base + n * 86_400_000);
  await db.update(organizations).set({ trialEndsAt }).where(eq(organizations.id, orgId));
  await recordAudit({
    orgId,
    actor: admin.id,
    action: "admin.trial_extended",
    payload: { days: n, trialEndsAt: trialEndsAt.toISOString() },
  });
  revalidate(orgId);
  return { ok: true, message: `Trial extended by ${n} days.` };
}

export async function resendVerification(orgId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const org = await loadOrg(orgId);
  if (!org) return { ok: false, message: "Customer not found." };
  const owner = await db.query.users.findFirst({ where: eq(users.id, org.ownerUserId) });
  if (!owner) return { ok: false, message: "Owner account not found." };
  if (owner.emailVerifiedAt) return { ok: false, message: "This email is already verified." };
  await resendVerificationEmail(owner.email);
  await recordAudit({ orgId, actor: admin.id, action: "admin.verification_resent" });
  return { ok: true, message: `Verification email re-sent to ${owner.email}.` };
}

export async function sendPasswordReset(orgId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const org = await loadOrg(orgId);
  if (!org) return { ok: false, message: "Customer not found." };
  const owner = await db.query.users.findFirst({ where: eq(users.id, org.ownerUserId) });
  if (!owner) return { ok: false, message: "Owner account not found." };
  await requestPasswordReset(owner.email);
  await recordAudit({ orgId, actor: admin.id, action: "admin.password_reset_sent" });
  return { ok: true, message: `Password-reset link sent to ${owner.email}.` };
}

export async function setSuspended(orgId: string, suspended: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  const org = await loadOrg(orgId);
  if (!org) return { ok: false, message: "Customer not found." };
  await db
    .update(organizations)
    .set({ suspendedAt: suspended ? new Date() : null })
    .where(eq(organizations.id, orgId));
  await recordAudit({
    orgId,
    actor: admin.id,
    action: suspended ? "admin.account_suspended" : "admin.account_reactivated",
  });
  revalidate(orgId);
  return {
    ok: true,
    message: suspended
      ? "Account suspended — automations halted, data preserved."
      : "Account reactivated.",
  };
}

/** GDPR data export — returns a JSON blob for the operator to download. */
export async function exportData(orgId: string): Promise<ExportResult> {
  const admin = await requireAdmin();
  const org = await loadOrg(orgId);
  if (!org) return { ok: false, message: "Customer not found." };

  const [owner, members, orgStores, rules, alerts, audit] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, org.ownerUserId) }),
    db
      .select({ email: users.email, role: orgMembers.role, name: users.name })
      .from(orgMembers)
      .innerJoin(users, eq(orgMembers.userId, users.id))
      .where(eq(orgMembers.orgId, orgId)),
    db.query.stores.findMany({ where: eq(stores.orgId, orgId) }),
    db
      .select({ id: automationRules.id, type: automationRules.type, enabled: automationRules.enabled, config: automationRules.config })
      .from(automationRules)
      .innerJoin(stores, eq(automationRules.storeId, stores.id))
      .where(eq(stores.orgId, orgId)),
    db.query.alertsLog.findMany({ where: eq(alertsLog.orgId, orgId), limit: 500 }),
    db.query.eventsAudit.findMany({ where: eq(eventsAudit.orgId, orgId), limit: 500 }),
  ]);

  const bundle = {
    exportedAt: new Date().toISOString(),
    exportedBy: admin.email,
    organization: {
      id: org.id,
      name: org.name,
      plan: org.plan,
      subscriptionStatus: org.subscriptionStatus,
      trialEndsAt: org.trialEndsAt,
      createdAt: org.createdAt,
    },
    owner: owner ? { email: owner.email, name: owner.name, emailVerifiedAt: owner.emailVerifiedAt } : null,
    members,
    stores: orgStores.map((s) => ({ name: s.name, platform: s.platform, domain: s.domain, status: s.status })),
    automations: rules,
    alerts,
    auditTrail: audit,
  };

  await recordAudit({ orgId, actor: admin.id, action: "admin.data_exported", payload: { records: alerts.length + audit.length } });

  const slug = org.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "customer";
  return {
    ok: true,
    message: "Export ready — the download should begin automatically.",
    filename: `steadel-export-${slug}.json`,
    json: JSON.stringify(bundle, null, 2),
  };
}

/** GDPR erasure — irreversible. Requires the operator to type the org name. */
export async function eraseAccount(orgId: string, confirmName: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const org = await loadOrg(orgId);
  if (!org) return { ok: false, message: "Customer not found." };
  if (confirmName.trim() !== org.name.trim()) {
    return { ok: false, message: "The name you typed does not match — nothing was erased." };
  }

  // Cancel any live subscription first (best effort).
  if (org.paddleSubscriptionId && billingEnabled()) {
    try {
      await cancelSubscription(org.paddleSubscriptionId);
    } catch {
      /* proceed with erasure regardless — billing is Paddle's source of truth */
    }
  }

  // Record to the GLOBAL audit log (orgId null) so the entry survives the cascade delete.
  await recordAudit({
    orgId: null,
    actor: admin.id,
    action: "admin.account_erased",
    payload: { orgId, orgName: org.name },
  });

  const ownerId = org.ownerUserId;
  // Deleting the org cascades stores, products, automations, alerts, api keys,
  // memberships and org-scoped audit rows (all FKs are onDelete: cascade).
  await db.delete(organizations).where(eq(organizations.id, orgId));

  // Remove the owner account only if it doesn't own any other organization.
  const [other] = await db
    .select({ v: count() })
    .from(organizations)
    .where(and(eq(organizations.ownerUserId, ownerId), ne(organizations.id, orgId)));
  if (Number(other?.v ?? 0) === 0) {
    await db.delete(users).where(eq(users.id, ownerId));
  }

  revalidatePath("/admin/customers");
  return { ok: true, message: `${org.name} has been erased.` };
}
