import type { Metadata } from "next";
import { LoginForm } from "../_components/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-paper">Sign in</h1>
      {params.reset === "1" && (
        <p className="text-sm text-emerald-400">
          Password updated — sign in with your new password.
        </p>
      )}
      {params.error === "magic-expired" && (
        <p className="text-sm text-red-400">
          That sign-in link is invalid or has expired. Request a fresh one
          below.
        </p>
      )}
      <LoginForm />
    </div>
  );
}
