import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireOrg } from "@/lib/org";
import {
  buildAuthorizeUrl,
  isValidShopDomain,
} from "@/providers/stores/shopify-auth";

export async function GET(request: Request) {
  await requireOrg(); // session required; org resolved again in the callback

  const shop = new URL(request.url).searchParams.get("shop")?.trim() ?? "";
  if (!isValidShopDomain(shop)) {
    redirect("/stores?error=invalid-domain");
  }
  if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
    redirect("/stores?error=shopify-not-configured");
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
