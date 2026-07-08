import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adConnections } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { encryptJson } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { requireOrg } from "@/lib/org";
import { exchangeMetaCode, fetchFirstAdAccount } from "@/providers/ads/meta";

export async function GET(request: Request) {
  const { user, org } = await requireOrg();

  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";

  const cookieStore = await cookies();
  const expected = cookieStore.get("meta_oauth_state")?.value;
  cookieStore.delete("meta_oauth_state");

  if (!code || !expected || expected !== state) {
    redirect("/automations/ads?error=meta-oauth-failed");
  }

  try {
    const credentials = await exchangeMetaCode(code);
    const accountRef = await fetchFirstAdAccount(credentials);
    if (!accountRef) {
      redirect("/automations/ads?error=no-ad-account");
    }

    await db.insert(adConnections).values({
      orgId: org.id,
      provider: "meta",
      status: "connected",
      accountRef,
      credentialsEncrypted: encryptJson(credentials),
    });
    await recordAudit({
      orgId: org.id,
      actor: user.id,
      action: "ads.connected",
      payload: { accountRef },
    });
  } catch (err) {
    logger.error({ err: String(err) }, "meta oauth callback failed");
    redirect("/automations/ads?error=meta-oauth-failed");
  }

  redirect("/automations/ads");
}
