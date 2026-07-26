import type { ReactNode } from "react";
import type { CustomerStatus, FeedEvent, FeedKind } from "@/lib/admin-metrics";
import type { Plan } from "@/lib/plans";

// ---------- formatting ----------

export function eur(n: number): string {
  return `€${Math.round(n).toLocaleString("en-GB")}`;
}

export function dateShort(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ago(d: Date | null): string {
  if (!d) return "—";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  const days = Math.floor(s / 86_400);
  if (days < 30) return `${days}d ago`;
  return dateShort(d);
}

// ---------- pills ----------

const STATUS_META: Record<CustomerStatus, { cls: string; label: string }> = {
  active: { cls: "active", label: "active" },
  trialing: { cls: "trial", label: "trial" },
  past_due: { cls: "past", label: "past due" },
  canceled: { cls: "canceled", label: "canceled" },
  suspended: { cls: "crit", label: "suspended" },
};

export function StatusPill({ status, trialDays }: { status: CustomerStatus; trialDays?: number | null }) {
  const m = STATUS_META[status];
  const label =
    status === "trialing" && trialDays != null ? `trial · ${trialDays}d` : m.label;
  return <span className={`pill ${m.cls}`}>{label}</span>;
}

export function PlanBadge({ plan }: { plan: Plan }) {
  const cls = plan === "growth" ? "plan growth" : plan === "agency" ? "plan agency" : "plan";
  const label = plan.charAt(0).toUpperCase() + plan.slice(1);
  return <span className={cls}>{label}</span>;
}

// ---------- feed ----------

const KIND_COLOR: Record<FeedKind, { c: string; soft: string }> = {
  good: { c: "var(--good)", soft: "var(--good-soft)" },
  info: { c: "var(--info)", soft: "var(--info-soft)" },
  warn: { c: "var(--warn)", soft: "var(--warn-soft)" },
  accent: { c: "var(--accent)", soft: "var(--accent-soft)" },
  danger: { c: "var(--danger)", soft: "var(--danger-soft)" },
  mute: { c: "var(--mute)", soft: "var(--mute-soft)" },
};

const s = { fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
const KIND_ICON: Record<FeedKind, ReactNode> = {
  good: <path d="M20 6L9 17l-5-5" />,
  info: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </>
  ),
  warn: <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />,
  accent: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  danger: <path d="M18 6L6 18M6 6l12 12" />,
  mute: <path d="M5 12h14" />,
};

export function Feed({ events, empty }: { events: FeedEvent[]; empty?: string }) {
  if (events.length === 0) {
    return <div className="empty">{empty ?? "No activity yet."}</div>;
  }
  return (
    <div className="feed">
      {events.map((e) => (
        <div className="feed-row" key={e.id}>
          <span className="ev-ic" style={{ background: KIND_COLOR[e.kind].soft, color: KIND_COLOR[e.kind].c }}>
            <svg viewBox="0 0 24 24" {...s}>
              {KIND_ICON[e.kind]}
            </svg>
          </span>
          <div className="ev-body">
            <div className="t">{e.title}</div>
            <div className="ev-meta">{e.meta}</div>
          </div>
          <span className="ev-time">{ago(e.at)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- charts (dependency-free inline SVG; CSP-safe) ----------

export function Sparkline({
  values,
  color = "var(--accent)",
  width = 220,
  height = 34,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - 3 - ((v - min) / span) * (height - 6)).toFixed(1)}`)
    .join(" ");
  return (
    <svg className="spark" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth={2} points={pts} />
    </svg>
  );
}

/** Signups vs. converted, as an area + line over months. */
export function SignupArea({
  data,
  height = 220,
}: {
  data: { month: string; signups: number; converted: number }[];
  height?: number;
}) {
  const w = 720;
  const padY = 20;
  if (data.length < 2) {
    return <div className="empty">Not enough history yet — check back after a few weeks.</div>;
  }
  const max = Math.max(...data.map((d) => d.signups), 1);
  const step = (w - 40) / (data.length - 1);
  const x = (i: number) => 30 + i * step;
  const y = (v: number) => height - padY - (v / max) * (height - padY * 2);

  const line = data.map((d, i) => `${x(i).toFixed(1)},${y(d.signups).toFixed(1)}`).join(" ");
  const conv = data.map((d, i) => `${x(i).toFixed(1)},${y(d.converted).toFixed(1)}`).join(" ");
  const area = `M${x(0)},${y(data[0].signups)} L${line
    .split(" ")
    .slice(1)
    .join(" L")} L${x(data.length - 1)},${height - padY} L${x(0)},${height - padY} Z`;

  const gridYs = [0.25, 0.5, 0.75, 1].map((f) => padY + f * (height - padY * 2));

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" role="img" aria-label="Signups per month">
      {gridYs.map((gy, i) => (
        <line key={i} x1={30} y1={gy} x2={w - 10} y2={gy} stroke="var(--grid)" />
      ))}
      <defs>
        <linearGradient id="con-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.26" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#con-area)" />
      <polyline fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" points={line} />
      <polyline fill="none" stroke="var(--good)" strokeWidth={2} strokeLinejoin="round" points={conv} />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1].signups)} r={4.5} fill="var(--accent)" />
    </svg>
  );
}

export function Meter({ pct, color = "var(--accent)" }: { pct: number; color?: string }) {
  return (
    <div className="meter">
      <span style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}
