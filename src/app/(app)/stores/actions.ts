"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { requireOrg } from "@/lib/org";
import { assertCanAddStore, PlanLimitError } from "@/lib/plans";
import {
  connectMockStore,
  connectWooStore,
  disconnectStore,
  syncStoreProducts,
} from "@/lib/services/store-service";
import {
  normalizeSiteUrl,
  validateWooCredentials,
} from "@/providers/stores/woocommerce";

export type FormState = { error?: string; message?: string } | undefined;

/** Store lookup scoped to the caller's org — never trust client-provided org ids. */
async function requireStoreInOrg(storeId: string) {
  const { org, user } = await requireOrg();
  const store = await db.query.stores.findFirst({
    where: and(eq(stores.id, storeId), eq(stores.orgId, org.id)),
  });
  if (!store) throw new Error("Store not found");
  return { store, org, user };
}

async function requireProductInOrg(productId: string) {
  const { org, user } = await requireOrg();
  const rows = await db
    .select({ product: products, store: stores })
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(and(eq(products.id, productId), eq(stores.orgId, org.id)))
    .limit(1);
  if (!rows[0]) throw new Error("Product not found");
  return { ...rows[0], org, user };
}

export async function connectMockStoreAction(): Promise<void> {
  const { org, user } = await requireOrg();
  try {
    await assertCanAddStore(org);
  } catch (err) {
    if (err instanceof PlanLimitError) redirect("/stores?error=plan-limit");
    throw err;
  }
  const store = await connectMockStore(org.id, user.id);
  redirect(`/stores/${store.id}`);
}

export async function connectWooStoreAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, user } = await requireOrg();
  try {
    await assertCanAddStore(org);
  } catch (err) {
    if (err instanceof PlanLimitError) return { error: err.message };
    throw err;
  }

  const siteUrl = normalizeSiteUrl(String(formData.get("siteUrl") ?? ""));
  const consumerKey = String(formData.get("consumerKey") ?? "").trim();
  const consumerSecret = String(formData.get("consumerSecret") ?? "").trim();
  if (!siteUrl) return { error: "Enter a valid https:// site URL." };
  if (!consumerKey.startsWith("ck_") || !consumerSecret.startsWith("cs_")) {
    return {
      error:
        "Keys look wrong — the consumer key starts with ck_, the secret with cs_.",
    };
  }

  const check = await validateWooCredentials({ siteUrl, consumerKey, consumerSecret });
  if (!check.ok) return { error: check.error };

  const store = await connectWooStore({
    orgId: org.id,
    actorId: user.id,
    siteUrl,
    consumerKey,
    consumerSecret,
  });
  redirect(`/stores/${store.id}`);
}

export async function syncNowAction(formData: FormData): Promise<void> {
  const storeId = z.string().uuid().parse(formData.get("storeId"));
  const { store } = await requireStoreInOrg(storeId);
  try {
    await syncStoreProducts(store.id);
  } catch {
    // status flips to "error"; the page surfaces it
  }
  revalidatePath(`/stores/${store.id}`);
  revalidatePath("/stores");
}

export async function disconnectStoreAction(formData: FormData): Promise<void> {
  const storeId = z.string().uuid().parse(formData.get("storeId"));
  const { store, org, user } = await requireStoreInOrg(storeId);
  await disconnectStore(store.id, org.id, user.id);
  revalidatePath("/stores");
  redirect("/stores");
}

export async function toggleTrackedAction(formData: FormData): Promise<void> {
  const productId = z.string().uuid().parse(formData.get("productId"));
  const { product, store } = await requireProductInOrg(productId);
  await db
    .update(products)
    .set({ tracked: !product.tracked })
    .where(eq(products.id, product.id));
  revalidatePath(`/stores/${store.id}`);
}

export async function setThresholdAction(formData: FormData): Promise<void> {
  const productId = z.string().uuid().parse(formData.get("productId"));
  const raw = String(formData.get("threshold") ?? "").trim();
  const threshold =
    raw === "" ? null : z.coerce.number().int().min(0).max(1_000_000).parse(raw);
  const { product, store } = await requireProductInOrg(productId);
  await db
    .update(products)
    .set({ thresholdQty: threshold })
    .where(eq(products.id, product.id));
  revalidatePath(`/stores/${store.id}`);
}

export async function trackAllAction(formData: FormData): Promise<void> {
  const storeId = z.string().uuid().parse(formData.get("storeId"));
  const tracked = formData.get("tracked") === "true";
  const { store } = await requireStoreInOrg(storeId);
  await db
    .update(products)
    .set({ tracked })
    .where(eq(products.storeId, store.id));
  revalidatePath(`/stores/${store.id}`);
}
