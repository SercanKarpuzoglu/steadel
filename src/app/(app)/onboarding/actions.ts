"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { requireOrg } from "@/lib/org";
import {
  createAutomationRule,
  defaultRecipients,
  DEFAULT_LOW_STOCK_THRESHOLD,
} from "@/lib/services/automation-service";
import { connectMockStore } from "@/lib/services/store-service";

export async function onboardingConnectMockAction(): Promise<void> {
  const { org, user } = await requireOrg();
  await connectMockStore(org.id, user.id);
  revalidatePath("/onboarding");
  redirect("/onboarding");
}

export async function onboardingTrackAllAction(
  formData: FormData,
): Promise<void> {
  const { org } = await requireOrg();
  const storeId = z.string().uuid().parse(formData.get("storeId"));
  const store = await db.query.stores.findFirst({
    where: and(eq(stores.id, storeId), eq(stores.orgId, org.id)),
  });
  if (!store) return;
  await db
    .update(products)
    .set({ tracked: true })
    .where(eq(products.storeId, store.id));
  revalidatePath("/onboarding");
  redirect("/onboarding");
}

export async function onboardingCreateAlertAction(
  formData: FormData,
): Promise<void> {
  const { org, user } = await requireOrg();
  const storeId = z.string().uuid().parse(formData.get("storeId"));
  const recipients = await defaultRecipients(org.id);
  await createAutomationRule({
    orgId: org.id,
    actorId: user.id,
    storeId,
    type: "low_stock_alert",
    config: { threshold: DEFAULT_LOW_STOCK_THRESHOLD, recipients },
  });
  revalidatePath("/onboarding");
  redirect("/onboarding");
}
