"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { linkAdSetAction } from "../actions";

export interface AdSetOption {
  connectionId: string;
  campaignRef: string;
  campaignName: string;
  adsetRef: string;
  adsetName: string;
}

export function LinkForm({
  products,
  adsets,
}: {
  products: Array<{ id: string; title: string }>;
  adsets: AdSetOption[];
}) {
  const [state, action, pending] = useActionState(linkAdSetAction, undefined);
  const [mode, setMode] = useState<"pause_on_zero" | "pause_below_threshold">(
    "pause_on_zero",
  );
  const [selected, setSelected] = useState(
    adsets[0] ? `${adsets[0].campaignRef}|${adsets[0].adsetRef}` : "",
  );

  const selectedConnection =
    adsets.find((a) => `${a.campaignRef}|${a.adsetRef}` === selected)
      ?.connectionId ?? adsets[0]?.connectionId;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="adConnectionId" value={selectedConnection ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="productId">Tracked product</Label>
          <select
            id="productId"
            name="productId"
            className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adset">Ad set</Label>
          <select
            id="adset"
            name="adset"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
          >
            {adsets.map((a) => (
              <option
                key={a.adsetRef}
                value={`${a.campaignRef}|${a.adsetRef}`}
              >
                {a.campaignName} → {a.adsetName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="mode">Pause when</Label>
          <select
            id="mode"
            name="mode"
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as "pause_on_zero" | "pause_below_threshold")
            }
            className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
          >
            <option value="pause_on_zero">Stock hits zero</option>
            <option value="pause_below_threshold">
              Stock drops to a threshold
            </option>
          </select>
        </div>
        {mode === "pause_below_threshold" && (
          <div className="space-y-1.5">
            <Label htmlFor="threshold">Threshold</Label>
            <Input
              id="threshold"
              name="threshold"
              type="number"
              min={0}
              defaultValue={5}
            />
          </div>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <Button type="submit" disabled={pending || products.length === 0 || adsets.length === 0}>
        {pending ? "Linking…" : "Link product to ad set"}
      </Button>
    </form>
  );
}
