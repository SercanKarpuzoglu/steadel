"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  requestMagicLink,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  signupUser,
} from "@/lib/services/auth-service";

export type FormState = { error?: string; message?: string } | undefined;

const signupSchema = z.object({
  name: z.string().min(1, "Please enter your name.").max(120),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const emailSchema = z.string().email("Please enter a valid email.");

function hasUnverifiedCode(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: string; cause?: { err?: unknown } };
  if (anyErr.code === "unverified") return true;
  return hasUnverifiedCode(anyErr.cause?.err);
}

export async function signupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const limited = await rateLimit(`signup:${await clientIp()}`, 5, 60);
  if (!limited.ok) return { error: "Too many attempts. Try again in a minute." };

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await signupUser(parsed.data);
  if (!result.ok) {
    return { error: "An account with this email already exists." };
  }
  redirect("/verify?sent=1");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const limited = await rateLimit(`login:${await clientIp()}`, 5, 60);
  if (!limited.ok) return { error: "Too many attempts. Try again in a minute." };

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) {
      if (hasUnverifiedCode(err)) {
        return {
          error:
            "Please verify your email first — check your inbox or request a new link below.",
        };
      }
      return { error: "Invalid email or password." };
    }
    throw err; // NEXT_REDIRECT on success
  }
  return undefined;
}

export async function magicLinkAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const limited = await rateLimit(`magic:${await clientIp()}`, 5, 60);
  if (!limited.ok) return { error: "Too many attempts. Try again in a minute." };

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await requestMagicLink(parsed.data);
  return {
    message: "If an account exists for that address, a sign-in link is on its way.",
  };
}

export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const limited = await rateLimit(`forgot:${await clientIp()}`, 5, 60);
  if (!limited.ok) return { error: "Too many attempts. Try again in a minute." };

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await requestPasswordReset(parsed.data);
  return {
    message: "If an account exists for that address, a reset link is on its way.",
  };
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const limited = await rateLimit(`reset:${await clientIp()}`, 5, 60);
  if (!limited.ok) return { error: "Too many attempts. Try again in a minute." };

  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const ok = await resetPassword(token, password);
  if (!ok) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }
  redirect("/login?reset=1");
}

export async function resendVerificationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const limited = await rateLimit(`resend:${await clientIp()}`, 5, 60);
  if (!limited.ok) return { error: "Too many attempts. Try again in a minute." };

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await resendVerification(parsed.data);
  return {
    message: "If the account needs verification, a fresh link is on its way.",
  };
}
