import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="font-mono text-xs tracking-widest text-amber-dark uppercase">
        Steadel
      </Link>
      <article className="doc-content mt-6">
        <h1>Privacy policy</h1>
        <p>
          <strong>TODO-LEGAL:</strong> placeholder copy — replace with
          lawyer-reviewed text before launch.
        </p>
        <h2>What we store</h2>
        <p>
          Steadel practices data minimization. We store your account
          (name, email, Argon2id-hashed password), your organization and
          store connections (API credentials encrypted with AES-256-GCM),
          product and inventory data needed for automations, alert history,
          and an audit log of sensitive actions. We store <strong>no end-customer
          personal data</strong> from your shop.
        </p>
        <h2>Where it lives</h2>
        <p>
          All data is hosted on servers in Germany (Hetzner). We use no
          third-party analytics or tracking. Payments are processed by
          Paddle as Merchant of Record; transactional email is delivered by
          an EU-region SMTP provider.
        </p>
        <h2>Your rights</h2>
        <p>
          Export all your data as JSON or delete your account (30-day full
          erasure) anytime under Settings → Account. Questions:
          privacy@steadel.com.
        </p>
        <p>
          <strong>TODO-LEGAL:</strong> controller identity, DPO contact,
          legal bases, retention table, sub-processor list.
        </p>
      </article>
    </main>
  );
}
