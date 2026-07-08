import { createHash, randomBytes } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { authTokens } from "@/db/schema";

export type AuthTokenType = "email_verify" | "password_reset" | "magic_link";

const TTL_MINUTES: Record<AuthTokenType, number> = {
  email_verify: 60 * 24,
  password_reset: 60,
  magic_link: 15,
};

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Creates a single-use token and returns the raw value (only the hash is stored). */
export async function createAuthToken(
  userId: string,
  type: AuthTokenType,
): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MINUTES[type] * 60_000);
  await db.insert(authTokens).values({
    userId,
    type,
    tokenHash: hashToken(raw),
    expiresAt,
  });
  return raw;
}

/**
 * Validates and consumes a token. Returns the owning userId, or null when the
 * token is unknown, expired, of the wrong type, or already used.
 */
export async function consumeAuthToken(
  raw: string,
  type: AuthTokenType,
): Promise<string | null> {
  const [row] = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokens.tokenHash, hashToken(raw)),
        eq(authTokens.type, type),
        isNull(authTokens.usedAt),
      ),
    )
    .returning();
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row.userId;
}
