import * as React from "react";
import { render } from "@react-email/render";
import { EmailButton, EmailShell } from "./shell";

function appUrl(path: string): string {
  return `${process.env.APP_URL ?? "http://localhost:3000"}${path}`;
}

export async function verifyEmailHtml(name: string | null, token: string) {
  const href = appUrl(`/verify?token=${token}`);
  return render(
    <EmailShell>
      <p>Hi{name ? ` ${name}` : ""},</p>
      <p>
        Welcome to Steadel. Please confirm your email address to activate your
        account.
      </p>
      <EmailButton href={href} label="Verify email" />
      <p>
        This link expires in 24 hours. If you did not create a Steadel
        account, you can safely ignore this email.
      </p>
    </EmailShell>,
  );
}

export async function passwordResetHtml(name: string | null, token: string) {
  const href = appUrl(`/reset-password?token=${token}`);
  return render(
    <EmailShell>
      <p>Hi{name ? ` ${name}` : ""},</p>
      <p>We received a request to reset your Steadel password.</p>
      <EmailButton href={href} label="Reset password" />
      <p>
        This link expires in 60 minutes. If you did not request a reset, you
        can safely ignore this email — your password is unchanged.
      </p>
    </EmailShell>,
  );
}

export async function magicLinkHtml(name: string | null, token: string) {
  const href = appUrl(`/magic?token=${token}`);
  return render(
    <EmailShell>
      <p>Hi{name ? ` ${name}` : ""},</p>
      <p>Here is your sign-in link for Steadel.</p>
      <EmailButton href={href} label="Sign in to Steadel" />
      <p>
        This link expires in 15 minutes and can be used once. If you did not
        request it, you can safely ignore this email.
      </p>
    </EmailShell>,
  );
}
