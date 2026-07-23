import Link from "next/link";
import { requireOrg, isAdminEmail } from "@/lib/org";
import { isTrialExpired } from "@/lib/plans";
import { signOut } from "@/lib/auth";
import { Logo, LogoMark } from "@/components/logo";
import { MobileNav, type NavItem } from "@/components/mobile-nav";
import { NavLink } from "@/components/nav-link";
import { NavIcon } from "@/components/nav-icon";

function TrialBanner({
  plan,
  trialEndsAt,
  subscriptionStatus,
}: {
  plan: string;
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
}) {
  if (plan === "trial" && trialEndsAt) {
    const expired = isTrialExpired({ plan: "trial", trialEndsAt });
    const daysLeft = Math.max(
      0,
      Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    );
    return (
      <div
        className={`mb-6 flex items-center justify-between gap-3 rounded-md border px-4 py-2.5 text-sm ${
          expired
            ? "border-red-500/30 bg-red-500/10 text-red-300"
            : "border-amber/50 bg-amber/10 text-ink"
        }`}
      >
        <span>
          {expired
            ? "Your trial has ended — pick a plan to keep automations running."
            : `Free trial: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left.`}
        </span>
        <Link
          href="/settings/billing"
          className="shrink-0 font-medium text-amber-text hover:underline"
        >
          Choose a plan →
        </Link>
      </div>
    );
  }
  if (subscriptionStatus === "canceled") {
    return (
      <div className="mb-6 flex items-center justify-between gap-3 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
        <span>Your subscription is canceled — reactivate to keep automating.</span>
        <Link
          href="/settings/billing"
          className="shrink-0 font-medium hover:underline"
        >
          Billing →
        </Link>
      </div>
    );
  }
  return null;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/stores", label: "Stores", icon: "stores" },
  { href: "/automations", label: "Automations", icon: "automations" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/settings/organization", label: "Settings", match: "/settings", icon: "settings" },
  { href: "/help", label: "Help", icon: "help" },
];

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, org } = await requireOrg();
  const admin = isAdminEmail(user.email);

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="theme-app flex min-h-screen flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-paper-soft/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="h-8 w-8 shrink-0" />
          <span className="truncate text-sm font-medium text-ink">{org.name}</span>
        </Link>
        <MobileNav
          items={NAV}
          isAdmin={admin}
          orgName={org.name}
          userEmail={user.email}
          signOutAction={signOutAction}
        />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-paper-soft md:flex">
        <div className="px-5 py-6">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <p className="mt-2 truncate text-xs text-ink-soft">{org.name}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} match={item.match}>
              <span className="flex items-center gap-2.5">
                <NavIcon name={item.icon} />
                {item.label}
              </span>
            </NavLink>
          ))}
          {admin && (
            <NavLink href="/admin" className="font-mono text-xs tracking-wide uppercase">
              <span className="flex items-center gap-2.5">
                <NavIcon name="admin" />
                Admin
              </span>
            </NavLink>
          )}
        </nav>
        <div className="border-t border-line px-5 py-4">
          <p className="truncate text-xs text-ink-soft">{user.email}</p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-2 cursor-pointer text-xs text-ink-soft underline-offset-2 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <TrialBanner
          plan={org.plan}
          trialEndsAt={org.trialEndsAt}
          subscriptionStatus={org.subscriptionStatus}
        />
        {children}
      </main>
    </div>
  );
}
