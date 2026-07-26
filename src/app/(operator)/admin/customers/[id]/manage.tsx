"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/lib/plans";
import type { CustomerStatus } from "@/lib/admin-metrics";
import {
  changePlan,
  eraseAccount,
  exportData,
  extendTrial,
  resendVerification,
  sendPasswordReset,
  setSuspended,
} from "./actions";

type Msg = { ok: boolean; text: string } | null;

export function CustomerActions({
  orgId,
  orgName,
  plan,
  status,
  suspended,
  ownerVerified,
}: {
  orgId: string;
  orgName: string;
  plan: Plan;
  status: CustomerStatus;
  suspended: boolean;
  ownerVerified: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);
  const [nextPlan, setNextPlan] = useState<Plan>(plan === "trial" ? "starter" : plan);
  const [days, setDays] = useState(14);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const res = await fn();
      setMsg({ ok: res.ok, text: res.message });
    });

  const doExport = () =>
    start(async () => {
      const res = await exportData(orgId);
      if (res.ok && res.json && res.filename) {
        const blob = new Blob([res.json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
      setMsg({ ok: res.ok, text: res.message });
    });

  const doErase = () =>
    start(async () => {
      const res = await eraseAccount(orgId, confirmName);
      if (res.ok) {
        router.push("/admin/customers");
        router.refresh();
        return;
      }
      setMsg({ ok: false, text: res.message });
    });

  return (
    <div className="card">
      <div className="card-head"><h3>Manage</h3><span className="hint">audited</span></div>
      <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {msg && (
          <div className={`banner ${msg.ok ? "good" : "danger"}`}>{msg.text}</div>
        )}

        {/* Plan */}
        <div>
          <div className="note" style={{ marginBottom: 6 }}>Change plan</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              className="btn"
              value={nextPlan}
              onChange={(e) => setNextPlan(e.target.value as Plan)}
              style={{ flex: 1, minWidth: 120 }}
            >
              <option value="starter">Starter · €29</option>
              <option value="growth">Growth · €59</option>
              <option value="agency">Agency · €119</option>
              <option value="trial">Trial</option>
            </select>
            <button
              className="btn primary"
              disabled={pending || nextPlan === plan}
              onClick={() => run(() => changePlan(orgId, nextPlan))}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Extend trial */}
        <div>
          <div className="note" style={{ marginBottom: 6 }}>Extend trial / grant time</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="btn"
              style={{ width: 90 }}
              aria-label="Days to extend"
            />
            <button
              className="btn"
              disabled={pending || plan !== "trial"}
              title={plan !== "trial" ? "Only trial accounts" : undefined}
              onClick={() => run(() => extendTrial(orgId, days))}
            >
              Extend by {days}d
            </button>
          </div>
        </div>

        {/* One-tap actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--line-soft)", paddingTop: 14 }}>
          <button
            className="btn full"
            disabled={pending || ownerVerified}
            onClick={() => run(() => resendVerification(orgId))}
          >
            {ownerVerified ? "Email already verified" : "Resend verification email"}
          </button>
          <button className="btn full" disabled={pending} onClick={() => run(() => sendPasswordReset(orgId))}>
            Send password-reset link
          </button>
          <button className="btn full" disabled={pending} onClick={doExport}>
            Export customer data (GDPR)
          </button>
          {suspended ? (
            <button className="btn full" disabled={pending} onClick={() => run(() => setSuspended(orgId, false))}>
              Reactivate account
            </button>
          ) : (
            <button className="btn full danger" disabled={pending} onClick={() => run(() => setSuspended(orgId, true))}>
              Suspend account
            </button>
          )}
        </div>

        {/* Erase */}
        <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 14 }}>
          {!confirmOpen ? (
            <button className="btn full danger" disabled={pending} onClick={() => setConfirmOpen(true)}>
              Erase account (GDPR)
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="banner danger">
                This permanently deletes {orgName}, its stores, data and owner login. This cannot be undone.
              </div>
              <input
                className="btn"
                placeholder={`Type “${orgName}” to confirm`}
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                aria-label="Confirm organization name"
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn danger"
                  disabled={pending || confirmName.trim() !== orgName.trim()}
                  onClick={doErase}
                >
                  Erase permanently
                </button>
                <button className="btn ghost" disabled={pending} onClick={() => { setConfirmOpen(false); setConfirmName(""); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="note">
          Every action here is written to the audit log with your name and a timestamp.
          {status === "suspended" && " This account is currently suspended."}
        </p>
      </div>
    </div>
  );
}
