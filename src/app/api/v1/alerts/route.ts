import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { alertsLog } from "@/db/schema";
import { authenticateApiRequest } from "@/lib/api-auth";

/** GET /api/v1/alerts — alert log, newest first (SPEC §7). */
export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);

  const rows = await db.query.alertsLog.findMany({
    where: type
      ? and(eq(alertsLog.orgId, auth.org.id), eq(alertsLog.type, type))
      : eq(alertsLog.orgId, auth.org.id),
    orderBy: [desc(alertsLog.createdAt)],
    limit,
  });

  return Response.json({
    data: rows.map((a) => ({
      id: a.id,
      type: a.type,
      store_id: a.storeId,
      payload: a.payload,
      delivered_via: a.deliveredVia,
      created_at: a.createdAt.toISOString(),
    })),
  });
}
