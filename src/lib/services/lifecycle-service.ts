import { eq } from "drizzle-orm";
import { db } from "@/db";
import { alertsLog, eventsAudit, organizations, stores, users } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { sendMail } from "@/lib/mail";
import type { Plan } from "@/lib/plans";
import { DAY, decideStage, type LifecycleStage, type TickStage } from "./lifecycle-decide";
import {
  connectStoreHtml,
  protectedHtml,
  trialEndingHtml,
  welcomeHtml,
  winBackHtml,
} from "@/emails/lifecycle-emails";

/** Local copy of the admin check (avoids pulling next-auth into the worker). */
function isOperatorEmail(email: string): boolean {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

async function renderStage(
  stage: TickStage,
  name: string | null,
  trialDaysLeft: number,
): Promise<{ subject: string; html: string }> {
  switch (stage) {
    case "connect_store":
      return { subject: "Connect your store to start getting alerts", html: await connectStoreHtml(name) };
    case "protected":
      return { subject: "You're covered — Steadel is watching your stock", html: await protectedHtml(name) };
    case "trial_ending":
      return { subject: "Your Steadel trial ends soon", html: await trialEndingHtml(name, trialDaysLeft) };
    case "win_back":
      return { subject: "Your Steadel trial has ended", html: await winBackHtml(name) };
  }
}

/** Sent immediately on signup. */
export async function sendWelcome(user: { email: string; name: string | null }, orgId: string): Promise<void> {
  await sendMail({ to: user.email, subject: "Welcome to Steadel", html: await welcomeHtml(user.name) });
  await recordAudit({ orgId, actor: "system", action: "email.lifecycle", payload: { stage: "welcome" } });
}

/** Daily: send each org the one lifecycle email it's due (idempotent via audit). */
export async function runLifecycleTick(now: Date = new Date()): Promise<number> {
  const rows = await db
    .select({
      org: organizations,
      ownerEmail: users.email,
      ownerName: users.name,
      ownerDeletedAt: users.deletedAt,
      ownerVerifiedAt: users.emailVerifiedAt,
    })
    .from(organizations)
    .innerJoin(users, eq(organizations.ownerUserId, users.id));

  const [storeRows, alertRows, sentRows] = await Promise.all([
    db.selectDistinct({ orgId: stores.orgId }).from(stores),
    db.selectDistinct({ orgId: alertsLog.orgId }).from(alertsLog),
    db
      .select({ orgId: eventsAudit.orgId, payload: eventsAudit.payload })
      .from(eventsAudit)
      .where(eq(eventsAudit.action, "email.lifecycle")),
  ]);

  const storeOrgIds = new Set(storeRows.map((r) => r.orgId));
  const alertOrgIds = new Set(alertRows.map((r) => r.orgId));
  const sentByOrg = new Map<string, Set<LifecycleStage>>();
  for (const r of sentRows) {
    if (!r.orgId) continue;
    const stage = (r.payload as { stage?: LifecycleStage })?.stage;
    if (!stage) continue;
    if (!sentByOrg.has(r.orgId)) sentByOrg.set(r.orgId, new Set());
    sentByOrg.get(r.orgId)!.add(stage);
  }

  let sent = 0;
  for (const { org, ownerEmail, ownerName, ownerDeletedAt, ownerVerifiedAt } of rows) {
    if (ownerDeletedAt || org.suspendedAt) continue;
    if (!ownerVerifiedAt) continue; // unverified accounts can't act yet — skip
    if (isOperatorEmail(ownerEmail)) continue; // never lifecycle-email operators

    const stage = decideStage({
      now,
      createdAt: org.createdAt,
      plan: org.plan as Plan,
      trialEndsAt: org.trialEndsAt,
      subscriptionStatus: org.subscriptionStatus,
      hasStore: storeOrgIds.has(org.id),
      hasAlert: alertOrgIds.has(org.id),
      sent: sentByOrg.get(org.id) ?? new Set(),
    });
    if (!stage) continue;

    const trialDaysLeft = org.trialEndsAt
      ? Math.max(1, Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / DAY))
      : 1;
    try {
      const { subject, html } = await renderStage(stage, ownerName, trialDaysLeft);
      await sendMail({ to: ownerEmail, subject, html });
      await recordAudit({ orgId: org.id, actor: "system", action: "email.lifecycle", payload: { stage } });
      sent += 1;
    } catch (err) {
      logger.error({ orgId: org.id, stage, err: String(err) }, "lifecycle email failed");
    }
  }
  logger.info({ sent }, "lifecycle tick complete");
  return sent;
}
