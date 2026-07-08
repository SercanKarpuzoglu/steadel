import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="font-mono text-xs tracking-widest text-amber-dark uppercase">
        Steadel
      </Link>
      <article className="doc-content mt-6">
        <h1>Terms of service</h1>
        <p>
          <strong>TODO-LEGAL:</strong> placeholder copy — replace with
          lawyer-reviewed text before launch.
        </p>
        <h2>The service</h2>
        <p>
          Steadel provides stock-aware operations automation for e-commerce
          stores: ads pausing/resuming, low-stock alerts and scheduled
          reports. Subscriptions are billed by Paddle as Merchant of Record
          with a 14-day free trial.
        </p>
        <h2>Fair use & limitations</h2>
        <p>
          Automations act on the data your store platform reports; you keep
          responsibility for your ad spend and inventory decisions. Support
          is provided in writing (email) only.
        </p>
        <p>
          <strong>TODO-LEGAL:</strong> liability caps, governing law,
          termination, SLA wording.
        </p>
      </article>
    </main>
  );
}
