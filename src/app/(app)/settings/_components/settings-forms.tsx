"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changePasswordAction,
  createApiKeyAction,
  deleteAccountAction,
  updateOrgAction,
  updateProfileAction,
  type FormState,
} from "../actions";

function Feedback({ state }: { state: FormState }) {
  if (!state?.error && !state?.message) return null;
  return (
    <p
      className={
        state.error ? "text-sm text-red-700" : "text-sm text-emerald-700"
      }
    >
      {state.error ?? state.message}
    </p>
  );
}

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    undefined,
  );
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaultName} required />
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(
    changePasswordAction,
    undefined,
  );
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current">Current password</Label>
        <Input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="next">New password</Label>
        <Input
          id="next"
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(
    deleteAccountAction,
    undefined,
  );
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Type DELETE to confirm</Label>
        <Input id="confirm" name="confirm" placeholder="DELETE" required />
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} variant="danger">
        {pending ? "Deleting…" : "Delete my account"}
      </Button>
    </form>
  );
}

export function CreateApiKeyForm() {
  const [state, action, pending] = useActionState(createApiKeyAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="flex gap-2">
        <Input name="name" placeholder="Key name (e.g. Zapier)" required />
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? "Creating…" : "Create key"}
        </Button>
      </div>
      {state?.message && (
        <p className="rounded-md border border-amber/50 bg-amber/10 px-3 py-2 font-mono text-xs break-all">
          {state.message}
        </p>
      )}
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
    </form>
  );
}

export function OrgForm({
  defaultName,
  whiteLabelName,
  slackWebhookUrl,
  isAgency,
  isOwner,
}: {
  defaultName: string;
  whiteLabelName: string;
  slackWebhookUrl: string;
  isAgency: boolean;
  isOwner: boolean;
}) {
  const [state, action, pending] = useActionState(updateOrgAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Organization name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultName}
          disabled={!isOwner}
          required
        />
      </div>
      {isAgency && (
        <div className="space-y-1.5">
          <Label htmlFor="whiteLabelName">White-label report name</Label>
          <Input
            id="whiteLabelName"
            name="whiteLabelName"
            defaultValue={whiteLabelName}
            placeholder="Shown on client reports instead of Steadel"
            disabled={!isOwner}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="slackWebhookUrl">Slack alerts (incoming webhook)</Label>
        <Input
          id="slackWebhookUrl"
          name="slackWebhookUrl"
          defaultValue={slackWebhookUrl}
          placeholder="https://hooks.slack.com/services/…"
          disabled={!isOwner}
        />
        <p className="text-xs text-ink-soft">
          Optional — alerts are also posted to this Slack channel. Leave
          empty to disable.
        </p>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending || !isOwner}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
