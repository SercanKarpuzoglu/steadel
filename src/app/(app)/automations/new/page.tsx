import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { Card, CardTitle } from "@/components/ui/card";
import { requireOrg } from "@/lib/org";
import { defaultRecipients } from "@/lib/services/automation-service";
import { RuleForm } from "../_components/rule-form";

export const metadata: Metadata = { title: "New automation" };

export default async function NewAutomationPage() {
  const { org } = await requireOrg();
  const orgStores = await db.query.stores.findMany({
    where: eq(stores.orgId, org.id),
    columns: { id: true, name: true },
  });
  const recipients = await defaultRecipients(org.id);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-semibold">New automation</h1>
      <Card>
        <CardTitle>Configure</CardTitle>
        <div className="mt-4">
          <RuleForm
            stores={orgStores}
            defaults={{
              type: "low_stock_alert",
              recipients: recipients.join(", "),
            }}
          />
        </div>
      </Card>
    </div>
  );
}
