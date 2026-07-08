import { render } from "@react-email/render";
import { EmailButton, EmailShell } from "./shell";

function appUrl(path: string): string {
  return `${process.env.APP_URL ?? "http://localhost:3000"}${path}`;
}

export async function lowStockHtml(params: {
  storeName: string;
  productTitle: string;
  sku: string | null;
  qty: number;
  threshold: number;
  brandName?: string;
}) {
  const { storeName, productTitle, sku, qty, threshold, brandName } = params;
  const out = qty <= 0;
  return render(
    <EmailShell brandName={brandName ?? "Steadel"}>
      <p>
        <strong>{productTitle}</strong>
        {sku ? ` (SKU ${sku})` : ""} in {storeName} is{" "}
        {out ? (
          <strong>out of stock</strong>
        ) : (
          <>
            low on stock: <strong>{qty} left</strong> (threshold {threshold})
          </>
        )}
        .
      </p>
      <EmailButton href={appUrl("/stores")} label="View inventory" />
      <p>
        You receive this because a low-stock automation is enabled for this
        store. Manage automations in your Steadel dashboard.
      </p>
    </EmailShell>,
  );
}

export interface ReportData {
  storeName: string;
  periodLabel: string;
  totalProducts: number;
  trackedProducts: number;
  outOfStock: Array<{ title: string; sku: string | null }>;
  lowStock: Array<{ title: string; sku: string | null; qty: number }>;
  alertCount: number;
  adsPaused: number;
}

export async function reportHtml(data: ReportData, brandName?: string) {
  const cell: React.CSSProperties = {
    padding: "6px 12px",
    borderBottom: "1px solid #ddd5c4",
    textAlign: "left",
  };
  return render(
    <EmailShell brandName={brandName ?? "Steadel"}>
      <p>
        Here is your {data.periodLabel} report for{" "}
        <strong>{data.storeName}</strong>.
      </p>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          <tr>
            <td style={cell}>Products</td>
            <td style={cell}>
              <strong>{data.totalProducts}</strong> ({data.trackedProducts}{" "}
              tracked)
            </td>
          </tr>
          <tr>
            <td style={cell}>Out of stock</td>
            <td style={cell}>
              <strong>{data.outOfStock.length}</strong>
            </td>
          </tr>
          <tr>
            <td style={cell}>Low stock</td>
            <td style={cell}>
              <strong>{data.lowStock.length}</strong>
            </td>
          </tr>
          <tr>
            <td style={cell}>Alerts this period</td>
            <td style={cell}>
              <strong>{data.alertCount}</strong>
            </td>
          </tr>
          <tr>
            <td style={cell}>Ads paused by Steadel</td>
            <td style={cell}>
              <strong>{data.adsPaused}</strong>
            </td>
          </tr>
        </tbody>
      </table>
      {data.outOfStock.length > 0 && (
        <>
          <p style={{ marginTop: 20 }}>
            <strong>Out of stock:</strong>
          </p>
          <ul>
            {data.outOfStock.slice(0, 10).map((p) => (
              <li key={p.title + (p.sku ?? "")}>
                {p.title}
                {p.sku ? ` (${p.sku})` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
      {data.lowStock.length > 0 && (
        <>
          <p style={{ marginTop: 12 }}>
            <strong>Low stock:</strong>
          </p>
          <ul>
            {data.lowStock.slice(0, 10).map((p) => (
              <li key={p.title + (p.sku ?? "")}>
                {p.title}
                {p.sku ? ` (${p.sku})` : ""} — {p.qty} left
              </li>
            ))}
          </ul>
        </>
      )}
      <EmailButton href={appUrl("/reports")} label="Open reports" />
    </EmailShell>,
  );
}
