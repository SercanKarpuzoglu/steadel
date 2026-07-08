import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Captured messages for assertions in tests / dev without SMTP.
const outbox: MailMessage[] = [];

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

/** Thin wrapper around nodemailer; logs to outbox when SMTP is not configured. */
export async function sendMail(message: MailMessage): Promise<void> {
  const from = process.env.SMTP_FROM ?? "Steadel <no-reply@steadel.com>";
  const t = getTransporter();
  if (!t) {
    outbox.push(message);
    logger.info(
      { to: message.to, subject: message.subject },
      "sendMail (no SMTP configured — captured to outbox)",
    );
    return;
  }
  await t.sendMail({ from, ...message });
  logger.info({ to: message.to, subject: message.subject }, "email sent");
}

export function getOutbox(): ReadonlyArray<MailMessage> {
  return outbox;
}

export function clearOutbox(): void {
  outbox.length = 0;
}
