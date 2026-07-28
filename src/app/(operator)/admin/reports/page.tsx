import type { Metadata } from "next";
import {
  activationFunnel,
  marketingTraffic,
  orgCount,
  revenueSnapshot,
  signupSeries,
} from "@/lib/admin-metrics";
import { Meter, SignupArea, Sparkline, eur } from "../../_components/ui";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [series, funnel, snap, total, traffic] = await Promise.all([
    signupSeries(),
    activationFunnel(),
    revenueSnapshot(),
    orgCount(),
    marketingTraffic(30),
  ]);

  const churnPct = total ? Math.round((snap.canceled / total) * 1000) / 10 : 0;
  const arpu = snap.activeSubs ? Math.round(snap.mrr / snap.activeSubs) : 0;
  const activationPct = funnel.signups ? Math.round((funnel.withAlert / funnel.signups) * 100) : 0;
  const conversionPct = funnel.signups ? Math.round((funnel.paid / funnel.signups) * 100) : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">Growth, conversion and engagement across the customer base</p>
        </div>
      </div>

      {/* Marketing traffic (top of funnel) */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>Marketing traffic</h3>
          <span className="hint">last 30 days · first-party, cookieless</span>
        </div>
        <div className="card-pad">
          {traffic.views === 0 ? (
            <div className="empty">
              No visits recorded yet — this starts counting the moment the marketing site gets traffic.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div className="val tnum" style={{ fontFamily: "var(--font-heading)", fontSize: 27, fontWeight: 600 }}>
                    {traffic.views.toLocaleString("en-GB")}
                  </div>
                  <div className="faint" style={{ fontSize: 12 }}>page views · marketing site only</div>
                </div>
                <div style={{ flex: 1, minWidth: 200, maxWidth: 420 }}>
                  <Sparkline values={traffic.series.map((s) => s.count)} />
                </div>
              </div>
              <div className="grid cols-3" style={{ marginTop: 18 }}>
                <TrafficList title="Top pages" rows={traffic.topPaths.map((p) => [p.path, p.c])} />
                <TrafficList title="Top referrers" rows={traffic.topReferrers.map((r) => [r.host, r.c])} empty="Direct / none yet" />
                <TrafficList title="Top countries" rows={traffic.topCountries.map((c) => [c.country, c.c])} empty="—" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="card-head"><h3>Signups vs. conversions</h3><span className="hint">last 12 months</span></div>
          <div className="card-pad">
            <SignupArea data={series} />
            <div className="legend">
              <span><i style={{ background: "var(--accent)" }} />Signups</span>
              <span><i style={{ background: "var(--good)" }} />Converted to paid</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Activation funnel</h3><span className="hint">all time</span></div>
          <div className="card-pad">
            <Bar label="Trials started" value={funnel.signups} base={funnel.signups} />
            <Bar label="Store connected" value={funnel.withStore} base={funnel.signups} />
            <Bar label="First alert fired" value={funnel.withAlert} base={funnel.signups} />
            <Bar label="Converted to paid" value={funnel.paid} base={funnel.signups} color="var(--good)" />
            <div className="legend" style={{ marginTop: 16 }}>
              <span className="num" style={{ fontSize: 20, color: "var(--good)", fontFamily: "var(--font-heading)" }}>{conversionPct}%</span>
              <span className="faint">trial → paid overall</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginTop: 16 }}>
        <div className="card kpi">
          <div className="label">Gross churn</div>
          <div className="val tnum">{churnPct}%</div>
          <div className="foot"><span className="faint">{snap.canceled} of {total} orgs canceled/lapsed</span></div>
        </div>
        <div className="card kpi">
          <div className="label">Avg. revenue / account</div>
          <div className="val tnum">{eur(arpu)}</div>
          <div className="foot"><span className="faint">MRR ÷ active subs</span></div>
        </div>
        <div className="card kpi">
          <div className="label">Activation rate</div>
          <div className="val tnum">{activationPct}%</div>
          <div className="foot"><span className="faint">store + first alert</span></div>
        </div>
        <div className="card kpi">
          <div className="label">Active / trialing</div>
          <div className="val tnum">{snap.activeSubs} / {snap.trialing}</div>
          <div className="foot"><span className="faint">paying vs. in trial</span></div>
        </div>
      </div>
    </>
  );
}

function TrafficList({ title, rows, empty }: { title: string; rows: [string, number][]; empty?: string }) {
  return (
    <div>
      <div className="note" style={{ marginBottom: 8 }}>{title}</div>
      {rows.length === 0 ? (
        <div className="faint" style={{ fontSize: 13 }}>{empty ?? "—"}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map(([label, c]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
              <span className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
              <span className="num">{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Bar({ label, value, base, color }: { label: string; value: number; base: number; color?: string }) {
  const pct = base ? (value / base) * 100 : 0;
  return (
    <div className="barrow" style={{ marginBottom: 11 }}>
      <div className="lab"><span className="muted">{label}</span><span className="num">{value} <span className="faint">· {Math.round(pct)}%</span></span></div>
      <Meter pct={pct} color={color} />
    </div>
  );
}
