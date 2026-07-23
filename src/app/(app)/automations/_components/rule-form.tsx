"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveRuleAction } from "../actions";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface RuleFormDefaults {
  ruleId?: string;
  type: "low_stock_alert" | "scheduled_report";
  storeId?: string;
  threshold?: number;
  frequency?: "daily" | "weekly";
  hour?: number;
  weekday?: number;
  recipients?: string;
}

export function RuleForm({
  stores,
  defaults,
}: {
  stores: Array<{ id: string; name: string }>;
  defaults: RuleFormDefaults;
}) {
  const [type, setType] = useState(defaults.type);
  const [frequency, setFrequency] = useState(defaults.frequency ?? "weekly");
  const [state, action, pending] = useActionState(saveRuleAction, undefined);
  const editing = !!defaults.ruleId;

  return (
    <form action={action} className="space-y-4">
      {editing && <input type="hidden" name="ruleId" value={defaults.ruleId} />}

      <div className="space-y-1.5">
        <Label htmlFor="type">Automation</Label>
        <select
          id="type"
          name="type"
          value={type}
          disabled={editing}
          onChange={(e) => setType(e.target.value as RuleFormDefaults["type"])}
          className="h-10 w-full rounded-md border border-line bg-panel px-3 text-sm"
        >
          <option value="low_stock_alert">Low-stock alert</option>
          <option value="scheduled_report">Scheduled report</option>
        </select>
        {editing && <input type="hidden" name="type" value={type} />}
      </div>

      {!editing && (
        <div className="space-y-1.5">
          <Label htmlFor="storeId">Store</Label>
          <select
            id="storeId"
            name="storeId"
            defaultValue={defaults.storeId ?? stores[0]?.id}
            className="h-10 w-full rounded-md border border-line bg-panel px-3 text-sm"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {type === "low_stock_alert" ? (
        <div className="space-y-1.5">
          <Label htmlFor="threshold">Default threshold</Label>
          <Input
            id="threshold"
            name="threshold"
            type="number"
            min={0}
            defaultValue={defaults.threshold ?? 5}
          />
          <p className="text-xs text-ink-soft">
            Alert when a tracked product drops to this quantity or below.
            Per-product thresholds (set on the store page) take precedence.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="frequency">Frequency</Label>
              <select
                id="frequency"
                name="frequency"
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as "daily" | "weekly")
                }
                className="h-10 w-full rounded-md border border-line bg-panel px-3 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hour">Hour (UTC)</Label>
              <Input
                id="hour"
                name="hour"
                type="number"
                min={0}
                max={23}
                defaultValue={defaults.hour ?? 7}
              />
            </div>
          </div>
          {frequency === "weekly" && (
            <div className="space-y-1.5">
              <Label htmlFor="weekday">Day of week</Label>
              <select
                id="weekday"
                name="weekday"
                defaultValue={String(defaults.weekday ?? 1)}
                className="h-10 w-full rounded-md border border-line bg-panel px-3 text-sm"
              >
                {WEEKDAYS.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="recipients">Recipients</Label>
        <Input
          id="recipients"
          name="recipients"
          placeholder="you@example.com, ops@example.com"
          defaultValue={defaults.recipients ?? ""}
          required
        />
        <p className="text-xs text-ink-soft">Comma-separated email addresses.</p>
      </div>

      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      <Button type="submit" disabled={pending || stores.length === 0}>
        {pending ? "Saving…" : editing ? "Save changes" : "Create automation"}
      </Button>
      {stores.length === 0 && (
        <p className="text-sm text-ink-soft">Connect a store first.</p>
      )}
    </form>
  );
}
