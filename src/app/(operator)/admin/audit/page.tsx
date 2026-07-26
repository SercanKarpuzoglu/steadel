import type { Metadata } from "next";
import Link from "next/link";
import { auditFeed, type AuditRow } from "@/lib/admin-metrics";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

type Source = "all" | "operator" | "customer" | "system";
const SOURCES: { key: Source; label: string }[] = [
  { key: "all", label: "All" },
  { key: "operator", label: "Operator" },
  { key: "customer", label: "Customer" },
  { key: "system", label: "System" },
];

const SOURCE_PILL: Record<AuditRow["source"], string> = {
  operator: "active",
  customer: "trial",
  system: "canceled",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; source?: string }>;
}) {
  const sp = await searchParams;
  const action = sp.action?.trim() ?? "";
  const source = (SOURCES.find((s) => s.key === sp.source)?.key ?? "all") as Source;

  const all = await auditFeed({ action: action || undefined, limit: 200 });
  const rows = source === "all" ? all : all.filter((r) => r.source === source);

  const buildHref = (next: { source?: Source; action?: string }) => {
    const params = new URLSearchParams();
    const src = next.source ?? source;
    const act = next.action ?? action;
    if (src !== "all") params.set("source", src);
    if (act) params.set("action", act);
    const s = params.toString();
    return `/admin/audit${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Audit log</h1>
          <p className="page-sub">Every meaningful action — who did it, and when. Append-only.</p>
        </div>
      </div>

      <div className="filters">
        <div className="seg">
          {SOURCES.map((s) => (
            <Link key={s.key} href={buildHref({ source: s.key })} className={source === s.key ? "on" : ""}>
              {s.label}
            </Link>
          ))}
        </div>
        <form className="searchbox" action="/admin/audit" method="get">
          {source !== "all" && <input type="hidden" name="source" value={source} />}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input name="action" defaultValue={action} placeholder="Filter by action, e.g. plan_changed…" aria-label="Filter by action" />
        </form>
        {action && (
          <Link className="chip" href={buildHref({ action: "" })}>Clear ✕</Link>
        )}
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <div className="empty">No matching audit entries.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Time</th><th>Actor</th><th>Action</th><th>Organization</th><th>Detail</th><th>Source</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="num muted">{r.at.toLocaleString("en-GB")}</td>
                    <td>{r.actorLabel}</td>
                    <td><span className="plan">{r.action}</span></td>
                    <td>{r.orgName ?? <span className="faint">—</span>}</td>
                    <td className="faint">{r.detail || "—"}</td>
                    <td><span className={`pill no-dot ${SOURCE_PILL[r.source]}`}>{r.source}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: "11px 16px", borderTop: "1px solid var(--line-soft)", fontSize: 12, color: "var(--text-faint)" }}>
          Audit entries are append-only. Raw application logs live server-side (pino) and are not exposed here by design.
        </div>
      </div>
    </>
  );
}
