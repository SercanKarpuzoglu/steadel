import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireOrg } from "@/lib/org";
import { OrgForm } from "../_components/settings-forms";

export const metadata: Metadata = { title: "Organization settings" };

export default async function OrgSettingsPage() {
  const { org, role } = await requireOrg();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold">Organization</h1>
        <nav className="flex gap-4 text-sm text-ink-soft">
          <Link href="/settings/billing" className="hover:text-ink">
            Billing
          </Link>
          <Link href="/settings/account" className="hover:text-ink">
            Account
          </Link>
        </nav>
      </div>

      <Card>
        <CardTitle>General</CardTitle>
        <CardDescription>
          Plan: <span className="font-mono uppercase">{org.plan}</span>
          {org.plan === "trial" && org.trialEndsAt && (
            <> · trial ends {org.trialEndsAt.toLocaleDateString("en-GB")}</>
          )}
        </CardDescription>
        <div className="mt-4">
          <OrgForm
            defaultName={org.name}
            whiteLabelName={org.whiteLabelName ?? ""}
            isAgency={org.plan === "agency"}
            isOwner={role === "owner"}
          />
        </div>
      </Card>
    </div>
  );
}
