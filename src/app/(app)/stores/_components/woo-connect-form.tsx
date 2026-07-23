"use client";

import Link from "next/link";
import { useActionState } from "react";
import { connectWooStoreAction } from "../actions";

export function WooConnectForm() {
  const [state, action, pending] = useActionState(
    connectWooStoreAction,
    undefined,
  );
  return (
    <form action={action} className="mt-4 space-y-3">
      <input
        name="siteUrl"
        placeholder="https://your-store.com"
        required
        className="h-10 w-full rounded-md border border-line bg-panel px-3 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="consumerKey"
          placeholder="ck_…"
          required
          className="h-10 w-full rounded-md border border-line bg-panel px-3 font-mono text-xs"
        />
        <input
          name="consumerSecret"
          type="password"
          placeholder="cs_…"
          required
          className="h-10 w-full rounded-md border border-line bg-panel px-3 font-mono text-xs"
        />
      </div>
      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={pending}
          className="h-10 cursor-pointer rounded-md bg-amber px-4 text-sm font-medium text-paper hover:bg-amber-dark disabled:opacity-60"
        >
          {pending ? "Validating…" : "Connect WooCommerce"}
        </button>
        <Link
          href="/help/user-guide"
          className="text-xs text-ink-soft hover:text-ink hover:underline"
        >
          How to create API keys →
        </Link>
      </div>
    </form>
  );
}
