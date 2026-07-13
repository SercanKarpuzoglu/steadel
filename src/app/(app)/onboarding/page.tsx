import type { Metadata } from "next";
import Link from "next/link";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { automationRules, products, stores } from "@/db/schema";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireOrg } from "@/lib/org";
import {
  onboardingConnectMockAction,
  onboardingCreateAlertAction,
  onboardingTrackAllAction,
} from "./actions";

export const metadata: Metadata = { title: "Getting started" };

export default async function OnboardingPage() {
  const { org } = await requireOrg();

  const orgStores = await db.query.stores.findMany({
    where: eq(stores.orgId, org.id),
  });
  const storeIds = orgStores.map((s) => s.id);

  const [trackedCount] = storeIds.length
    ? await db
        .select({ value: count() })
        .from(products)
        .where(
          and(inArray(products.storeId, storeIds), eq(products.tracked, true)),
        )
    : [{ value: 0 }];

  const alertRules = storeIds.length
    ? await db.query.automationRules.findMany({
        where: and(
          inArray(automationRules.storeId, storeIds),
          eq(automationRules.type, "low_stock_alert"),
        ),
      })
    : [];

  const step1Done = orgStores.length > 0;
  const step2Done = trackedCount.value > 0;
  const step3Done = alertRules.length > 0;
  const doneCount = [step1Done, step2Done, step3Done].filter(Boolean).length;
  const firstStore = orgStores[0];
  const mockEnabled =
    process.env.MOCK_STORE_PROVIDER === "1" || !process.env.SHOPIFY_API_KEY;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Welcome to Steadel</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Three steps and your stock is watched around the clock.
        </p>
        <div className="mt-4 flex items-center gap-2" aria-label={`${doneCount} of 3 steps complete`}>
          {[step1Done, step2Done, step3Done].map((done, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${done ? "bg-amber" : "bg-line"}`}
            />
          ))}
          <span className="ml-2 font-mono text-xs text-ink-soft">{doneCount}/3</span>
        </div>
      </div>

      <Card className={`rise ${step1Done ? "opacity-70" : ""}`}>
        <CardTitle>
          {step1Done ? "✓ " : "1. "}Connect your store
        </CardTitle>
        {step1Done ? (
          <CardDescription>
            {firstStore.name} ({firstStore.domain}) is connected.
          </CardDescription>
        ) : (
          <>
            <CardDescription>
              Shopify connects in one click via OAuth — we only request
              read-only access.
            </CardDescription>
            <form
              action="/api/shopify/install"
              method="GET"
              className="mt-4 flex gap-2"
            >
              <input
                name="shop"
                placeholder="my-shop.myshopify.com"
                required
                className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
              />
              <button
                type="submit"
                className="h-10 shrink-0 cursor-pointer rounded-md bg-amber px-4 text-sm font-medium text-ink hover:bg-amber-dark"
              >
                Connect
              </button>
            </form>
            {mockEnabled && (
              <form action={onboardingConnectMockAction} className="mt-3">
                <button
                  type="submit"
                  className="cursor-pointer text-sm text-amber-text hover:underline"
                >
                  …or connect a demo store to explore
                </button>
              </form>
            )}
          </>
        )}
      </Card>

      <Card className={`rise rise-1 ${!step1Done ? "opacity-50" : step2Done ? "opacity-70" : ""}`}>
        <CardTitle>
          {step2Done ? "✓ " : "2. "}Pick tracked products
        </CardTitle>
        {step2Done ? (
          <CardDescription>
            {trackedCount.value} products are tracked.
          </CardDescription>
        ) : step1Done ? (
          <>
            <CardDescription>
              Tracked products power alerts and the ads guard. Track
              everything now — you can fine-tune later.
            </CardDescription>
            <div className="mt-4 flex items-center gap-4">
              <form action={onboardingTrackAllAction}>
                <input type="hidden" name="storeId" value={firstStore.id} />
                <button
                  type="submit"
                  className="h-10 cursor-pointer rounded-md bg-amber px-4 text-sm font-medium text-ink hover:bg-amber-dark"
                >
                  Track all products
                </button>
              </form>
              <Link
                href={`/stores/${firstStore.id}`}
                className="text-sm text-ink-soft hover:text-ink hover:underline"
              >
                Choose individually
              </Link>
            </div>
          </>
        ) : (
          <CardDescription>Connect a store first.</CardDescription>
        )}
      </Card>

      <Card className={`rise rise-2 ${!step2Done ? "opacity-50" : step3Done ? "opacity-70" : ""}`}>
        <CardTitle>
          {step3Done ? "✓ " : "3. "}Set your first automation
        </CardTitle>
        {step3Done ? (
          <CardDescription>Low-stock alert is active.</CardDescription>
        ) : step2Done ? (
          <>
            <CardDescription>
              Email me when any tracked product drops to 5 or below.
            </CardDescription>
            <form action={onboardingCreateAlertAction} className="mt-4">
              <input type="hidden" name="storeId" value={firstStore?.id} />
              <button
                type="submit"
                className="h-10 cursor-pointer rounded-md bg-amber px-4 text-sm font-medium text-ink hover:bg-amber-dark"
              >
                Enable low-stock alerts
              </button>
            </form>
          </>
        ) : (
          <CardDescription>Track products first.</CardDescription>
        )}
      </Card>

      {step1Done && step2Done && step3Done && (
        <Card className="border-amber bg-amber/10">
          <CardTitle>You&apos;re all set</CardTitle>
          <CardDescription>
            Steadel is watching your inventory. Alerts land in your inbox.
          </CardDescription>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex h-10 items-center rounded-md bg-amber px-4 text-sm font-medium text-ink hover:bg-amber-dark"
          >
            Go to dashboard
          </Link>
        </Card>
      )}
    </div>
  );
}
