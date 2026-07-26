import type { Metadata } from "next";
import {
  activeRecently,
  alertsSince,
  eventTypeBreakdown,
  eventsSince,
  recentActivity,
} from "@/lib/admin-metrics";
import { Feed, Meter } from "../../_components/ui";
import { LiveRefresh } from "../../_components/live-refresh";

export const metadata: Metadata = { title: "Live activity" };
export const dynamic = "force-dynamic";

function humanize(action: string): string {
  return action.replace(/[._]/g, " ");
}

export default async function LivePage() {
  const [feed, online, events24, alerts24, breakdown] = await Promise.all([
    recentActivity(40),
    activeRecently(15),
    eventsSince(24),
    alertsSince(24),
    eventTypeBreakdown(24, 6),
  ]);

  const maxCount = Math.max(...breakdown.map((b) => b.c), 1);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Live activity <span className="dot-live" style={{ marginLeft: 6 }} /></h1>
          <p className="page-sub">Real-time event stream across every organization</p>
        </div>
        <div className="head-actions">
          <span className="chip"><span className="dot-live" /> {online} active in last 15 min</span>
          <LiveRefresh seconds={8} />
        </div>
      </div>

      <div className="grid cols-4">
        <div className="card kpi"><div className="label">Active recently</div><div className="val tnum">{online}</div><div className="foot"><span className="faint">orgs · last 15 min</span></div></div>
        <div className="card kpi"><div className="label">Events (24h)</div><div className="val tnum">{events24}</div><div className="foot"><span className="faint">audited actions</span></div></div>
        <div className="card kpi"><div className="label">Alerts sent (24h)</div><div className="val tnum">{alerts24}</div><div className="foot"><span className="faint">to customers</span></div></div>
        <div className="card kpi"><div className="label">Stream</div><div className="val tnum" style={{ fontSize: 20, display: "flex", alignItems: "center", gap: 8 }}><span className="dot-live" /> live</div><div className="foot"><span className="faint">auto-refresh 8s</span></div></div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="card span-2">
          <div className="card-head"><h3>Event stream</h3><span className="hint"><span className="dot-live" /> streaming · all event types</span></div>
          <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 8 }}>
            <Feed events={feed} empty="No activity in the window — events appear here in real time." />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>By event type</h3><span className="hint">last 24h</span></div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {breakdown.length === 0 ? (
              <div className="empty">No events yet.</div>
            ) : (
              breakdown.map((b) => (
                <div className="barrow" key={b.action}>
                  <div className="lab"><span className="muted">{humanize(b.action)}</span><span className="num">{b.c}</span></div>
                  <Meter pct={(b.c / maxCount) * 100} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
