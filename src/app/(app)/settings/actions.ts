"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { signOut } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { requireOrg, requireUser } from "@/lib/org";
import {
  changePassword,
  softDeleteAccount,
  updateProfile,
} from "@/lib/services/account-service";

export type FormState = { error?: string; message?: string } | undefined;

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const name = z.string().min(1).max(120).safeParse(formData.get("name"));
  if (!name.success) return { error: "Please enter a name." };
  await updateProfile(user.id, { name: name.data });
  revalidatePath("/settings/account");
  return { message: "Profile updated." };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  const result = await changePassword(user.id, current, next);
  if (!result.ok) return { error: result.error };
  return { message: "Password changed." };
}

export async function deleteAccountAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (String(formData.get("confirm")) !== "DELETE") {
    return { error: 'Type "DELETE" to confirm.' };
  }
  await softDeleteAccount(user.id);
  await signOut({ redirectTo: "/" });
  return undefined;
}

export async function updateOrgAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, org, role } = await requireOrg();
  if (role !== "owner") return { error: "Only the owner can change this." };

  const name = z.string().min(1).max(160).safeParse(formData.get("name"));
  if (!name.success) return { error: "Please enter an organization name." };

  const whiteLabelRaw = formData.get("whiteLabelName");
  const whiteLabelName =
    org.plan === "agency" && typeof whiteLabelRaw === "string"
      ? whiteLabelRaw.trim() || null
      : org.whiteLabelName;

  await db
    .update(organizations)
    .set({ name: name.data.trim(), whiteLabelName })
    .where(eq(organizations.id, org.id));
  await recordAudit({
    orgId: org.id,
    actor: user.id,
    action: "org.updated",
    payload: { name: name.data.trim() },
  });
  revalidatePath("/settings/organization");
  return { message: "Organization updated." };
}
