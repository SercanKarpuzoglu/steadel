import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  adConnections,
  alertsLog,
  organizations,
  orgMembers,
  stores,
  users,
} from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/password";

/** GDPR data export: everything we store for the user's organization. */
export async function exportUserData(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { passwordHash: false },
  });
  if (!user) return null;

  const memberships = await db
    .select({ org: organizations, role: orgMembers.role })
    .from(orgMembers)
    .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
    .where(eq(orgMembers.userId, userId));

  const orgsData = [];
  for (const { org, role } of memberships) {
    const orgStores = await db.query.stores.findMany({
      where: eq(stores.orgId, org.id),
      columns: { credentialsEncrypted: false },
    });
    const storeIds = orgStores.map((s) => s.id);
    const orgProducts = storeIds.length
      ? await db.query.products.findMany({
          where: (p, { inArray }) => inArray(p.storeId, storeIds),
        })
      : [];
    const rules = storeIds.length
      ? await db.query.automationRules.findMany({
          where: (r, { inArray }) => inArray(r.storeId, storeIds),
        })
      : [];
    const alerts = await db.query.alertsLog.findMany({
      where: eq(alertsLog.orgId, org.id),
    });
    const ads = await db.query.adConnections.findMany({
      where: eq(adConnections.orgId, org.id),
      columns: { credentialsEncrypted: false },
    });
    orgsData.push({
      organization: org,
      role,
      stores: orgStores,
      products: orgProducts,
      automationRules: rules,
      alerts,
      adConnections: ads,
    });
  }

  await recordAudit({
    orgId: memberships[0]?.org.id,
    actor: userId,
    action: "account.export",
  });

  return { exportedAt: new Date().toISOString(), user, organizations: orgsData };
}

/**
 * GDPR erasure: soft-deletes the account immediately; a purge job removes all
 * data 30 days later (see worker). Sign-in is blocked right away.
 */
export async function softDeleteAccount(userId: string): Promise<void> {
  const membership = await db.query.orgMembers.findFirst({
    where: eq(orgMembers.userId, userId),
  });
  await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(eq(users.id, userId));
  await recordAudit({
    orgId: membership?.orgId,
    actor: userId,
    action: "account.delete_requested",
  });
}

export async function updateProfile(
  userId: string,
  input: { name: string },
): Promise<void> {
  await db
    .update(users)
    .set({ name: input.name.trim() })
    .where(eq(users.id, userId));
}

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.passwordHash) return { ok: false, error: "No password set." };
  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    return { ok: false, error: "Current password is incorrect." };
  }
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(users.id, userId));
  await recordAudit({ actor: userId, action: "user.password_changed" });
  return { ok: true };
}
