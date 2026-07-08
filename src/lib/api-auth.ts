import { createHash, randomBytes } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, organizations } from "@/db/schema";
import { recordAudit } from "./audit";
import { rateLimit } from "./rate-limit";

const KEY_PREFIX = "sk_steadel_";
const RATE_LIMIT_PER_MINUTE = 60; // SPEC §7

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Creates an API key; the raw value is returned exactly once. */
export async function createApiKey(params: {
  orgId: string;
  actorId: string;
  name: string;
}): Promise<{ raw: string; id: string; prefix: string }> {
  const raw = `${KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
  const prefix = raw.slice(0, KEY_PREFIX.length + 6);
  const [record] = await db
    .insert(apiKeys)
    .values({
      orgId: params.orgId,
      name: params.name,
      keyHash: hashKey(raw),
      prefix,
    })
    .returning();
  await recordAudit({
    orgId: params.orgId,
    actor: params.actorId,
    action: "api_key.created",
    payload: { keyId: record.id, name: params.name },
  });
  return { raw, id: record.id, prefix };
}

export async function revokeApiKey(params: {
  orgId: string;
  actorId: string;
  keyId: string;
}): Promise<void> {
  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, params.keyId), eq(apiKeys.orgId, params.orgId)));
  await recordAudit({
    orgId: params.orgId,
    actor: params.actorId,
    action: "api_key.revoked",
    payload: { keyId: params.keyId },
  });
}

export type ApiAuthResult =
  | { ok: true; org: typeof organizations.$inferSelect }
  | { ok: false; response: Response };

/**
 * Authenticates a public API request: Bearer key → org, Growth+ plans only,
 * 60 req/min per org (SPEC §7).
 */
export async function authenticateApiRequest(
  request: Request,
): Promise<ApiAuthResult> {
  const header = request.headers.get("authorization") ?? "";
  const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!raw.startsWith(KEY_PREFIX)) {
    return {
      ok: false,
      response: Response.json(
        { error: "Missing or malformed API key" },
        { status: 401 },
      ),
    };
  }

  const key = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.keyHash, hashKey(raw)), isNull(apiKeys.revokedAt)),
  });
  if (!key) {
    return {
      ok: false,
      response: Response.json({ error: "Invalid API key" }, { status: 401 }),
    };
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, key.orgId),
  });
  if (!org) {
    return {
      ok: false,
      response: Response.json({ error: "Invalid API key" }, { status: 401 }),
    };
  }
  if (org.plan !== "growth" && org.plan !== "agency") {
    return {
      ok: false,
      response: Response.json(
        { error: "The public API requires the Growth or Agency plan" },
        { status: 403 },
      ),
    };
  }

  const limited = await rateLimit(`api:${org.id}`, RATE_LIMIT_PER_MINUTE, 60);
  if (!limited.ok) {
    return {
      ok: false,
      response: Response.json(
        { error: "Rate limit exceeded (60 requests/minute)" },
        { status: 429, headers: { "Retry-After": "60" } },
      ),
    };
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id));

  return { ok: true, org };
}
