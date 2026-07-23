"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  cancelSubscriptionAction,
  changePlanAction,
  type FormState,
} from "../actions";

function Feedback({ state }: { state: FormState }) {
  if (!state?.error && !state?.message) return null;
  return (
    <p className={state.error ? "text-sm text-red-300" : "text-sm text-emerald-200"}>
      {state.error ?? state.message}
    </p>
  );
}

export function ChangePlanButton({ plan, label }: { plan: string; label: string }) {
  const [state, action, pending] = useActionState(changePlanAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="plan" value={plan} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Switching…" : label}
      </Button>
      <Feedback state={state} />
    </form>
  );
}

export function CancelSubscriptionForm() {
  const [state, action, pending] = useActionState(
    cancelSubscriptionAction,
    undefined,
  );
  return (
    <form action={action} className="space-y-2">
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel subscription"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}
