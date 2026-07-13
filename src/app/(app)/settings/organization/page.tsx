import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireOrg } from "@/lib/org";
import { CreateApiKeyForm, OrgForm } from "../_components/settings-forms";
import { revokeApiKeyAction } from "../actions";

export const metadata: Metadata = { title: "Organization settings" };

export default async function OrgSettingsPage() {
  const { org, role } = await requireOrg();
  const apiEligible = org.plan === "growth" || org.plan === "agency";
  const keys = apiEligible
    ? await db.query.apiKeys.findMany({
        where: eq(apiKeys.orgId, org.id),
        orderBy: [desc(apiKeys.createdAt)],
      })
    : [];

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
            slackWebhookUrl={org.slackWebhookUrl ?? ""}
            isAgency={org.plan === "agency"}
            isOwner={role === "owner"}
          />
        </div>
      </Card>

      <Card>
        <CardTitle>API access</CardTitle>
        <CardDescription>
          {apiEligible ? (
            <>
              Bearer-token access to <span className="font-mono">/api/v1</span>{" "}
              (60 req/min). See the{" "}
              <Link href="/help/api" className="text-amber-text hover:underline">
                API reference
              </Link>
              .
            </>
          ) : (
            "The public API is available on the Growth and Agency plans."
          )}
        </CardDescription>
        {apiEligible && (
          <div className="mt-4 space-y-4">
            {role === "owner" && <CreateApiKeyForm />}
            {keys.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left font-mono text-xs tracking-wide text-ink-soft uppercase">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Key</th>
                    <th className="py-2 pr-4">Last used</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {keys.map((key) => (
                    <tr key={key.id}>
                      <td className="py-2.5 pr-4">{key.name}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs">
                        {key.prefix}…
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-ink-soft">
                        {key.lastUsedAt?.toLocaleString("en-GB") ?? "never"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-xs ${
                            key.revokedAt
                              ? "bg-gray-200 text-gray-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {key.revokedAt ? "revoked" : "active"}
                        </span>
                      </td>
                      <td className="py-2.5">
                        {!key.revokedAt && role === "owner" && (
                          <form action={revokeApiKeyAction}>
                            <input type="hidden" name="keyId" value={key.id} />
                            <button
                              type="submit"
                              className="cursor-pointer text-xs text-red-700 hover:underline"
                            >
                              Revoke
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
