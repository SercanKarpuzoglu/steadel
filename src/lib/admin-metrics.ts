import "server-only";
import { and, count, desc, eq, gte, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  alertsLog,
  eventsAudit,
  organizations,
  stores,
  users,
} from "@/db/schema";
import { getSyncQueue } from "@/jobs/queues";
import { isAdminEmail } from "@/lib/org";
import { PLAN_LIMITS, type Plan } from "@/lib/plans";

export type CustomerStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "suspended";

type OrgLike = {
  plan: Plan;
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
  suspendedAt?: Date | null;
};

type BillingStatus = "active" | "trialing" | "past_due" | "canceled";

/** Billing state from plan + Paddle subscription, ignoring operator suspension. */
function billingStatus(org: OrgLike, now: Date = new Date()): BillingStatus {
  if (org.plan === "trial") {
    if (org.trialEndsAt && org.trialEndsAt.getTime() < now.getTime()) return "canceled";
    return "trialing";
  }
  switch (org.subscriptionStatus) {
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "trialing":
      return "trialing";
    default:
      return "active"; // active / dev / comp / null with a paid plan
  }
}

/** User-facing account status. Operator suspension overrides billing state. */
export function statusOf(org: OrgLike, now: Date = new Date()): CustomerStatus {
  if (org.suspendedAt) return "suspended";
  return billingStatus(org, now);
}

/** Monthly recurring revenue this org contributes right now (EUR). */
export function mrrOf(org: OrgLike): number {
  const status = billingStatus(org);
  if (status === "canceled" || status === "trialing") return 0;
  return PLAN_LIMITS[org.plan].priceEur;
}

// ---------------------------------------------------------------------------
// Revenue + plan mix
// ---------------------------------------------------------------------------

export type RevenueSnapshot = {
  mrr: number;
  activeSubs: number;
  trialing: number;
  pastDue: number;
  canceled: number;
  planMix: { starter: number; growth: number; agency: number };
  /** MRR of orgs whose next charge could fail (past_due). */
  atRisk: number;
};

export async function revenueSnapshot(): Promise<RevenueSnapshot> {
  const orgs = await db
    .select({
      plan: organizations.plan,
      trialEndsAt: organizations.trialEndsAt,
      subscriptionStatus: organizations.subscriptionStatus,
      suspendedAt: organizations.suspendedAt,
    })
    .from(organizations);

  const snap: RevenueSnapshot = {
    mrr: 0,
    activeSubs: 0,
    trialing: 0,
    pastDue: 0,
    canceled: 0,
    planMix: { starter: 0, growth: 0, agency: 0 },
    atRisk: 0,
  };

  for (const org of orgs) {
    const status = statusOf(org);
    snap.mrr += mrrOf(org);
    if (status === "active") snap.activeSubs += 1;
    else if (status === "trialing") snap.trialing += 1;
    else if (status === "past_due") {
      snap.pastDue += 1;
      snap.atRisk += mrrOf(org);
    } else snap.canceled += 1;

    if ((status === "active" || status === "past_due") && org.plan !== "trial") {
      snap.planMix[org.plan as "starter" | "growth" | "agency"] += 1;
    }
  }
  return snap;
}

// ---------------------------------------------------------------------------
// Signups per month (last 12) + activation funnel
// ---------------------------------------------------------------------------

export type MonthPoint = { month: string; signups: number; converted: number };

