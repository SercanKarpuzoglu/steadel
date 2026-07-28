import * as React from "react";
import { render } from "@react-email/render";
import { EmailButton, EmailShell } from "./shell";

function appUrl(path: string): string {
  return `${process.env.APP_URL ?? "http://localhost:3000"}${path}`;
}

const sig = (
  <p style={{ marginTop: 24, color: "#47576e" }}>
    — The Steadel team
    <br />
    Hosted in Germany · GDPR-first · reply any time, a human reads it.
  </p>
);

export async function welcomeHtml(name: string | null) {
  return render(
    <EmailShell>
      <p>Hi{name ? ` ${name}` : ""},</p>
      <p>
        Welcome to Steadel. We watch your inventory and warn you <em>before</em> a
        product runs out — so a bestseller never sells out on you quietly.
      </p>
      <p>
        The first step is to connect your store. It takes a minute and only needs
        read-only access to your products and inventory.
      </p>
      <EmailButton href={appUrl("/stores")} label="Connect your store" />
      <p>Your data stays in the EU, hosted in Germany. No tracking, no upsells.</p>
      {sig}
    </EmailShell>,
  );
}

export async function connectStoreHtml(name: string | null) {
  return render(
    <EmailShell>
      <p>Hi{name ? ` ${name}` : ""},</p>
      <p>
        You started a Steadel trial, but there&rsquo;s no store connected yet —
        and Steadel can&rsquo;t watch stock it can&rsquo;t see.
      </p>
      <p>
        Connecting Shopify or WooCommerce takes about a minute (read-only), and
        from then on you&rsquo;ll get a heads-up before anything runs out.
      </p>
      <EmailButton href={appUrl("/stores")} label="Connect your store" />
      {sig}
    </EmailShell>,
  );
}

export async function protectedHtml(name: string | null) {
  return render(
    <EmailShell>
      <p>Hi{name ? ` ${name}` : ""},</p>
      <p>
        You&rsquo;re covered. Steadel is now watching your inventory and will
        alert you before your tracked products run low.
      </p>
      <p>
        From your dashboard you can fine-tune thresholds and set up scheduled
        reports, so the important numbers come to you.
      </p>
      <EmailButton href={appUrl("/dashboard")} label="Open your dashboard" />
      {sig}
    </EmailShell>,
  );
}

export async function trialEndingHtml(name: string | null, daysLeft: number) {
  const d = Math.max(1, daysLeft);
  return render(
    <EmailShell>
      <p>Hi{name ? ` ${name}` : ""},</p>
      <p>
        Your Steadel trial ends in {d} day{d === 1 ? "" : "s"}. To keep your
        low-stock alerts and reports running, pick a plan when you&rsquo;re ready.
      </p>
      <p>
        Flat pricing from €29/month — never a cut of your ad spend — and you can
        cancel any time. Your setup stays exactly as it is; the automations just
        keep going.
      </p>
      <EmailButton href={appUrl("/settings/billing")} label="Choose a plan" />
      {sig}
    </EmailShell>,
  );
}

export async function winBackHtml(name: string | null) {
  return render(
    <EmailShell>
      <p>Hi{name ? ` ${name}` : ""},</p>
      <p>
        Your Steadel trial has ended, so your automations are paused for now.
      </p>
      <p>
        If catching low stock before it costs you a sale is still on your list,
        you can reactivate any time — your stores and settings are right where you
        left them.
      </p>
      <EmailButton href={appUrl("/settings/billing")} label="Reactivate Steadel" />
      {sig}
    </EmailShell>,
  );
}
