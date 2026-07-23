import * as React from "react";
import type { CSSProperties, ReactNode } from "react";

const styles: Record<string, CSSProperties> = {
  body: {
    backgroundColor: "#f8e7c9",
    margin: 0,
    padding: "32px 16px",
    fontFamily: "Georgia, 'Times New Roman', serif",
    color: "#064e3b",
  },
  card: {
    maxWidth: 520,
    margin: "0 auto",
    backgroundColor: "#ffffff",
    border: "1px solid #e6d4ae",
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#064e3b",
    padding: "20px 32px",
    color: "#f8e7c9",
    fontSize: 18,
    letterSpacing: 2,
  },
  content: { padding: "28px 32px", fontSize: 15, lineHeight: 1.6 },
  footer: {
    padding: "16px 32px",
    fontSize: 12,
    color: "#3f6053",
    borderTop: "1px solid #e6d4ae",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#064e3b",
    color: "#f8e7c9",
    padding: "12px 24px",
    borderRadius: 6,
    textDecoration: "none",
    fontWeight: 600,
  },
};

export function EmailShell({
  children,
  brandName = "Steadel",
}: {
  children: ReactNode;
  brandName?: string;
}) {
  return (
    <html lang="en">
      <body style={styles.body}>
        <div style={styles.card}>
          <div style={styles.header}>{brandName.toUpperCase()}</div>
          <div style={styles.content}>{children}</div>
          <div style={styles.footer}>
            {brandName} — steady operations for your store. EU-hosted.
            <br />
            Questions? Reply to this email.
          </div>
        </div>
      </body>
    </html>
  );
}

export function EmailButton({ href, label }: { href: string; label: string }) {
  return (
    <p style={{ margin: "24px 0" }}>
      <a href={href} style={styles.button}>
        {label}
      </a>
    </p>
  );
}
