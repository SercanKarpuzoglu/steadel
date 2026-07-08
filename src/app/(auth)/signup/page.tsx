import type { Metadata } from "next";
import { SignupForm } from "../_components/auth-forms";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-paper">
          Start your free trial
        </h1>
        <p className="mt-1 text-sm text-mist">
          14 days, no credit card required.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
