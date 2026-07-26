import type { Metadata } from "next";
import { auditFeed, revenueSnapshot } from "@/lib/admin-metrics";
import { eur } from "../../_components/ui";

export const metadata: Metadata = { title: "Billing & Revenue" };
export const dynamic = "force-dynamic";

const PRICE = { starter: 29, growth: 59, agency: 119 } as const;
const NET_RATIO = 0.76; // ≈ after Turkish VAT + Paddle fees (observed on live €29 charges)
const BILLING_RE = /billing|subscription|plan|refund|payment|trial/i;

export default async function BillingPage() {
  const [snap, audit] = await Promise.all([
    revenueSnapshot(),
    auditFeed({ limit: 200 }),
  ]);

  const events = audit.filter((e) => BILLING_RE.test(e.action)).slice(0, 20);
  const planRevenue = {
    starter: snap.planMix.starter * PRICE.starter,
    growth: snap.planMix.growth * PRICE.growth,
    agency: snap.planMix.agency * PRICE.agency,
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Billing &amp; Revenue</h1>
          <p className="page-sub">Derived from live subscription state · Paddle is the system of record · EUR</p>
        </div>
        <div className="head-actions">
          <a className="btn" href="https://vendors.paddle.com" target="_blank" rel="noopener noreferrer">Open Paddle ↗</a>
        </div>
      </div>

      <div className="grid cols-4">
        <div className="card kpi">
          <div className="label">Monthly recurring revenue</div>
          <div className="val tnum">{eur(snap.mrr)}</div>
          <div className="foot"><span className="faint">{snap.activeSubs} active subscriptions</span></div>
        </div>
        <div className="card kpi">
          <div className="label">Net estimate (mo)</div>
          <div className="val tnum">≈ {eur(snap.mrr * NET_RATIO)}</div>
          <div className="foot"><span className="faint">after VAT + Paddle fees</span></div>
        </div>
        <div className="card kpi">
          <div className="label">Past due</div>
          <div className="val tnum" style={{ color: snap.pastDue > 0 ? "var(--warn)" : undefined }}>{snap.pastDue}</div>
          <div className="foot"><span className="faint">{eur(snap.atRisk)} at risk</span></div>
        </div>
        <div className="card kpi">
          <div className="label">Canceled / lapsed</div>
          <div className="val tnum">{snap.canceled}</div>
          <div className="foot"><span className="faint">not billing</span></div>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="card span-2">
          <div className="card-head"><h3>Recent billing activity</h3><span className="hint">from the audit trail</span></div>
          {events.length === 0 ? (
            <div className="empty">No billing events recorded yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Time</th><th>Organization</th><th>Event</th><th>Detail</th></tr></thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td className="num muted">{e.at.toLocaleString("en-GB")}</td>
                      <td>{e.orgName ?? <span className="faint">—</span>}</td>
                      <td><span className="plan">{e.action.replace(/^billing\./, "")}</span></td>
                      <td className="faint">{e.detail || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ padding: "11px 16px", borderTop: "1px solid var(--line-soft)", fontSize: 12, color: "var(--text-faint)" }}>
            Per-invoice PDFs, refunds and dunning are managed in the Paddle dashboard. Each customer&rsquo;s invoices appear on their detail page.
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Revenue by plan</h3><span className="hint">MRR contribution</span></div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <PlanRow label="Starter" price={PRICE.starter} count={snap.planMix.starter} revenue={planRevenue.starter} color="var(--mute)" />
            <PlanRow label="Growth" price={PRICE.growth} count={snap.planMix.growth} revenue={planRevenue.growth} color="var(--accent)" />
            <PlanRow label="Agency" price={PRICE.agency} count={snap.planMix.agency} revenue={planRevenue.agency} color="var(--info)" />
            <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
              <span>Total MRR</span><span className="num">{eur(snap.mrr)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PlanRow({ label, price, count, revenue, color }: { label: string; price: number; count: number; revenue: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
        <span><i style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, background: color, marginRight: 8 }} />{label} · €{price}</span>
        <span className="num">{count} · {eur(revenue)}</span>
      </div>
    </div>
  );
}
