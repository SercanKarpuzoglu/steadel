import type { Metadata } from "next";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const metadata: Metadata = { title: "Access" };
export const dynamic = "force-dynamic";

function initials(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[.\-_]/).filter(Boolean);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : local.slice(0, 2)).toUpperCase();
}

export default async function AccessPage() {
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const accounts = emails.length
    ? await db.query.users.findMany({ where: inArray(users.email, emails) })
    : [];
  const byEmail = new Map(accounts.map((u) => [u.email.toLowerCase(), u]));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Access</h1>
          <p className="page-sub">Who can operate this console</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Operators</h3><span className="hint">gated by ADMIN_EMAILS</span></div>
        {emails.length === 0 ? (
          <div className="empty">No operators configured — set ADMIN_EMAILS in the environment.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Operator</th><th>Account</th><th>Rights</th><th>Email verified</th></tr></thead>
              <tbody>
                {emails.map((email) => {
                  const u = byEmail.get(email);
                  return (
                    <tr key={email}>
                      <td>
                        <div className="cust">
                          <span className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials(email)}</span>
                          <div>
                            <div className="nm">{u?.name ?? email.split("@")[0]}</div>
                            <div className="em">{email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u ? <span className="pill no-dot active">has account</span> : <span className="pill no-dot canceled">no account yet</span>}</td>
                      <td className="faint">full · billing · GDPR erase</td>
                      <td>{u?.emailVerifiedAt ? <span className="pill no-dot active">yes</span> : <span className="pill no-dot past">no</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: "11px 16px", borderTop: "1px solid var(--line-soft)", fontSize: 12, color: "var(--text-faint)" }}>
          Operators are configured in the <span className="num">ADMIN_EMAILS</span> environment variable (comma-separated) and deployed with the app. All operators currently have full access.
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <RoleCard title="Owner" active desc="Everything, including GDPR erasure, refunds via Paddle, plan comps and access." />
        <RoleCard title="Support" desc="Read customers, resend verification, extend trials. No erasure or refunds." />
        <RoleCard title="Finance" desc="Billing, revenue reports and Paddle only. No customer-data actions." />
      </div>
      <p className="note" style={{ marginTop: 10 }}>
        Granular roles (Support / Finance) are on the roadmap — today every operator has Owner-level access.
      </p>
    </>
  );
}

function RoleCard({ title, desc, active }: { title: string; desc: string; active?: boolean }) {
  return (
    <div className="card card-pad">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ fontSize: 14 }}>{title}</h3>
        {active ? <span className="pill no-dot active">current</span> : <span className="pill no-dot canceled">planned</span>}
      </div>
      <p className="note" style={{ marginTop: 6 }}>{desc}</p>
    </div>
  );
}
