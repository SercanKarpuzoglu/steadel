import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { logger } from "./logger";

export function isValidSlackWebhookUrl(url: string): boolean {
  return /^https:\/\/hooks\.slack\.com\/services\/\S+$/.test(url);
}

/**
 * Posts an alert to the org's Slack incoming webhook (SPEC §5.5).
 * Returns true when delivered; failures are logged and never block email.
 */
export async function sendSlack(orgId: string, text: string): Promise<boolean> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: { slackWebhookUrl: true },
  });
  if (!org?.slackWebhookUrl) return false;
  try {
    const res = await fetch(org.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Slack responded ${res.status}`);
    return true;
  } catch (err) {
    logger.warn({ orgId, err: String(err) }, "slack delivery failed");
    return false;
  }
}
