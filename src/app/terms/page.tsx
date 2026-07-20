import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of service" };

// TODO-LEGAL: lawyer sign-off pending (entity, governing law and address
// are filled; review of liability wording still open).

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="font-mono text-xs tracking-widest text-amber-text uppercase">
        Steadel
      </Link>
      <article className="doc-content mt-6">
        <h1>Terms of service</h1>
        <p>Last updated: 12 July 2026</p>

        <h2>1. Agreement</h2>
        <p>
          These terms are a contract between you and{" "}
          <strong>Parsius Bilişim Danışmanlık Arge Ticaret ve Sanayi Limited Şirketi</strong>,
          a limited liability company incorporated in Türkiye, registered at
          İvedik OSB Mah. 1371 Sk. No: 4, Yenimahalle, Ankara, Türkiye
          (&quot;Steadel&quot;, &quot;we&quot;). Steadel is a product and
          brand of Parsius. By creating an account you accept these terms.
          Steadel is a business tool; you confirm you are acting in the
          course of a trade or business, not as a consumer.
        </p>

        <h2>2. The service</h2>
        <p>
          Steadel provides stock-aware operations automation for e-commerce
          stores: pausing and resuming connected ad campaigns based on
          inventory, low-stock alerts, and scheduled reports. Features vary
          by plan as described on the billing page.
        </p>

        <h2>3. Accounts</h2>
        <p>
          Keep your credentials confidential and your account information
          accurate. You are responsible for activity under your account.
          You must be authorized to connect the stores and ad accounts you
          connect.
        </p>

        <h2>4. Trial, subscriptions and billing</h2>
        <ul>
          <li>New organizations receive a 14-day free trial; no payment details required.</li>
          <li>
            Paid subscriptions are sold and billed by{" "}
            <strong>Paddle.com Market Ltd</strong> as Merchant of Record.
            Paddle handles payment processing, VAT/sales tax and invoicing;
            Paddle&apos;s checkout terms apply to the purchase itself.
          </li>
          <li>
            Plans renew monthly until cancelled. You can cancel anytime in
            Settings → Billing; access continues to the end of the paid
            period. Upgrades take effect immediately with prorated charges
            handled by Paddle.
          </li>
          <li>
            If a subscription lapses or the trial ends without payment, the
            service is suspended (data retained per our privacy policy) —
            automations stop running.
          </li>
        </ul>

        <h2>5. Acceptable use</h2>
        <p>
          You may not: use the service unlawfully; attempt to breach its
          security or access other customers&apos; data; resell it without a
          written agreement; reverse-engineer it except where law permits;
          or exceed documented API rate limits by circumvention.
        </p>

        <h2>6. Third-party platforms</h2>
        <p>
          Steadel connects to platforms we do not control (Shopify,
          WooCommerce, Meta). Their terms apply to your use of them. We are
          not responsible for their outages, API changes, or decisions
          (e.g. ad account restrictions), though we make reasonable efforts
          to adapt to platform changes promptly.
        </p>

        <h2>7. Automations — important disclaimer</h2>
        <p>
          Automations act on the inventory data your store platform reports
          to us, which may be delayed or inaccurate at the source. Steadel
          may pause or resume ad sets on your explicit configuration, but{" "}
          <strong>you retain full responsibility for your advertising
          spend, campaigns and inventory decisions</strong>. We never resume
          a campaign that Steadel itself did not pause.
        </p>

        <h2>8. Availability and support</h2>
        <p>
          We operate the service with reasonable skill and care but do not
          promise a specific uptime level (no SLA on current plans).
          Planned maintenance is announced in advance where practical.
          Support is provided in writing via{" "}
          <a href="mailto:support@steadel.com">support@steadel.com</a>; we
          aim to respond within one business day.
        </p>

        <h2>9. Your data and our IP</h2>
        <p>
          Your data remains yours; you grant us the license needed to
          process it to provide the service (see the{" "}
          <Link href="/privacy">privacy policy</Link>). The Steadel
          software, brand and content remain ours.
        </p>

        <h2>10. Liability</h2>
        <p>
          To the extent permitted by law: we are not liable for indirect or
          consequential damages (including lost profits, lost ad spend or
          lost revenue), and our total liability under these terms is
          capped at the fees you paid in the 12 months before the claim.
          Nothing limits liability that cannot be limited by law (e.g.
          intent or gross negligence).
        </p>

        <h2>11. Termination</h2>
        <p>
          You may delete your account anytime (Settings → Account). We may
          suspend or terminate accounts for material breach of these terms
          with notice, or immediately for abuse or security risk. On
          termination you can export your data for 30 days before erasure.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update these terms; material changes are announced by
          email at least 30 days in advance. Continued use after the
          effective date constitutes acceptance.
        </p>

        <h2>13. Governing law</h2>
        <p>
          These terms are governed by the laws of the Republic of Türkiye,
          and disputes are subject to the exclusive jurisdiction of the
          courts and enforcement offices of Ankara, Türkiye, without
          prejudice to mandatory local law.
        </p>

        <h2>14. Contact</h2>
        <p>
          Parsius Bilişim Danışmanlık Arge Ticaret ve Sanayi Limited Şirketi · İvedik OSB
          Mah. 1371 Sk. No: 4, Yenimahalle, Ankara, Türkiye ·{" "}
          <a href="mailto:support@steadel.com">support@steadel.com</a>
        </p>
      </article>
    </main>
  );
}
