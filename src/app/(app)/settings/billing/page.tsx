import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireOrg } from "@/lib/org";
import { getInvoiceUrl, listTransactions, type PaddleTransaction } from "@/lib/paddle";
import {
  billingEnabled,
  getOrgUsage,
  isTrialExpired,
  PLAN_LIMITS,
  priceIdForPlan,
  type Plan,
} from "@/lib/plans";
import { CheckoutButton } from "./_components/checkout-button";
import {
  CancelSubscriptionForm,
  ChangePlanButton,
} from "./_components/manage-forms";
import { devSetPlanAction } from "./actions";

export const metadata: Metadata = { title: "Billing" };

const SELECTABLE: Plan[] = ["starter", "growth", "agency"];

const FEATURES: Record<Plan, string[]> = {
  trial: [],
  starter: ["1 store", "3 automations", "Email alerts & reports"],
  growth: ["3 stores", "Unlimited automations", "Public API access"],
  agency: ["10 stores", "Unlimited automations", "White-label reports"],
};

export default async function BillingPage() {
  const { user, org, role } = await requireOrg();
  const usage = await getOrgUsage(org.id);
  const limits = PLAN_LIMITS[org.plan];
  const enabled = billingEnabled();
  const hasSubscription =
    !!org.paddleSubscriptionId && org.subscriptionStatus !== "canceled";

  let invoices: Array<PaddleTransaction & { invoiceUrl: string | null }> = [];
  if (enabled && org.paddleCustomerId) {
    try {
      const transactions = await listTransactions(org.paddleCustomerId);
      invoices = await Promise.all(
        transactions.map(async (t) => ({
          ...t,
          invoiceUrl: await getInvoiceUrl(t.id),
        })),
      );
    } catch {
      invoices = [];
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold">Billing</h1>
        <nav className="flex gap-4 text-sm text-ink-soft">
          <Link href="/settings/organization" className="hover:text-ink">
            Organization
          </Link>
          <Link href="/settings/account" className="hover:text-ink">
            Account
          </Link>
        </nav>
      </div>

      {!enabled && (
        <p className="rounded-md border border-line bg-paper-soft px-4 py-3 text-sm text-ink-soft">
          Billing is <strong>disabled</strong> in this environment (dev mode).
          Plan switches below take effect immediately without payment.
        </p>
      )}

      <Card>
        <CardTitle>Current plan</CardTitle>
        <CardDescription>
          <span className="font-mono uppercase">{limits.label}</span>
          {limits.priceEur > 0 && <> · €{limits.priceEur}/mo</>}
          {org.plan === "trial" && org.trialEndsAt && (
            <>
              {" "}
              ·{" "}
              {isTrialExpired(org)
                ? "trial ended"
                : `trial ends ${org.trialEndsAt.toLocaleDateString("en-GB")}`}
            </>
          )}
          {org.subscriptionStatus && enabled && (
            <> · status <span className="font-mono">{org.subscriptionStatus}</span></>
          )}
        </CardDescription>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-mono text-xs tracking-wide text-ink-soft uppercase">
              Stores
            </p>
            <p className="mt-1 text-xl font-semibold">
              {usage.stores} <span className="text-sm font-normal text-ink-soft">/ {limits.stores}</span>
            </p>
          </div>
          <div>
            <p className="font-mono text-xs tracking-wide text-ink-soft uppercase">
              Automations
            </p>
            <p className="mt-1 text-xl font-semibold">
              {usage.automations}{" "}
              <span className="text-sm font-normal text-ink-soft">
                / {limits.automations ?? "∞"}
              </span>
            </p>
          </div>
        </div>
        {hasSubscription && role === "owner" && (
          <div className="mt-6">
            <CancelSubscriptionForm />
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {SELECTABLE.map((plan) => {
          const p = PLAN_LIMITS[plan];
          const isCurrent = org.plan === plan;
          const priceId = priceIdForPlan(plan);
          return (
            <Card
              key={plan}
              className={isCurrent ? "border-amber" : undefined}
            >
              <CardTitle>{p.label}</CardTitle>
              <p className="mt-1 text-2xl font-semibold">
                €{p.priceEur}
                <span className="text-sm font-normal text-ink-soft">/mo</span>
              </p>
              <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                {FEATURES[plan].map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <p className="text-center font-mono text-xs tracking-wide text-amber-dark uppercase">
                    Current plan
                  </p>
                ) : !enabled ? (
                  role === "owner" && (
                    <form action={devSetPlanAction}>
                      <input type="hidden" name="plan" value={plan} />
                      <button
                        type="submit"
                        className="h-10 w-full cursor-pointer rounded-md border border-line bg-white/60 text-sm font-medium hover:bg-white"
                      >
                        Switch (dev)
                      </button>
                    </form>
                  )
                ) : hasSubscription ? (
                  role === "owner" && (
                    <ChangePlanButton plan={plan} label={`Switch to ${p.label}`} />
                  )
                ) : priceId && process.env.PADDLE_CLIENT_TOKEN ? (
                  <CheckoutButton
                    priceId={priceId}
                    orgId={org.id}
                    email={user.email}
                    clientToken={process.env.PADDLE_CLIENT_TOKEN}
                    sandbox={process.env.PADDLE_ENV !== "production"}
                    label={`Choose ${p.label}`}
                  />
                ) : (
                  <p className="text-xs text-ink-soft">
                    Price not configured yet.
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {enabled && (
        <Card>
          <CardTitle>Invoices</CardTitle>
          {invoices.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No invoices yet.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-xs tracking-wide text-ink-soft uppercase">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoices.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-4">
                      {t.billed_at
                        ? new Date(t.billed_at).toLocaleDateString("en-GB")
                        : "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      {t.details?.totals?.grand_total ?? "—"}{" "}
                      {t.details?.totals?.currency_code ?? ""}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{t.status}</td>
                    <td className="py-2.5">
                      {t.invoiceUrl ? (
                        <a
                          href={t.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-dark hover:underline"
                        >
                          PDF
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <p className="text-xs text-ink-soft">
        Payments are processed by Paddle (Merchant of Record) — they handle EU
        VAT and invoicing. Steadel never sees or stores card data.
      </p>
    </div>
  );
}
