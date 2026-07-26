import type { Metadata } from "next";
import Link from "next/link";
import { customerList, type CustomerStatus } from "@/lib/admin-metrics";
import { ClickableRow } from "../../_components/clickable-row";
import { PlanBadge, StatusPill, ago, dateShort, eur } from "../../_components/ui";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

const FILTERS: { key: CustomerStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "trialing", label: "Trialing" },
  { key: "past_due", label: "Past due" },
  { key: "canceled", label: "Canceled" },
];

function initials(name: string): string {
  const parts = name.replace(/['’]s store$/i, "").trim().split(/\s+/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0]?.slice(0, 2) ?? "?");
  return chars.toUpperCase();
}

function trialDaysLeft(d: Date | null): number | null {
  if (!d) return null;
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86_400_000));
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = (FILTERS.find((f) => f.key === sp.status)?.key ?? "all") as
    | CustomerStatus
    | "all";

  const rows = await customerList({ q, status });

  const buildHref = (next: { status?: string; q?: string }) => {
    const params = new URLSearchParams();
    const st = next.status ?? status;
    const query = next.q ?? q;
    if (st && st !== "all") params.set("status", st);
    if (query) params.set("q", query);
    const s = params.toString();
    return `/admin/customers${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-sub">
            {rows.length} {status === "all" && !q ? "organizations" : "matching"}
            {q && <> · search “{q}”</>}
          </p>
        </div>
      </div>

      <div className="filters">
        <div className="seg">
          {FILTERS.map((f) => (
            <Link key={f.key} href={buildHref({ status: f.key })} className={status === f.key ? "on" : ""}>
              {f.label}
            </Link>
          ))}
        </div>
        <form className="searchbox" action="/admin/customers" method="get">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input name="q" defaultValue={q} placeholder="Name or email…" aria-label="Search customers" />
        </form>
        {q && (
          <Link className="chip" href={buildHref({ q: "" })}>
            Clear search ✕
          </Link>
        )}
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <div className="empty">No customers match these filters.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Stores</th>
                  <th>MRR</th>
                  <th>Alerts 30d</th>
                  <th>Created</th>
                  <th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <ClickableRow key={r.id} href={`/admin/customers/${r.id}`}>
                    <td>
                      <div className="cust">
                        <span className="flag">{initials(r.name)}</span>
                        <div>
                          <div className="nm">{r.name}</div>
                          <div className="em">{r.ownerEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td><PlanBadge plan={r.plan} /></td>
                    <td><StatusPill status={r.status} trialDays={trialDaysLeft(r.trialEndsAt)} /></td>
                    <td className="num">{r.storeCount}</td>
                    <td className="num">{r.mrr > 0 ? eur(r.mrr) : <span className="muted">—</span>}</td>
                    <td className="num">{r.alerts30d}</td>
                    <td className="num faint">{dateShort(r.createdAt)}</td>
                    <td className="num muted">{ago(r.lastActiveAt)}</td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
