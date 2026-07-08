import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { authenticateApiRequest } from "@/lib/api-auth";

/** GET /api/v1/products — tracked products with stock state (SPEC §7). */
export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  const orgStores = await db.query.stores.findMany({
    where: eq(stores.orgId, auth.org.id),
    columns: { id: true, name: true, domain: true, platform: true },
  });
  const storeIds = orgStores.map((s) => s.id);
  const rows = storeIds.length
    ? await db.query.products.findMany({
        where: inArray(products.storeId, storeIds),
      })
    : [];

  const storeById = new Map(orgStores.map((s) => [s.id, s]));
  return Response.json({
    data: rows
      .filter((p) => p.tracked)
      .map((p) => ({
        id: p.id,
        store: storeById.get(p.storeId)?.domain,
        title: p.title,
        sku: p.sku,
        inventory_qty: p.inventoryQty,
        threshold_qty: p.thresholdQty,
        out_of_stock: p.inventoryQty <= 0,
        updated_at: p.updatedAt.toISOString(),
      })),
  });
}