export async function signupSeries(): Promise<MonthPoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${organizations.createdAt}), 'YYYY-MM')`,
      signups: count(),
      converted: sql<number>`count(*) filter (where ${organizations.plan} <> 'trial')::int`,
    })
    .from(organizations)
    .where(gte(organizations.createdAt, start))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return rows.map((r) => ({
    month: r.month,
    signups: Number(r.signups),
    converted: Number(r.converted),
  }));
}

export type Funnel = {
  signups: number;
  withStore: number;
  withAlert: number;
  paid: number;
};

export async function activationFunnel(): Promise<Funnel> {
  const [[total], [withStore], [withAlert], [paid]] = await Promise.all([
    db.select({ v: count() }).from(organizations),
    db
      .select({ v: sql<number>`count(distinct ${stores.orgId})::int` })
      .from(stores),
    db
      .select({ v: sql<number>`count(distinct ${alertsLog.orgId})::int` })
      .from(alertsLog),
    db
      .select({ v: count() })
      .from(organizations)
      .where(
        and(
          sql`${organizations.plan} <> 'trial'`,
          sql`coalesce(${organizations.subscriptionStatus}, '') <> 'canceled'`,
        ),
      ),
  ]);
  return {
    signups: Number(total?.v ?? 0),
    withStore: Number(withStore?.v ?? 0),
    withAlert: Number(withAlert?.v ?? 0),
    paid: Number(paid?.v ?? 0),
  };
}

/** Signups created within [start, end). Used for month-over-month KPI trend. */
export async function signupsBetween(start: Date, end: Date): Promise<number> {
  const [row] = await db
    .select({ v: count() })
    .from(organizations)
    .where(
      and(
        gte(organizations.createdAt, start),
        sql`${organizations.createdAt} < ${end}`,
      ),
    );
  return Number(row?.v ?? 0);
}

// ---------------------------------------------------------------------------
// Customer list
// ---------------------------------------------------------------------------

export type CustomerRow = {
  id: string;
  name: string;
  ownerEmail: string;
  plan: Plan;
  status: CustomerStatus;
  storeCount: number;
  mrr: number;
  alerts30d: number;
  createdAt: Date;
  trialEndsAt: Date | null;
  lastActiveAt: Date | null;
};

const STATUS_RANK: Record<CustomerStatus, number> = {
  past_due: 0,
  suspended: 1,
  active: 2,
  trialing: 3,
  canceled: 4,
};

export async function customerList(opts?: {
  q?: string;
  status?: CustomerStatus | "all";
}): Promise<CustomerRow[]> {
  const base = await db
    .select({
      org: organizations,
      ownerEmail: users.email,
      storeCount: count(stores.id),
    })
    .from(organizations)
    .innerJoin(users, eq(organizations.ownerUserId, users.id))
    .leftJoin(stores, eq(stores.orgId, organizations.id))
    .groupBy(organizations.id, users.email)
    .orderBy(desc(organizations.createdAt));

  const since = new Date(Date.now() - 30 * 86_400_000);
  const [alertRows, auditRows, syncRows] = await Promise.all([
    db
      .select({ orgId: alertsLog.orgId, c: count() })
      .from(alertsLog)
      .where(gte(alertsLog.createdAt, since))
      .groupBy(alertsLog.orgId),
    db
      .select({
        orgId: eventsAudit.orgId,
        last: sql<string>`max(${eventsAudit.createdAt})`,
      })
      .from(eventsAudit)
      .groupBy(eventsAudit.orgId),
    db
      .select({
        orgId: stores.orgId,
        last: sql<string>`max(${stores.lastSyncAt})`,
      })
      .from(stores)
      .groupBy(stores.orgId),
  ]);

  const alerts = new Map(alertRows.map((r) => [r.orgId, Number(r.c)]));
  const lastActive = new Map<string, number>();
  for (const r of [...auditRows, ...syncRows]) {
    if (!r.orgId || !r.last) continue;
    const t = new Date(r.last).getTime();
    if (!lastActive.has(r.orgId) || t > (lastActive.get(r.orgId) as number)) {
      lastActive.set(r.orgId, t);
    }
  }

  let rows: CustomerRow[] = base.map(({ org, ownerEmail, storeCount }) => {
    const la = lastActive.get(org.id);
    return {
      id: org.id,
      name: org.name,
      ownerEmail,
      plan: org.plan as Plan,
      status: statusOf(org),
      storeCount: Number(storeCount),
      mrr: mrrOf(org),
      alerts30d: alerts.get(org.id) ?? 0,
      createdAt: org.createdAt,
      trialEndsAt: org.trialEndsAt,
      lastActiveAt: la ? new Date(la) : null,
    };
  });

  const q = opts?.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.ownerEmail.toLowerCase().includes(q),
    );
  }
  if (opts?.status && opts.status !== "all") {
    rows = rows.filter((r) => r.status === opts.status);
  }

  rows.sort((a, b) => {
    if (a.status !== b.status) return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (b.mrr !== a.mrr) return b.mrr - a.mrr;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Activity feed (audit + alerts, humanised)
// ---------------------------------------------------------------------------

export type FeedKind = "good" | "info" | "warn" | "accent" | "danger" | "mute";
export type FeedEvent = {
  id: string;
  kind: FeedKind;
  title: string;
  meta: string;
  at: Date;
  source: "operator" | "customer" | "system";
};

function pick(payload: Record<string, unknown>, key: string): string | undefined {
  const v = payload?.[key];
  return v == null ? undefined : String(v);
}

function describe(
  action: string,
  payload: Record<string, unknown>,
  orgName: string,
): { kind: FeedKind; title: string; meta: string } {
  const org = orgName;
  switch (action) {
    case "user.signup":
      return { kind: "info", title: `${org} started a free trial`, meta: `signup · ${pick(payload, "email") ?? ""}` };
    case "store.connected":
    case "store.connect":
      return { kind: "good", title: `${org} connected a store`, meta: `store.connected · ${pick(payload, "platform") ?? ""}` };
    case "store.disconnected":
    case "store.disconnect":
      return { kind: "mute", title: `${org} disconnected a store`, meta: "store.disconnected" };
    case "billing.plan_change_requested":
    case "billing.dev_plan_set":
    case "admin.plan_changed":
      return { kind: "accent", title: `${org} changed plan`, meta: `plan → ${pick(payload, "plan") ?? "?"}` };
    case "billing.cancel_requested":
      return { kind: "warn", title: `${org} scheduled a cancellation`, meta: "subscription.cancel" };
    case "admin.trial_extended":
      return { kind: "accent", title: `Trial extended for ${org}`, meta: `+${pick(payload, "days") ?? "?"} days` };
    case "admin.account_suspended":
      return { kind: "danger", title: `${org} suspended`, meta: "admin.suspend" };
    case "admin.account_reactivated":
      return { kind: "good", title: `${org} reactivated`, meta: "admin.reactivate" };
    case "admin.data_exported":
      return { kind: "info", title: `Data export for ${org}`, meta: "GDPR export" };
    case "admin.account_erased":
      return { kind: "danger", title: `${org} erased`, meta: "GDPR erasure" };
    case "admin.verification_resent":
      return { kind: "info", title: `Verification resent for ${org}`, meta: "email_verify" };
    case "admin.dead_letter_retried":
      return { kind: "warn", title: `Webhook retried · ${org}`, meta: `source ${pick(payload, "source") ?? ""}` };
    default:
      return { kind: "mute", title: `${org} · ${action}`, meta: action };
  }
}

export async function recentActivity(limit = 40): Promise<FeedEvent[]> {
  const rows = await db
    .select({
      id: eventsAudit.id,
      action: eventsAudit.action,
      actor: eventsAudit.actor,
      payload: eventsAudit.payload,
      at: eventsAudit.createdAt,
      orgName: organizations.name,
    })
    .from(eventsAudit)
    .leftJoin(organizations, eq(eventsAudit.orgId, organizations.id))
    .orderBy(desc(eventsAudit.createdAt))
    .limit(limit);

  // Resolve which actors are operators (admins) vs customers.
  const actorIds = [...new Set(rows.map((r) => r.actor).filter((a) => a && a !== "system"))];
  const actorUsers = actorIds.length
    ? await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.id, actorIds))
    : [];
  const emailById = new Map(actorUsers.map((u) => [u.id, u.email]));

  return rows.map((r) => {
    const payload = (r.payload as Record<string, unknown>) ?? {};
    const d = describe(r.action, payload, r.orgName ?? "Unknown org");
    const email = emailById.get(r.actor);
    const source: FeedEvent["source"] =
      r.actor === "system"
        ? "system"
        : email && isAdminEmail(email)
          ? "operator"
          : "customer";
    return { id: r.id, kind: d.kind, title: d.title, meta: d.meta, at: r.at, source };
  });
}

// ---------------------------------------------------------------------------
// Audit log (raw, with resolved actor + org)
// ---------------------------------------------------------------------------

export type AuditRow = {
  id: string;
  at: Date;
  actorLabel: string;
  action: string;
  orgName: string | null;
  detail: string;
  source: "operator" | "customer" | "system";
};

export async function auditFeed(opts?: {
  action?: string;
  limit?: number;
}): Promise<AuditRow[]> {
  const where = opts?.action
    ? ilike(eventsAudit.action, `%${opts.action}%`)
    : undefined;
  const rows = await db
    .select({
      id: eventsAudit.id,
      at: eventsAudit.createdAt,
      actor: eventsAudit.actor,
      action: eventsAudit.action,
      payload: eventsAudit.payload,
      orgName: organizations.name,
    })
    .from(eventsAudit)
    .leftJoin(organizations, eq(eventsAudit.orgId, organizations.id))
    .where(where)
    .orderBy(desc(eventsAudit.createdAt))
    .limit(opts?.limit ?? 100);

  const actorIds = [...new Set(rows.map((r) => r.actor).filter((a) => a && a !== "system"))];
  const actorUsers = actorIds.length
    ? await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.id, actorIds))
    : [];
  const emailById = new Map(actorUsers.map((u) => [u.id, u.email]));

  return rows.map((r) => {
    const email = emailById.get(r.actor);
    const source: AuditRow["source"] =
      r.actor === "system" ? "system" : email && isAdminEmail(email) ? "operator" : "customer";
    const payload = (r.payload as Record<string, unknown>) ?? {};
    const detail = Object.entries(payload)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join(" · ")
      .slice(0, 120);
    return {
      id: r.id,
      at: r.at,
      actorLabel: r.actor === "system" ? "system" : (email ?? r.actor.slice(0, 8)),
      action: r.action,
      orgName: r.orgName,
      detail,
      source,
    };
  });
}

// ---------------------------------------------------------------------------
// Infra health
// ---------------------------------------------------------------------------

export type QueueHealth = Record<string, number> | null;

export async function queueHealth(): Promise<QueueHealth> {
  try {
    return await getSyncQueue().getJobCounts(
      "waiting",
      "active",
      "delayed",
      "failed",
      "completed",
    );
  } catch {
    return null;
  }
}

/** Count of orgs active (any audit/sync event) within the last N minutes. */
export async function activeRecently(minutes = 15): Promise<number> {
  const since = new Date(Date.now() - minutes * 60_000);
  const [row] = await db
    .select({ v: sql<number>`count(distinct ${eventsAudit.orgId})::int` })
    .from(eventsAudit)
    .where(gte(eventsAudit.createdAt, since));
  return Number(row?.v ?? 0);
}

export async function eventsSince(hours = 24): Promise<number> {
  const since = new Date(Date.now() - hours * 3_600_000);
  const [row] = await db
    .select({ v: count() })
    .from(eventsAudit)
    .where(gte(eventsAudit.createdAt, since));
  return Number(row?.v ?? 0);
}

export async function alertsSince(hours = 24): Promise<number> {
  const since = new Date(Date.now() - hours * 3_600_000);
  const [row] = await db
    .select({ v: count() })
    .from(alertsLog)
    .where(gte(alertsLog.createdAt, since));
  return Number(row?.v ?? 0);
}

export async function eventTypeBreakdown(
  hours = 24,
  top = 6,
): Promise<{ action: string; c: number }[]> {
  const since = new Date(Date.now() - hours * 3_600_000);
  const rows = await db
    .select({ action: eventsAudit.action, c: count() })
    .from(eventsAudit)
    .where(gte(eventsAudit.createdAt, since))
    .groupBy(eventsAudit.action)
    .orderBy(desc(count()))
    .limit(top);
  return rows.map((r) => ({ action: r.action, c: Number(r.c) }));
}

/** Total organization count — for churn/ratio denominators. */
export async function orgCount(): Promise<number> {
  const [row] = await db.select({ v: count() }).from(organizations);
  return Number(row?.v ?? 0);
}

/** Store counts per platform — for integration status. */
export async function storeCountsByPlatform(): Promise<{ shopify: number; woocommerce: number }> {
  const rows = await db
    .select({ platform: stores.platform, c: count() })
    .from(stores)
    .groupBy(stores.platform);
  const map = new Map(rows.map((r) => [r.platform, Number(r.c)]));
  return { shopify: map.get("shopify") ?? 0, woocommerce: map.get("woocommerce") ?? 0 };
}
