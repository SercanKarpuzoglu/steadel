import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Refund policy" };

export default function RefundsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="font-mono text-xs tracking-widest text-amber-text uppercase">
        Steadel
      </Link>
      <article className="doc-content mt-6">
        <h1>Refund policy</h1>
        <p>Last updated: 18 July 2026</p>

        <h2>How refunds work</h2>
        <p>
          All Steadel purchases are processed by{" "}
          <strong>Paddle.com Market Ltd</strong>, our Merchant of Record.
          Refunds are handled in line with{" "}
          <a href="https://www.paddle.com/legal/invoiced-consumer-terms">
            Paddle&apos;s refund policy
          </a>
          .
        </p>
        <p>
          You can request a full refund within <strong>14 days of
          purchase</strong> — email{" "}
          <a href="mailto:support@steadel.com">support@steadel.com</a> from
          your account email, or use the link on your Paddle receipt.
          Refunds are returned to the original payment method, typically
          within 5–10 business days.
        </p>

        <h2>Cancellations</h2>
        <p>
          You can cancel your subscription at any time, self-serve, in
          Settings → Billing. Access continues to the end of the paid
          period and no further charges are made. And before any of this
          matters: every plan starts with a 14-day free trial, no card
          required.
        </p>

        <h2>Statutory rights</h2>
        <p>
          Nothing in this policy limits rights you hold under mandatory
          law, or the terms Paddle presents at checkout.
        </p>

        <p>
          See also our <Link href="/terms">terms of service</Link> and{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </article>
    </main>
  );
}
