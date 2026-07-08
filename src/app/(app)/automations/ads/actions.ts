"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrg } from "@/lib/org";
import {
  connectMockMeta,
  linkProductToAdSet,
  unlinkAdSet,
} from "@/lib/services/ads-service";

export type FormState = { error?: string } | undefined;

export async function connectMockMetaAction(): Promise<void> {
  const { org, user } = await requireOrg();
  await connectMockMeta(org.id, user.id);
  revalidatePath("/automations/ads");
}

const linkSchema = z.object({
  productId: z.string().uuid(),
  adConnectionId: z.string().uuid(),
  adset: z.string().min(1), // "campaignRef|adsetRef|adsetName"
  mode: z.enum(["pause_on_zero", "pause_below_threshold"]),
  threshold: z.union([z.literal(""), z.coerce.number().int().min(0)]),
});

export async function linkAdSetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, user } = await requireOrg();
  const parsed = linkSchema.safeParse({
    productId: formData.get("productId"),
    adConnectionId: formData.get("adConnectionId"),
    adset: formData.get("adset"),
    mode: formData.get("mode"),
    threshold: String(formData.get("threshold") ?? ""),
  });
  if (!parsed.success) return { error: "Pick a product and an ad set." };

  const [campaignRef, adsetRef] = parsed.data.adset.split("|");
  if (!adsetRef) return { error: "Invalid ad set selection." };

  await linkProductToAdSet({
    orgId: org.id,
    actorId: user.id,
    productId: parsed.data.productId,
    adConnectionId: parsed.data.adConnectionId,
    externalAdsetRef: adsetRef,
    externalCampaignRef: campaignRef || undefined,
    mode: parsed.data.mode,
    thresholdQty:
      parsed.data.mode === "pause_below_threshold" &&
      parsed.data.threshold !== ""
        ? parsed.data.threshold
        : null,
  });
  revalidatePath("/automations/ads");
  return undefined;
}

export async function unlinkAdSetAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const linkId = z.string().uuid().parse(formData.get("linkId"));
  await unlinkAdSet({ orgId: org.id, actorId: user.id, linkId });
  revalidatePath("/automations/ads");
}
