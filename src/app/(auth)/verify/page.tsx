import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailToken } from "@/lib/services/auth-service";
import { ResendVerificationForm } from "../_components/auth-forms";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; sent?: string }>;
}) {
  const params = await searchParams;

  if (params.token) {
    const ok = await verifyEmailToken(params.token);
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-paper">
          {ok ? "Email verified" : "Link expired"}
        </h1>
        {ok ? (
          <>
            <p className="text-sm text-mist">
              Your account is ready. Sign in to set up your first store.
            </p>
            <Link
              href="/login"
              className="block rounded-md bg-paper py-2.5 text-center font-medium text-ink transition hover:bg-paper-soft"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-mist">
              This verification link is invalid or has expired. Enter your
              email to receive a fresh one.
            </p>
            <ResendVerificationForm />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-paper">Check your inbox</h1>
      <p className="text-sm text-mist">
        {params.sent === "1"
          ? "We sent you a verification link. Click it to activate your account."
          : "Your email address needs verification before you can sign in."}
      </p>
      <ResendVerificationForm />
    </div>
  );
}
