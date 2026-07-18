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

        <h2>The short version</h2>
        <p>
          Try Steadel free for 14 days first — no card required — so you
          never have to pay to find out whether it fits. After that,
          subscriptions are monthly and can be cancelled anytime; and if we
          charged you when we shouldn&apos;t have, we refund it.
        </p>

        <h2>Cancellations</h2>
        <p>
          Cancel self-serve in Settings → Billing. Access continues to the
          end of the paid period; no further charges are made. We do not
          issue pro-rata refunds for the unused remainder of a billing
          month.
        </p>

        <h2>When we refund</h2>
        <ul>
          <li>Duplicate or accidental charges — refunded in full.</li>
          <li>
            Billing after you cancelled (our or our payment provider&apos;s
            error) — refunded in full.
          </li>
          <li>
            A technical fault on our side made the service unusable for a
            substantial part of the billing period — contact us and
            we&apos;ll make it right, up to a full refund of that period.
          </li>
        </ul>
        <p>
          Request a refund within 14 days of the charge by emailing{" "}
          <a href="mailto:support@steadel.com">support@steadel.com</a> from
          your account email. Refunds are processed by Paddle, our Merchant
          of Record, back to the original payment method (typically 5–10
          business days).
        </p>

        <h2>Statutory rights</h2>
        <p>
          Steadel is a business tool sold B2B. Nothing in this policy limits
          rights you cannot waive under mandatory law, or Paddle&apos;s own
          buyer terms shown at checkout.
        </p>

        <p>
          See also our <Link href="/terms">terms of service</Link> and{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </article>
    </main>
  );
}
