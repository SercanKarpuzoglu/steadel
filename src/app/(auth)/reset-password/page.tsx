import type { Metadata } from "next";
import {
  ForgotPasswordForm,
  ResetPasswordForm,
} from "../_components/auth-forms";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-paper">
        {params.token ? "Choose a new password" : "Reset your password"}
      </h1>
      {params.token ? (
        <ResetPasswordForm token={params.token} />
      ) : (
        <>
          <p className="text-sm text-mist">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <ForgotPasswordForm />
        </>
      )}
    </div>
  );
}
