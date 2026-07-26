"use client";

import { usePathname, useRouter } from "next/navigation";
import { ALL_NAV_ITEMS } from "./nav-config";

function crumbFor(pathname: string): string {
  if (pathname.startsWith("/admin/customers/") && pathname !== "/admin/customers") {
    return "customers / detail";
  }
  // longest matching href wins (so /admin/customers beats /admin)
  const match = [...ALL_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return match?.seg ?? "overview";
}

export function Topbar({
  env,
  region,
}: {
  env: "production" | "sandbox";
  region: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <header className="topbar">
      <span className="crumb">
        console / <b>{crumbFor(pathname)}</b>
      </span>
      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q");
          router.push(`/admin/customers?q=${encodeURIComponent(String(q ?? "").trim())}`);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <input name="q" placeholder="Search customers by name or email…" aria-label="Search customers" />
      </form>
      <span className={`env${env === "sandbox" ? " sandbox" : ""}`}>
        <span className="dot-live" />
        {env === "production" ? "Production" : "Sandbox"} · {region}
      </span>
    </header>
  );
}
