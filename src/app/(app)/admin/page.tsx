import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { deadLetters, organizations, stores, users } from "@/db/schema";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getSyncQueue } from "@/jobs/queues";
import { requireAdmin } from "@/lib/org";
import { discardDeadLetterAction, retryDeadLetterAction } from "./actions";

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

  let queueCounts: Record<string, number> | null = null;
  try {
    queueCounts = await getSyncQueue().getJobCounts(
      "waiting",
      "active",
      "delayed",
      "failed",
      "completed",
    );
  } catch {
    queueCounts = null; // redis unreachable
  }

  const letters = await db.query.deadLetters.findMany({
    orderBy: [desc(deadLetters.createdAt)],
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Admin</h1>

      <Card>
        <CardTitle>Job queue health</CardTitle>
        {queueCounts ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {Object.entries(queueCounts).map(([state, value]) => (
              <div key={state}>
                <p className="font-mono text-xs tracking-wide text-ink-soft uppercase">
                  {state}
                </p>
                <p
                  className={`mt-1 text-2xl font-semibold ${
                    state === "failed" && value > 0 ? "text-red-700" : ""
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <CardDescription>Redis unreachable — queue stats unavailable.</CardDescription>
        )}
      </Card>

      <Card>
        <CardTitle>Failed webhooks (dead letters)</CardTitle>
        <CardDescription>
          Retry re-enqueues a full store sync; syncs are idempotent.
        </CardDescription>
        {letters.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">None — all clear.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-xs tracking-wide text-ink-soft uppercase">
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2 pr-4">Received</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {letters.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs">{entry.source}</td>
                    <td className="max-w-md truncate py-2.5 pr-4 text-ink-soft">
                      {entry.reason}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-ink-soft">
                      {entry.createdAt.toLocaleString("en-GB")}
                    </td>
                    <td className="py-2.5">
                      <div className="flex gap-3">
                        <form action={retryDeadLetterAction}>
                          <input type="hidden" name="id" value={entry.id} />
                          <button
                            type="submit"
                            className="cursor-pointer text-xs text-amber-text hover:underline"
                          >
                            Retry sync
                          </button>
                        </form>
                        <form action={discardDeadLetterAction}>
                          <input type="hidden" name="id" value={entry.id} />
                          <button
                            type="submit"
                            className="cursor-pointer text-xs text-ink-soft hover:underline"
                          >
                            Discard
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/admin/orgs/${org.id}`}
                      className="hover:underline"
                    >
                      {org.name}
                    </Link>
                  </td>
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
