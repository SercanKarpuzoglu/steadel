"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "./nav-config";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  userEmail,
  userInitials,
  counts,
  signOutAction,
}: {
  userEmail: string;
  userInitials: string;
  counts: Record<string, number | undefined>;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0a1421" strokeWidth={2.4} strokeLinecap="round">
            <path d="M4 15l5-5 4 4 7-7" />
          </svg>
        </span>
        <div>
          <div className="brand-name">Steadel</div>
          <div className="brand-sub">Operator Console</div>
        </div>
      </div>

      <nav className="nav">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map((item) => {
              const count = counts[item.seg];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item${isActive(pathname, item.href) ? " active" : ""}`}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {count !== undefined && count > 0 && (
                    <span
                      className="count"
                      style={item.seg === "operations" ? { color: "var(--warn)" } : undefined}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="op-card">
        <span className="avatar">{userInitials}</span>
        <div className="op-meta">
          <div className="op-name">{userEmail}</div>
          <form action={signOutAction}>
            <button type="submit" className="op-signout">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
