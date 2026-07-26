import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq, gte } from "drizzle-orm";
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
import { statusOf } from "@/lib/admin-metrics";
import { listTransactions, type PaddleTransaction } from "@/lib/paddle";
import { PLAN_LIMITS, billingEnabled, getOrgUsage, type Plan } from "@/lib/plans";
import { Meter, PlanBadge, StatusPill, ago, dateShort } from "../../../_components/ui";
import { CustomerActions } from "./manage";

export const metadata: Metadata = { title: "Customer" };
export const dynamic = "force-dynamic";

function initials(name: string): string {
  const parts = name.replace(/['’]s store$/i, "").trim().split(/\s+/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0]?.slice(0, 2) ?? "?");
  return chars.toUpperCase();
}

function humanize(action: string): string {
  const base = action.replace(/^(admin|billing|user|store)\./, "").replace(/[._]/g, " ");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function payloadSummary(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  return Object.entries(payload as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ")
    .slice(0, 100);
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
  if (!org) notFound();

  const since = new Date(Date.now() - 30 * 86_400_000);
  const [owner, members, orgStores, ruleCounts, usage, [allAlerts], [alerts30], audit] =
    await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, org.ownerUserId) }),
      db
        .select({ email: users.email, name: users.name, role: orgMembers.role })
        .from(orgMembers)
        .innerJoin(users, eq(orgMembers.userId, users.id))
        .where(eq(orgMembers.orgId, org.id)),
      db.query.stores.findMany({ where: eq(stores.orgId, org.id) }),
      db
        .select({ storeId: automationRules.storeId, c: count() })
        .from(automationRules)
        .innerJoin(stores, eq(automationRules.storeId, stores.id))
        .where(eq(stores.orgId, org.id))
        .groupBy(automationRules.storeId),
      getOrgUsage(org.id),
      db.select({ v: count() }).from(alertsLog).where(eq(alertsLog.orgId, org.id)),
      db
        .select({ v: count() })
        .from(alertsLog)
        .where(and(eq(alertsLog.orgId, org.id), gte(alertsLog.createdAt, since))),
      db.query.eventsAudit.findMany({
        where: eq(eventsAudit.orgId, org.id),
        orderBy: [desc(eventsAudit.createdAt)],
        limit: 12,
      }),
    ]);

  const status = statusOf(org);
  const plan = org.plan as Plan;
  const limits = PLAN_LIMITS[plan];
  const ruleByStore = new Map(ruleCounts.map((r) => [r.storeId, Number(r.c)]));
  const trialDays = org.trialEndsAt
    ? Math.max(0, Math.ceil((org.trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : null;

  let transactions: PaddleTransaction[] = [];
  if (org.paddleCustomerId && billingEnabled()) {
    try {
      transactions = await listTransactions(org.paddleCustomerId);
    } catch {
      transactions = [];
    }
  }

  const storeLimit = limits.stores;
  const autoLimit = limits.automations; // null = unlimited

  return (
    <>
      <Link className="back" href="/admin/customers">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to customers
      </Link>

      <div className="detail-head">
        <span className="flag" style={{ width: 44, height: 44, fontSize: 16 }}>{initials(org.name)}</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="detail-title">
            <h1 className="page-title">{org.name}</h1>
            <PlanBadge plan={plan} />
            <StatusPill status={status} trialDays={trialDays} />
          </div>
          <p className="page-sub">
            {owner?.email ?? "no owner"} · customer since {dateShort(org.createdAt)}
            {" · "}
            <span className="num faint">{org.id.slice(0, 8)}</span>
          </p>
        </div>
      </div>

      {status === "suspended" && (
        <div className="banner danger" style={{ marginBottom: 16 }}>
          This account is suspended — automations are halted. Data is preserved and reads still work.
        </div>
      )}

      <div className="grid cols-3">
        {/* Subscription */}
        <div className="card">
          <div className="card-head"><h3>Subscription</h3><span className="hint">{org.paddleSubscriptionId ? "Paddle" : "internal"}</span></div>
          <div className="card-pad">
            <dl className="kv">
              <dt>Plan</dt><dd>{limits.label} · {limits.priceEur > 0 ? `€${limits.priceEur}/mo` : "free"}</dd>
              <dt>Status</dt><dd>{status}</dd>
              {org.subscriptionStatus && (<><dt>Paddle state</dt><dd>{org.subscriptionStatus}</dd></>)}
              {org.trialEndsAt && (<><dt>Trial ends</dt><dd>{dateShort(org.trialEndsAt)}{trialDays != null && ` (${trialDays}d)`}</dd></>)}
              <dt>Sub ID</dt><dd className="faint">{org.paddleSubscriptionId ? `${org.paddleSubscriptionId.slice(0, 12)}…` : "—"}</dd>
            </dl>
          </div>
        </div>

        {/* Usage */}
        <div className="card">
          <div className="card-head"><h3>Usage</h3><span className="hint">this account</span></div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="barrow">
              <div className="lab"><span className="muted">Stores</span><span className="num">{usage.stores} <span className="faint">/ {storeLimit}</span></span></div>
              <Meter pct={(usage.stores / storeLimit) * 100} />
            </div>
            <div className="barrow">
              <div className="lab"><span className="muted">Automations</span><span className="num">{usage.automations} <span className="faint">/ {autoLimit ?? "∞"}</span></span></div>
              <Meter pct={autoLimit ? (usage.automations / autoLimit) * 100 : Math.min(100, usage.automations * 8)} />
            </div>
            <div className="barrow">
              <div className="lab"><span className="muted">Alerts (30d)</span><span className="num">{Number(alerts30?.v ?? 0)}</span></div>
              <Meter pct={Math.min(100, Number(alerts30?.v ?? 0))} color="var(--good)" />
            </div>
            <div className="barrow">
              <div className="lab"><span className="muted">Team members</span><span className="num">{members.length}</span></div>
              <Meter pct={Math.min(100, members.length * 20)} color="var(--info)" />
            </div>
            <div className="note">{Number(allAlerts?.v ?? 0)} alerts all-time</div>
          </div>
        </div>

        {/* Manage (client island) */}
        <CustomerActions
          orgId={org.id}
          orgName={org.name}
          plan={plan}
          status={status}
          suspended={Boolean(org.suspendedAt)}
          ownerVerified={Boolean(owner?.emailVerifiedAt)}
        />
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        {/* Stores */}
        <div className="card">
          <div className="card-head"><h3>Stores &amp; automations</h3><span className="hint">{orgStores.length} store{orgStores.length === 1 ? "" : "s"}</span></div>
          {orgStores.length === 0 ? (
            <div className="empty">No stores connected.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Store</th><th>Platform</th><th>Automations</th><th>Last sync</th><th>Status</th></tr></thead>
                <tbody>
                  {orgStores.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td><span className="plan">{s.platform === "woocommerce" ? "Woo" : "Shopify"}</span></td>
                      <td className="num">{ruleByStore.get(s.id) ?? 0}</td>
                      <td className="num muted">{ago(s.lastSyncAt)}</td>
                      <td>
                        <span className={`pill no-dot ${s.status === "connected" ? "active" : s.status === "error" ? "crit" : "canceled"}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Billing history */}
        <div className="card">
          <div className="card-head"><h3>Billing history</h3><span className="hint">Paddle</span></div>
          {transactions.length === 0 ? (
            <div className="empty">
              {org.paddleCustomerId ? "No invoices found." : "Not a paying customer yet."}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Invoice</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="num muted">{t.billed_at ? dateShort(new Date(t.billed_at)) : "—"}</td>
                      <td className="num faint">{t.invoice_number ?? t.id.slice(0, 12)}</td>
                      <td className="num">
                        {t.details?.totals?.grand_total
                          ? `${t.details.totals.currency_code ?? "EUR"} ${(Number(t.details.totals.grand_total) / 100).toFixed(2)}`
                          : "—"}
                      </td>
                      <td><span className="pill no-dot active">{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Audit timeline */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Audit timeline</h3><span className="hint">this organization</span></div>
        <div className="card-pad">
          {audit.length === 0 ? (
            <div className="empty">No recorded actions yet.</div>
          ) : (
            <div className="timeline">
              {audit.map((e) => (
                <div className="tl-item" key={e.id}>
                  <div className="a"><b>{humanize(e.action)}</b> {payloadSummary(e.payload) && <span className="muted">— {payloadSummary(e.payload)}</span>}</div>
                  <div className="m">{e.actor === "system" ? "system" : "user/operator"} · {e.createdAt.toLocaleString("en-GB")}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
