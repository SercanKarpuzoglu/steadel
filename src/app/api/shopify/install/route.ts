import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { requireOrg } from "@/lib/org";
import { assertCanAddStore, PlanLimitError } from "@/lib/plans";
import {
  buildAuthorizeUrl,
  isValidShopDomain,
} from "@/providers/stores/shopify-auth";

export async function GET(request: Request) {
  const { org } = await requireOrg();

  const shop = new URL(request.url).searchParams.get("shop")?.trim() ?? "";
  if (!isValidShopDomain(shop)) {
    redirect("/stores?error=invalid-domain");
  }
  if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
    redirect("/stores?error=shopify-not-configured");
  }

  // Reconnecting an existing store is always allowed; new stores count
  // against the plan limit.
  const existing = await db.query.stores.findFirst({
    where: and(eq(stores.orgId, org.id), eq(stores.domain, shop)),
  });
  if (!existing) {
    try {
      await assertCanAddStore(org);
    } catch (err) {
      if (err instanceof PlanLimitError) redirect("/stores?error=plan-limit");
      throw err;
    }
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("shopify_oauth", JSON.stringify({ state, shop }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  redirect(
    buildAuthorizeUrl({
      shop,
      apiKey: process.env.SHOPIFY_API_KEY,
      redirectUri: `${process.env.APP_URL}/api/shopify/callback`,
      state,
    }),
  );
}
