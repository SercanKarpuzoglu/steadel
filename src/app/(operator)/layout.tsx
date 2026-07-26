import type { Metadata } from "next";
import { count } from "drizzle-orm";
import "./console.css";
import { db } from "@/db";
import { deadLetters, organizations } from "@/db/schema";
import { signOut } from "@/lib/auth";
import { requireAdmin } from "@/lib/org";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";

export const metadata: Metadata = {
  title: { default: "Operator Console", template: "%s · Steadel Operator" },
};

function initials(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[.\-_]/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : local.slice(0, 2);
  return chars.toUpperCase();
}

export default async function OperatorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  const [[orgRow], [dlRow]] = await Promise.all([
    db.select({ value: count() }).from(organizations),
    db.select({ value: count() }).from(deadLetters),
  ]);

  const counts: Record<string, number | undefined> = {
    customers: orgRow?.value ?? 0,
    operations: dlRow?.value ?? 0,
  };

  const env = process.env.PADDLE_ENV === "production" ? "production" : "sandbox";

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="console">
      <Sidebar
        userEmail={admin.email}
        userInitials={initials(admin.email)}
        counts={counts}
        signOutAction={signOutAction}
      />
      <div className="main">
        <Topbar env={env} region="EU-Frankfurt" />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
