import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { organizations, orgMembers, users } from "@/db/schema";
import { clearOutbox, getOutbox } from "@/lib/mail";
import { verifyPassword } from "@/lib/password";
import { consumeAuthToken } from "@/lib/tokens";
import {
  requestMagicLink,
  requestPasswordReset,
  resetPassword,
  signupUser,
  verifyEmailToken,
} from "@/lib/services/auth-service";

function extractToken(html: string, path: string): string {
  const match = html.match(new RegExp(`/${path}\\?token=([A-Za-z0-9_-]+)`));
  if (!match) throw new Error(`No ${path} token found in email`);
  return match[1];
}

function uniqueEmail(): string {
  return `test-${randomUUID()}@example.com`;
}

describe("auth flows (integration)", () => {
  beforeEach(() => clearOutbox());

  it("signup creates user, trial org, membership, and sends verification email", async () => {
    const email = uniqueEmail();
    const result = await signupUser({
      name: "Ada",
      email,
      password: "password-123",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    expect(user).toBeDefined();
    expect(user!.emailVerifiedAt).toBeNull();
    expect(user!.passwordHash).not.toContain("password-123");

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.ownerUserId, user!.id),
    });
    expect(org?.plan).toBe("trial");
    expect(org?.trialEndsAt).toBeInstanceOf(Date);

    const membership = await db.query.orgMembers.findFirst({
      where: eq(orgMembers.userId, user!.id),
    });
    expect(membership?.role).toBe("owner");

    const mail = getOutbox().find((m) => m.to === email);
    expect(mail?.subject).toContain("Verify");
  });

  it("rejects duplicate signup", async () => {
    const email = uniqueEmail();
    await signupUser({ name: "A", email, password: "password-123" });
    const dup = await signupUser({ name: "B", email, password: "password-456" });
    expect(dup).toEqual({ ok: false, error: "email_taken" });
  });

  it("verifies email with the emailed token exactly once", async () => {
    const email = uniqueEmail();
    await signupUser({ name: "Ada", email, password: "password-123" });
    const mail = getOutbox().find((m) => m.to === email)!;
    const token = extractToken(mail.html, "verify");

    expect(await verifyEmailToken(token)).toBe(true);
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    expect(user!.emailVerifiedAt).toBeInstanceOf(Date);

    // single-use
    expect(await verifyEmailToken(token)).toBe(false);
  });

  it("resets password via emailed token", async () => {
    const email = uniqueEmail();
    await signupUser({ name: "Ada", email, password: "old-password-1" });
    clearOutbox();

    await requestPasswordReset(email);
    const mail = getOutbox().find((m) => m.to === email)!;
    const token = extractToken(mail.html, "reset-password");

    expect(await resetPassword(token, "new-password-9")).toBe(true);
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    expect(await verifyPassword(user!.passwordHash!, "new-password-9")).toBe(
      true,
    );
    expect(await verifyPassword(user!.passwordHash!, "old-password-1")).toBe(
      false,
    );

    // token is single-use
    expect(await resetPassword(token, "another-pass-3")).toBe(false);
  });

  it("does not reveal unknown accounts on reset request", async () => {
    await requestPasswordReset(uniqueEmail());
    expect(getOutbox()).toHaveLength(0);
  });

  it("issues a single-use magic link", async () => {
    const email = uniqueEmail();
    await signupUser({ name: "Ada", email, password: "password-123" });
    clearOutbox();

    await requestMagicLink(email);
    const mail = getOutbox().find((m) => m.to === email)!;
    const token = extractToken(mail.html, "magic");

    const userId = await consumeAuthToken(token, "magic_link");
    expect(userId).toBeTruthy();
    expect(await consumeAuthToken(token, "magic_link")).toBeNull();
  });
});
