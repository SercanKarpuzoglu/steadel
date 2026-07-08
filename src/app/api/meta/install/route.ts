import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireOrg } from "@/lib/org";
import { buildMetaAuthUrl } from "@/providers/ads/meta";
import { adsGuardEnabled } from "@/providers/ads/types";

export async function GET() {
  await requireOrg();

  if (!adsGuardEnabled() || !process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    redirect("/automations/ads?error=meta-not-configured");
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  redirect(buildMetaAuthUrl(state));
}
