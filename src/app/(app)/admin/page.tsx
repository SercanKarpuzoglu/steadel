import type { Metadata } from "next";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, stores, users } from "@/db/schema";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/org";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();

  const orgs = await db
    .select({
      org: organizations,
      ownerEmail: users.email,
      storeCount: count(stores.id),
    })
    .from(organizations)
    .innerJoin(users, eq(organizations.ownerUserId, users.id))
    .leftJoin(stores, eq(stores.orgId, organizations.id))
    .groupBy(organizations.id, users.email)
    .orderBy(desc(organizations.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Admin</h1>

      <Card>
        <CardTitle>Organizations</CardTitle>
        <CardDescription>{orgs.length} total</CardDescription>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-xs tracking-wide text-ink-soft uppercase">
                <th className="py-2 pr-4">Organization</th>
                <th className="py-2 pr-4">Owner</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Stores</th>
                <th className="py-2 pr-4">Trial ends</th>
                <th className="py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orgs.map(({ org, ownerEmail, storeCount }) => (
                <tr key={org.id}>
                  <td className="py-2.5 pr-4">{org.name}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{ownerEmail}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs uppercase">
                    {org.plan}
                  </td>
                  <td className="py-2.5 pr-4">{storeCount}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">
                    {org.trialEndsAt?.toLocaleDateString("en-GB") ?? "—"}
                  </td>
                  <td className="py-2.5 text-ink-soft">
                    {org.createdAt.toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
