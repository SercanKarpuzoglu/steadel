import Link from "next/link";
import { requireOrg, isAdminEmail } from "@/lib/org";
import { isTrialExpired } from "@/lib/plans";
import { signOut } from "@/lib/auth";

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
        className={`mb-6 flex items-center justify-between rounded-md border px-4 py-2.5 text-sm ${
          expired
            ? "border-red-300 bg-red-50 text-red-800"
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
          className="shrink-0 font-medium text-amber-dark hover:underline"
        >
          Choose a plan →
        </Link>
      </div>
    );
  }
  if (subscriptionStatus === "canceled") {
    return (
      <div className="mb-6 flex items-center justify-between rounded-md border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800">
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

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/stores", label: "Stores" },
  { href: "/automations", label: "Automations" },
  { href: "/reports", label: "Reports" },
  { href: "/settings/organization", label: "Settings" },
  { href: "/help", label: "Help" },
];

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, org } = await requireOrg();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-paper-soft">
        <div className="px-5 py-6">
          <Link
            href="/dashboard"
            className="font-mono text-sm tracking-widest text-ink uppercase"
          >
            Steadel
          </Link>
          <p className="mt-1 truncate text-xs text-ink-soft">{org.name}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-ink-soft transition hover:bg-white/70 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          {isAdminEmail(user.email) && (
            <Link
              href="/admin"
              className="block rounded-md px-3 py-2 font-mono text-xs tracking-wide text-amber-dark uppercase transition hover:bg-white/70"
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="border-t border-line px-5 py-4">
          <p className="truncate text-xs text-ink-soft">{user.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="mt-2 cursor-pointer text-xs text-ink-soft underline-offset-2 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">
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
