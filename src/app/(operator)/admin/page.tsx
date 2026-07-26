import type { Metadata } from "next";
import Link from "next/link";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { deadLetters } from "@/db/schema";
import {
  activationFunnel,
  queueHealth,
  recentActivity,
  revenueSnapshot,
  signupSeries,
  signupsBetween,
} from "@/lib/admin-metrics";
import { Feed, Meter, SignupArea, Sparkline, eur } from "../_components/ui";
import { AutoRefresh } from "../_components/live-refresh";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

const PLAN_PRICE = { starter: 29, growth: 59, agency: 119 } as const;

export default async function OverviewPage() {
  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [snap, funnel, series, thisMonth, lastMonth, queue, feed, [dl]] =
    await Promise.all([
      revenueSnapshot(),
      activationFunnel(),
      signupSeries(),
      signupsBetween(startThisMonth, now),
      signupsBetween(startLastMonth, startThisMonth),
      queueHealth(),
      recentActivity(5),
      db.select({ v: count() }).from(deadLetters),
    ]);

  const deadCount = Number(dl?.v ?? 0);
  const activationPct = funnel.signups
    ? Math.round((funnel.withAlert / funnel.signups) * 100)
    : 0;
  const totalPaying = snap.planMix.starter + snap.planMix.growth + snap.planMix.agency || 1;
  const signupsUp = thisMonth >= lastMonth;

  const hasAttention = snap.pastDue > 0 || deadCount > 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">
            Live snapshot of Steadel — {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="head-actions">
          <Link className="btn" href="/admin/reports">Reports</Link>
          <Link className="btn primary" href="/admin/customers">Customers</Link>
        </div>
      </div>

      {hasAttention && (
        <div className="banner-top">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
          <span>
            {deadCount > 0 && (
              <>
                <b>{deadCount} failed webhook{deadCount === 1 ? "" : "s"}</b> in the dead-letter queue
              </>
            )}
            {deadCount > 0 && snap.pastDue > 0 && " · "}
            {snap.pastDue > 0 && (
              <>
                <b>{snap.pastDue} subscription{snap.pastDue === 1 ? "" : "s"} past due</b> ({eur(snap.atRisk)} at risk)
              </>
            )}
            . Review under <Link href="/admin/operations" style={{ textDecoration: "underline" }}>Operations</Link>
            {snap.pastDue > 0 && (
              <> &amp; <Link href="/admin/billing" style={{ textDecoration: "underline" }}>Billing</Link></>
            )}.
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid cols-4">
        <div className="card kpi">
          <div className="label">Monthly recurring revenue</div>
          <div className="val tnum">{eur(snap.mrr)}</div>
          <div className="foot">
            <span className="trend flat">{snap.activeSubs} paying</span>
            {snap.atRisk > 0 && <span className="trend down">{eur(snap.atRisk)} at risk</span>}
          </div>
          <Sparkline values={series.map((s) => s.converted)} />
        </div>
        <div className="card kpi">
          <div className="label">Active subscriptions</div>
          <div className="val tnum">{snap.activeSubs}</div>
          <div className="foot">
            <span className={`trend ${signupsUp ? "up" : "down"}`}>
              {signupsUp ? "▲" : "▼"} {thisMonth}
            </span>
            <span className="faint">new orgs this month</span>
          </div>
          <Sparkline values={series.map((s) => s.signups)} color="var(--good)" />
        </div>
        <div className="card kpi">
          <div className="label">Trials in progress</div>
          <div className="val tnum">{snap.trialing}</div>
          <div className="foot">
            <span className="faint">{snap.canceled} lapsed / canceled</span>
          </div>
        </div>
        <div className="card kpi">
          <div className="label">Activation rate</div>
          <div className="val tnum">{activationPct}%</div>
          <div className="foot">
            <span className="faint">store connected + first alert</span>
          </div>
        </div>
      </div>

      {/* Revenue + plan mix */}
      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="card span-2">
          <div className="card-head">
            <h3>New organizations — last 12 months</h3>
            <span className="hint">signups vs. converted to paid</span>
          </div>
          <div className="card-pad">
            <SignupArea data={series} />
            <div className="legend">
              <span><i style={{ background: "var(--accent)" }} />Signups</span>
              <span><i style={{ background: "var(--good)" }} />Converted to paid</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Plan mix</h3>
            <span className="hint">{totalPaying === 1 && snap.activeSubs === 0 ? "0" : snap.activeSubs} active</span>
          </div>
          <div className="card-pad">
            <div className="stack">
              <span style={{ width: `${(snap.planMix.starter / totalPaying) * 100}%`, background: "var(--mute)" }} />
              <span style={{ width: `${(snap.planMix.growth / totalPaying) * 100}%`, background: "var(--accent)" }} />
              <span style={{ width: `${(snap.planMix.agency / totalPaying) * 100}%`, background: "var(--info)" }} />
            </div>
            <div className="legend">
              <span><i style={{ background: "var(--mute)" }} />Starter €{PLAN_PRICE.starter} · <b className="tnum">{snap.planMix.starter}</b></span>
              <span><i style={{ background: "var(--accent)" }} />Growth €{PLAN_PRICE.growth} · <b className="tnum">{snap.planMix.growth}</b></span>
              <span><i style={{ background: "var(--info)" }} />Agency €{PLAN_PRICE.agency} · <b className="tnum">{snap.planMix.agency}</b></span>
            </div>

            <div style={{ marginTop: 20, borderTop: "1px solid var(--line-soft)", paddingTop: 16 }}>
              <div className="label" style={{ color: "var(--text-muted)", fontSize: 12 }}>Activation funnel · all time</div>
              <div style={{ marginTop: 12 }}>
                <FunnelRow label="Trials started" value={funnel.signups} base={funnel.signups} />
                <FunnelRow label="Store connected" value={funnel.withStore} base={funnel.signups} />
                <FunnelRow label="First alert fired" value={funnel.withAlert} base={funnel.signups} />
                <FunnelRow label="Converted to paid" value={funnel.paid} base={funnel.signups} color="var(--good)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live + health */}
      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="card span-2">
          <div className="card-head">
            <h3>Live activity</h3>
            <span className="hint"><span className="dot-live" /> auto-refreshing</span>
          </div>
          <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
            <Feed events={feed} empty="No recent activity — events appear here as customers use Steadel." />
          </div>
          <div className="card-pad" style={{ paddingTop: 0 }}>
            <Link className="btn sm ghost" href="/admin/live">Open live activity →</Link>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>System health</h3><span className="hint">EU-Frankfurt</span></div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <HealthRow ok name="Database" detail="queries responding" />
            <HealthRow
              ok={queue !== null && (queue.failed ?? 0) === 0}
              name="Job queue"
              detail={queue === null ? "Redis unreachable" : `${queue.active ?? 0} active · ${queue.failed ?? 0} failed`}
            />
            <HealthRow
              ok={deadCount === 0}
              name="Webhook delivery"
              detail={deadCount === 0 ? "no failures" : `${deadCount} dead-lettered`}
            />
            <HealthRow
              ok
              info={process.env.PADDLE_ENV !== "production"}
              name="Paddle billing"
              detail={process.env.PADDLE_ENV === "production" ? "live" : "sandbox"}
            />
          </div>
        </div>
      </div>

      <AutoRefresh seconds={30} />
    </>
  );
}

function FunnelRow({ label, value, base, color }: { label: string; value: number; base: number; color?: string }) {
  const pct = base ? (value / base) * 100 : 0;
  return (
    <div className="barrow">
      <div className="lab">
        <span className="muted">{label}</span>
        <span className="num">{value}</span>
      </div>
      <Meter pct={pct} color={color} />
    </div>
  );
}

function HealthRow({ ok, info, name, detail }: { ok: boolean; info?: boolean; name: string; detail: string }) {
  const color = info ? "var(--info)" : ok ? "var(--good)" : "var(--warn)";
  const pillCls = info ? "trial" : ok ? "active" : "past";
  const pillLabel = info ? "sandbox" : ok ? "healthy" : "attention";
  return (
    <div className="health">
      <span className="s" style={{ background: color }} />
      <div style={{ flex: 1 }}>
        <div className="nm">{name}</div>
        <div className="d">{detail}</div>
      </div>
      <span className={`pill ${pillCls} no-dot`}>{pillLabel}</span>
    </div>
  );
}
