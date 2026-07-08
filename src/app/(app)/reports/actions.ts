"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { requireOrg } from "@/lib/org";
import { PlanLimitError } from "@/lib/plans";
import {
  createAutomationRule,
  defaultRecipients,
} from "@/lib/services/automation-service";

/** "Email me this weekly" — creates a weekly report rule (Mon 07:00 UTC). */
export async function emailWeeklyAction(): Promise<void> {
  const { org, user } = await requireOrg();
  const firstStore = await db.query.stores.findFirst({
    where: eq(stores.orgId, org.id),
  });
  if (!firstStore) redirect("/stores");

  const recipients = await defaultRecipients(org.id);
  try {
    await createAutomationRule({
      orgId: org.id,
      actorId: user.id,
      storeId: firstStore.id,
      type: "scheduled_report",
      config: { frequency: "weekly", hour: 7, weekday: 1, recipients },
    });
  } catch (err) {
    if (err instanceof PlanLimitError) redirect("/settings/billing");
    throw err;
  }
  revalidatePath("/reports");
  redirect("/reports");
}
