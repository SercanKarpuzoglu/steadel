import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { organizations, orgMembers, users } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import {
  magicLinkHtml,
  passwordResetHtml,
  verifyEmailHtml,
} from "@/emails/auth-emails";
import { sendMail } from "@/lib/mail";
import { hashPassword } from "@/lib/password";
import { consumeAuthToken, createAuthToken } from "@/lib/tokens";

export const TRIAL_DAYS = 14;

export type SignupResult =
  | { ok: true; userId: string }
  | { ok: false; error: "email_taken" };

/** Creates user + personal organization (trial plan) and sends verification email. */
export async function signupUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SignupResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) return { ok: false, error: "email_taken" };

  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, name: input.name.trim() })
    .returning();

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const [org] = await db
    .insert(organizations)
    .values({
      name: `${input.name.trim()}'s store`,
      ownerUserId: user.id,
      plan: "trial",
      trialEndsAt,
    })
    .returning();
  await db
    .insert(orgMembers)
    .values({ orgId: org.id, userId: user.id, role: "owner" });

  const token = await createAuthToken(user.id, "email_verify");
  await sendMail({
    to: email,
    subject: "Verify your Steadel account",
    html: await verifyEmailHtml(user.name, token),
  });

  await recordAudit({
    orgId: org.id,
    actor: user.id,
    action: "user.signup",
    payload: { email },
  });
  return { ok: true, userId: user.id };
}

/** Marks the user's email verified. Returns false for invalid/expired tokens. */
export async function verifyEmailToken(rawToken: string): Promise<boolean> {
  const userId = await consumeAuthToken(rawToken, "email_verify");
  if (!userId) return false;
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, userId));
  return true;
}

/** Sends a fresh verification email (no-op when the account is unknown or verified). */
export async function resendVerification(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  const user = await db.query.users.findFirst({
    where: and(eq(users.email, email), isNull(users.deletedAt)),
  });
  if (!user || user.emailVerifiedAt) return;
  const token = await createAuthToken(user.id, "email_verify");
  await sendMail({
    to: email,
    subject: "Verify your Steadel account",
    html: await verifyEmailHtml(user.name, token),
  });
}

/** Sends a password-reset email (no-op for unknown accounts — no enumeration). */
export async function requestPasswordReset(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  const user = await db.query.users.findFirst({
    where: and(eq(users.email, email), isNull(users.deletedAt)),
  });
  if (!user) return;
  const token = await createAuthToken(user.id, "password_reset");
  await sendMail({
    to: email,
    subject: "Reset your Steadel password",
    html: await passwordResetHtml(user.name, token),
  });
}

/** Applies a new password for a valid reset token. */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<boolean> {
  const userId = await consumeAuthToken(rawToken, "password_reset");
  if (!userId) return false;
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(users.id, userId));
  await recordAudit({
    actor: userId,
    action: "user.password_reset",
  });
  return true;
}

/** Sends a magic sign-in link (no-op for unknown accounts). */
export async function requestMagicLink(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  const user = await db.query.users.findFirst({
    where: and(eq(users.email, email), isNull(users.deletedAt)),
  });
  if (!user) return;
  const token = await createAuthToken(user.id, "magic_link");
  await sendMail({
    to: email,
    subject: "Your Steadel sign-in link",
    html: await magicLinkHtml(user.name, token),
  });
}
