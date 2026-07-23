import type { Metadata } from "next";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/org";
import {
  ChangePasswordForm,
  DeleteAccountForm,
  ProfileForm,
} from "../_components/settings-forms";

export const metadata: Metadata = { title: "Account settings" };

export default async function AccountSettingsPage() {
  const user = await requireUser();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold">Account</h1>

      <Card>
        <CardTitle>Profile</CardTitle>
        <CardDescription>{user.email}</CardDescription>
        <div className="mt-4">
          <ProfileForm defaultName={user.name ?? ""} />
        </div>
      </Card>

      <Card>
        <CardTitle>Password</CardTitle>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </Card>

      <Card>
        <CardTitle>Export my data</CardTitle>
        <CardDescription>
          Download everything Steadel stores about you and your organization
          as JSON (GDPR data portability).
        </CardDescription>
        <a
          href="/api/account/export"
          download
          className="mt-4 inline-flex h-10 items-center rounded-md border border-line bg-panel px-4 text-sm font-medium text-ink transition hover:bg-white/10"
        >
          Download JSON export
        </a>
      </Card>

      <Card className="border-red-500/30">
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          Your account is deactivated immediately and all data is permanently
          erased after 30 days (GDPR right to erasure). This cannot be undone.
        </CardDescription>
        <div className="mt-4">
          <DeleteAccountForm />
        </div>
      </Card>
    </div>
  );
}
