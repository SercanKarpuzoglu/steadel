import type { Metadata } from "next";
import {
  activationFunnel,
  orgCount,
  revenueSnapshot,
  signupSeries,
} from "@/lib/admin-metrics";
import { Meter, SignupArea, eur } from "../../_components/ui";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [series, funnel, snap, total] = await Promise.all([
    signupSeries(),
    activationFunnel(),
    revenueSnapshot(),
    orgCount(),
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

function Bar({ label, value, base, color }: { label: string; value: number; base: number; color?: string }) {
  const pct = base ? (value / base) * 100 : 0;
  return (
    <div className="barrow" style={{ marginBottom: 11 }}>
      <div className="lab"><span className="muted">{label}</span><span className="num">{value} <span className="faint">· {Math.round(pct)}%</span></span></div>
      <Meter pct={pct} color={color} />
    </div>
  );
}
