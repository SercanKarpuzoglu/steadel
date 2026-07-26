import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { deadLetters } from "@/db/schema";
import { queueHealth, storeCountsByPlatform } from "@/lib/admin-metrics";
import { ago } from "../../_components/ui";
import { AutoRefresh } from "../../_components/live-refresh";
import { discardDeadLetterAction, retryDeadLetterAction } from "./actions";

export const metadata: Metadata = { title: "Operations" };
export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const [queue, platforms, letters] = await Promise.all([
    queueHealth(),
    storeCountsByPlatform(),
    db.query.deadLetters.findMany({ orderBy: [desc(deadLetters.createdAt)], limit: 50 }),
  ]);

  const smtpOk = Boolean(process.env.SMTP_HOST);
  const paddleLive = process.env.PADDLE_ENV === "production";

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Operations</h1>
          <p className="page-sub">Queues, webhook delivery and integration health · EU-Frankfurt</p>
        </div>
        <div className="head-actions">
          <AutoRefresh seconds={10} />
        </div>
      </div>

      <div className="grid cols-4">
        <div className="card kpi">
          <div className="label">Jobs active</div>
          <div className="val tnum">{queue?.active ?? "—"}</div>
          <div className="foot"><span className="faint">{queue?.waiting ?? 0} waiting · {queue?.delayed ?? 0} delayed</span></div>
        </div>
        <div className="card kpi">
          <div className="label">Completed (retained)</div>
          <div className="val tnum">{queue?.completed ?? "—"}</div>
          <div className="foot"><span className="faint">recent successes</span></div>
        </div>
        <div className="card kpi">
          <div className="label">Failed jobs</div>
          <div className="val tnum" style={{ color: (queue?.failed ?? 0) > 0 ? "var(--warn)" : undefined }}>{queue?.failed ?? "—"}</div>
          <div className="foot"><span className="faint">in the queue</span></div>
        </div>
        <div className="card kpi">
          <div className="label">Dead-lettered</div>
          <div className="val tnum" style={{ color: letters.length > 0 ? "var(--warn)" : undefined }}>{letters.length}</div>
          <div className="foot"><span className="faint">failed webhooks</span></div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Integrations</h3><span className="hint">provider status</span></div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <Health ok name="Shopify" detail={`${platforms.shopify} store${platforms.shopify === 1 ? "" : "s"} connected`} pill="operational" />
            <Health ok name="WooCommerce" detail={`${platforms.woocommerce} store${platforms.woocommerce === 1 ? "" : "s"} connected`} pill="operational" />
            <Health ok info={!paddleLive} name="Paddle billing" detail={paddleLive ? "live · signature enforced" : "sandbox"} pill={paddleLive ? "operational" : "sandbox"} />
            <Health ok={smtpOk} name="Email (Brevo)" detail={smtpOk ? "SMTP configured" : "no SMTP — using outbox"} pill={smtpOk ? "operational" : "attention"} />
            <Health info name="Meta ads guard" detail="Beta · mock provider" pill="beta" />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Job queue</h3><span className="hint">BullMQ · Redis</span></div>
          <div className="card-pad">
            {queue === null ? (
              <div className="empty">Redis unreachable — queue stats unavailable.</div>
            ) : (
              <div className="grid cols-3" style={{ gap: 10 }}>
                {(["waiting", "active", "delayed", "completed", "failed"] as const).map((k) => (
                  <div className="stat-box" key={k}>
                    <div className="v" style={{ color: k === "failed" && (queue[k] ?? 0) > 0 ? "var(--warn)" : undefined }}>{queue[k] ?? 0}</div>
                    <div className="k">{k}</div>
                  </div>
                ))}
                <div className="stat-box">
                  <div className="v" style={{ color: "var(--good)" }}>OK</div>
                  <div className="k">redis</div>
                </div>
              </div>
            )}
            <div className="legend" style={{ marginTop: 14 }}>
              <span>Queue: <b>sync</b> · retries webhooks &amp; scheduled report ticks</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Dead-letter queue</h3><span className="hint">failed webhooks · retry re-runs a full store sync (idempotent)</span></div>
        {letters.length === 0 ? (
          <div className="empty">None — all clear.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>When</th><th>Source</th><th>Reason</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
              <tbody>
                {letters.map((l) => (
                  <tr key={l.id}>
                    <td className="num muted">{ago(l.createdAt)}</td>
                    <td><span className="plan">{l.source}</span></td>
                    <td className="faint" style={{ maxWidth: 480 }}>{l.reason}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <form action={retryDeadLetterAction}>
                          <input type="hidden" name="id" value={l.id} />
                          <button type="submit" className="btn sm">Retry</button>
                        </form>
                        <form action={discardDeadLetterAction}>
                          <input type="hidden" name="id" value={l.id} />
                          <button type="submit" className="btn sm ghost">Discard</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Health({ ok = true, info, name, detail, pill }: { ok?: boolean; info?: boolean; name: string; detail: string; pill: string }) {
  const color = info ? "var(--info)" : ok ? "var(--good)" : "var(--warn)";
  const cls = info ? "trial" : ok ? "active" : "past";
  return (
    <div className="health">
      <span className="s" style={{ background: color }} />
      <div style={{ flex: 1 }}>
        <div className="nm">{name}</div>
        <div className="d">{detail}</div>
      </div>
      <span className={`pill ${cls} no-dot`}>{pill}</span>
    </div>
  );
}
