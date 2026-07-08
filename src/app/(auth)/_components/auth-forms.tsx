"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  forgotPasswordAction,
  loginAction,
  magicLinkAction,
  resendVerificationAction,
  resetPasswordAction,
  signupAction,
  type FormState,
} from "../actions";

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="font-mono text-xs tracking-wide text-mist uppercase"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className="h-10 w-full rounded-md border border-mist/30 bg-ink px-3 text-sm text-paper placeholder:text-mist/50 focus-visible:outline-2 focus-visible:outline-amber"
      />
    </div>
  );
}

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 w-full cursor-pointer rounded-md bg-amber font-medium text-ink transition hover:bg-amber-dark disabled:opacity-60"
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}

function Feedback({ state }: { state: FormState }) {
  if (!state?.error && !state?.message) return null;
  return (
    <p
      className={
        state.error ? "text-sm text-red-400" : "text-sm text-emerald-400"
      }
    >
      {state.error ?? state.message}
    </p>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Name" name="name" autoComplete="name" />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
      />
      <Feedback state={state} />
      <SubmitButton label="Create account" pending={pending} />
      <p className="text-center text-sm text-mist">
        Already have an account?{" "}
        <Link href="/login" className="text-amber hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [magicState, magicAction, magicPending] = useActionState(
    magicLinkAction,
    undefined,
  );

  if (mode === "magic") {
    return (
      <form action={magicAction} className="space-y-4">
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Feedback state={magicState} />
        <SubmitButton label="Email me a sign-in link" pending={magicPending} />
        <button
          type="button"
          onClick={() => setMode("password")}
          className="w-full cursor-pointer text-center text-sm text-mist hover:text-paper"
        >
          Use password instead
        </button>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
      />
      <Feedback state={state} />
      <SubmitButton label="Sign in" pending={pending} />
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setMode("magic")}
          className="cursor-pointer text-mist hover:text-paper"
        >
          Email me a magic link
        </button>
        <Link href="/reset-password" className="text-mist hover:text-paper">
          Forgot password?
        </Link>
      </div>
      <p className="text-center text-sm text-mist">
        New to Steadel?{" "}
        <Link href="/signup" className="text-amber hover:underline">
          Start your free trial
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    forgotPasswordAction,
    undefined,
  );
  return (
    <form action={action} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Feedback state={state} />
      <SubmitButton label="Send reset link" pending={pending} />
      <p className="text-center text-sm text-mist">
        <Link href="/login" className="text-amber hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    resetPasswordAction,
    undefined,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
      />
      <Feedback state={state} />
      <SubmitButton label="Set new password" pending={pending} />
    </form>
  );
}

export function ResendVerificationForm() {
  const [state, action, pending] = useActionState(
    resendVerificationAction,
    undefined,
  );
  return (
    <form action={action} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Feedback state={state} />
      <SubmitButton label="Resend verification email" pending={pending} />
    </form>
  );
}
