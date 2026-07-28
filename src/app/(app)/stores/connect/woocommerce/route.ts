import { redirect } from "next/navigation";
import { requireOrg } from "@/lib/org";
import { assertCanAddStore, PlanLimitError } from "@/lib/plans";
import { normalizeSiteUrl } from "@/providers/stores/woocommerce";
import { buildWooAuthorizeUrl, createWooConnect } from "@/lib/services/woo-connect-service";

/**
 * Kick off the one-click WooCommerce connect. Requires a logged-in org, then
 * redirects the merchant to their store's wc-auth approval screen. Woo posts
 * the generated keys back to /api/woo/callback.
 */
export async function GET(request: Request) {
  const { org, user } = await requireOrg();

  const site = normalizeSiteUrl(new URL(request.url).searchParams.get("site") ?? "");
  if (!site) redirect("/stores?error=woo-url");

  try {
    await assertCanAddStore(org);
  } catch (err) {
    if (err instanceof PlanLimitError) redirect("/stores?error=plan-limit");
    throw err;
  }

  const token = await createWooConnect({ orgId: org.id, actorId: user.id, siteUrl: site });
  redirect(buildWooAuthorizeUrl(site, token));
}
