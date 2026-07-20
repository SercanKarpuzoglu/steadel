import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy policy" };

// TODO-LEGAL: lawyer sign-off pending. If a GDPR art. 27 EU representative
// is appointed, add their identity + contact to section 1.

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="font-mono text-xs tracking-widest text-amber-text uppercase">
        Steadel
      </Link>
      <article className="doc-content mt-6">
        <h1>Privacy policy</h1>
        <p>Last updated: 12 July 2026</p>

        <h2>1. Who we are</h2>
        <p>
          Steadel is a product of{" "}
          <strong>Parsius Bilişim Danışmanlık Arge Ticaret ve Sanayi Limited Şirketi</strong>, a
          limited liability company incorporated in Türkiye, registered at
          İvedik OSB Mah. 1371 Sk. No: 4, Yenimahalle, Ankara, Türkiye
          (&quot;we&quot;, &quot;us&quot;). We are the data controller for
          the personal data described in this policy. Contact:{" "}
          <a href="mailto:privacy@steadel.com">privacy@steadel.com</a>.
        </p>

        <h2>2. What we collect and why</h2>
        <ul>
          <li>
            <strong>Account data</strong> — name, email address, password
            (stored only as an Argon2id hash). Legal basis: performance of
            contract.
          </li>
          <li>
            <strong>Organization &amp; store connections</strong> — your
            organization name, connected store domains and the API
            credentials you authorize (encrypted at rest with AES-256-GCM).
            Legal basis: performance of contract.
          </li>
          <li>
            <strong>Catalog &amp; inventory data</strong> — product titles,
            SKUs and stock quantities synced from your store, used to run
            your automations. Legal basis: performance of contract.
          </li>
          <li>
            <strong>Alert &amp; audit logs</strong> — a history of alerts we
            sent and of sensitive account actions (store connect/disconnect,
            plan changes, exports, deletion). Legal basis: legitimate
            interest in security and troubleshooting.
          </li>
          <li>
            <strong>Billing data</strong> — subscription status and Paddle
            customer/subscription references. Payment details (card numbers,
            billing address) are collected and stored by Paddle, our
            Merchant of Record — never by us. Legal basis: performance of
            contract and legal obligation.
          </li>
          <li>
            <strong>Support correspondence</strong> — emails you send to our
            support addresses. Legal basis: legitimate interest.
          </li>
        </ul>

        <h2>3. What we deliberately do not collect</h2>
        <ul>
          <li>
            <strong>No end-customer personal data from your shop.</strong>{" "}
            We request read access to products and inventory only — not to
            your customers. Shopify GDPR webhooks (data request / redact) are
            acknowledged automatically; there is nothing for us to return or
            erase.
          </li>
          <li>
            <strong>No analytics or tracking.</strong> The app sets only the
            essential session cookie required to sign you in. No third-party
            trackers, no advertising pixels — which is also why there is no
            cookie banner.
          </li>
          <li>
            <strong>No card data.</strong> Payments run entirely on Paddle.
          </li>
        </ul>

        <h2>4. Where your data lives</h2>
        <p>
          All application data is stored on servers operated for us by
          Hetzner Online GmbH in Germany. Encrypted database backups are kept
          for 14 days. Transactional email is delivered through Brevo (EU
          processing); open/click tracking on our emails is anonymized.
        </p>

        <h2>5. Sub-processors</h2>
        <ul>
          <li>Hetzner Online GmbH (Germany) — hosting and backups</li>
          <li>Brevo SAS (France) — transactional email delivery</li>
          <li>Paddle.com Market Ltd (UK) — payments, tax and invoicing as Merchant of Record</li>
          <li>Cloudflare, Inc. — DNS and inbound email routing for steadel.com</li>
        </ul>
        <p>
          When you connect an integration (Shopify, WooCommerce, Meta), data
          flows between Steadel and that platform under your instruction;
          the platform&apos;s own terms and privacy policy apply to it.
        </p>

        <h2>6. Retention</h2>
        <ul>
          <li>Account and organization data — for the life of the account.</li>
          <li>
            After account deletion — deactivated immediately, permanently
            erased within 30 days (backups roll off within a further 14
            days).
          </li>
          <li>Alert and audit logs — for the life of the account.</li>
          <li>
            Invoices and tax records — retained by Paddle for statutory
            periods.
          </li>
        </ul>

        <h2>7. Your rights</h2>
        <p>
          Under the GDPR you may access, rectify, export, erase, restrict or
          object to the processing of your personal data. The two most
          common requests are self-serve: <strong>Settings → Account →
          Export my data</strong> (JSON) and <strong>Delete account</strong>{" "}
          (immediate deactivation, full erasure within 30 days). For
          anything else email{" "}
          <a href="mailto:privacy@steadel.com">privacy@steadel.com</a> — we
          answer within 30 days. You may also lodge a complaint with your
          local supervisory authority.
        </p>

        <h2>8. Security</h2>
        <p>
          Third-party credentials are encrypted at rest (AES-256-GCM),
          passwords are hashed with Argon2id, all traffic uses TLS,
          authentication endpoints are rate-limited, and sensitive actions
          are recorded in an audit log.
        </p>

        <h2>9. Changes</h2>
        <p>
          If we make material changes to this policy we will notify you by
          email at least 14 days before they take effect.
        </p>
      </article>
    </main>
  );
}
