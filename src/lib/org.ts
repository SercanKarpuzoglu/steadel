import { cache } from "react";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { organizations, orgMembers, users } from "@/db/schema";
import { auth } from "./auth";

export type SessionUser = { id: string; email: string; name: string | null };

/** Current authenticated, non-deleted user or redirect to /login. */
export const requireUser = cache(async (): Promise<SessionUser> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), isNull(users.deletedAt)),
  });
  if (!user) redirect("/login");
  return { id: user.id, email: user.email, name: user.name };
});

export type OrgContext = {
  user: SessionUser;
  org: typeof organizations.$inferSelect;
  role: "owner" | "member";
};

/**
 * Resolves the caller's organization from the session — org_id must never
 * come from client input (SPEC §8).
 */
export const requireOrg = cache(async (): Promise<OrgContext> => {
  const user = await requireUser();
  const membership = await db
    .select({ org: organizations, role: orgMembers.role })
    .from(orgMembers)
    .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
    .where(eq(orgMembers.userId, user.id))
    .limit(1);
  if (!membership[0]) redirect("/login");
  return { user, org: membership[0].org, role: membership[0].role };
});

export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/** Admin gate for /admin — redirects non-admins to the dashboard. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) redirect("/dashboard");
  return user;
}
