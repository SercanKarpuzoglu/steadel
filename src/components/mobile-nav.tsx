"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NavLink } from "./nav-link";
import { NavIcon, type NavIconName } from "./nav-icon";

export interface NavItem {
  href: string;
  label: string;
  match?: string;
  icon: NavIconName;
}

export function MobileNav({
  items,
  isAdmin,
  orgName,
  userEmail,
  signOutAction,
}: {
  items: NavItem[];
  isAdmin: boolean;
  orgName: string;
  userEmail: string;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on navigation.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="rounded-md border border-line bg-panel p-2 text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-paper-soft shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="truncate text-sm font-medium text-ink">{orgName}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-ink-soft hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {items.map((item) => (
                <NavLink key={item.href} href={item.href} match={item.match}>
                  <span className="flex items-center gap-2.5">
                    <NavIcon name={item.icon} />
                    {item.label}
                  </span>
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink href="/admin" className="font-mono text-xs tracking-wide uppercase">
                  <span className="flex items-center gap-2.5">
                    <NavIcon name="admin" />
                    Admin
                  </span>
                </NavLink>
              )}
            </nav>
            <div className="border-t border-line px-5 py-4">
              <p className="truncate text-xs text-ink-soft">{userEmail}</p>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="mt-2 cursor-pointer text-xs text-ink-soft underline-offset-2 hover:underline"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
