import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies a Paddle Billing webhook signature.
 * Header format: "ts=<unix>;h1=<hex>", signed payload = `${ts}:${rawBody}`.
 */
export function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = 300,
  now: Date = new Date(),
): boolean {
  if (!signatureHeader || !secret) return false;
  const parts = new Map<string, string>();
  for (const piece of signatureHeader.split(";")) {
    const [key, value] = piece.split("=", 2);
    if (key && value) parts.set(key.trim(), value.trim());
  }
  const ts = parts.get("ts");
  const h1 = parts.get("h1");
  if (!ts || !h1) return false;

  const age = Math.abs(now.getTime() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;

  const digest = createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(h1);
  return a.length === b.length && timingSafeEqual(a, b);
}

const PADDLE_API = {
  sandbox: "https://sandbox-api.paddle.com",
  production: "https://api.paddle.com",
};

function apiBase(): string {
  return process.env.PADDLE_ENV === "production"
    ? PADDLE_API.production
    : PADDLE_API.sandbox;
}

async function paddleFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const json = (await res.json()) as T & { error?: { detail?: string } };
  if (!res.ok) {
    throw new Error(`Paddle API ${res.status}: ${json.error?.detail ?? path}`);
  }
  return json;
}

export interface PaddleTransaction {
  id: string;
  status: string;
  billed_at: string | null;
  details?: { totals?: { grand_total?: string; currency_code?: string } };
  invoice_number?: string | null;
}

/** Billed transactions for the invoices list on the billing screen. */
export async function listTransactions(
  customerId: string,
): Promise<PaddleTransaction[]> {
  const res = await paddleFetch<{ data: PaddleTransaction[] }>(
    `/transactions?customer_id=${encodeURIComponent(customerId)}&status=billed,completed&per_page=20`,
  );
  return res.data;
}

/** Hosted invoice PDF url for a transaction. */
export async function getInvoiceUrl(transactionId: string): Promise<string | null> {
  try {
    const res = await paddleFetch<{ data: { url: string } }>(
      `/transactions/${transactionId}/invoice`,
    );
    return res.data.url;
  } catch {
    return null;
  }
}

/** Switches an active subscription to a different price (prorated immediately). */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  priceId: string,
): Promise<void> {
  await paddleFetch(`/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      items: [{ price_id: priceId, quantity: 1 }],
      proration_billing_mode: "prorated_immediately",
    }),
  });
}

/** Cancels at the end of the current billing period. */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await paddleFetch(`/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ effective_from: "next_billing_period" }),
  });
}
