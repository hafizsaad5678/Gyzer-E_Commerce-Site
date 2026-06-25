/**
 * report-pdf.ts — client-side PDF generation for admin reports.
 *
 * Uses the browser's built-in print dialog with a custom print stylesheet.
 * No extra dependencies needed — opens a new window, injects a print-ready
 * HTML document, and triggers print/save-as-PDF.
 */

import { formatPKR } from "./format";
import type { SalesData } from "@/components/admin/SalesMetrics";

export type ReportPeriod = { from: string; to: string };

export type InventoryItem = {
  name: string;
  sku: string;
  stock: number;
  price_pkr: number;
  low_stock_threshold: number;
};

export type ReportData = {
  period: ReportPeriod;
  sales: SalesData;
  orderCounts: Record<string, number>;
  topProducts: { name: string; qty: number; revenue: number }[];
  inventory: InventoryItem[];
  generatedAt: string;
};

function row(label: string, value: string, bold = false) {
  return `<tr>
    <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${label}</td>
    <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;${bold ? "font-weight:700;" : ""}">${value}</td>
  </tr>`;
}

export function downloadReportPDF(data: ReportData, companyName = "Admin") {
  const { period, sales, orderCounts, topProducts, inventory } = data;

  const totalOrders = Object.values(orderCounts).reduce((a, b) => a + b, 0);
  const profitMargin =
    sales.totalRevenue > 0
      ? ((sales.profit / sales.totalRevenue) * 100).toFixed(1)
      : "0";

  const statusRows = Object.entries(orderCounts)
    .map(([k, v]) => `<tr><td style="padding:5px 12px;border-bottom:1px solid #e5e7eb;text-transform:capitalize;">${k.replace(/_/g, " ")}</td><td style="padding:5px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${v}</td></tr>`)
    .join("");

  const topProductRows = topProducts
    .map(
      (p, i) =>
        `<tr><td style="padding:5px 12px;border-bottom:1px solid #e5e7eb;">${i + 1}. ${p.name}</td><td style="padding:5px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${p.qty}</td><td style="padding:5px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatPKR(p.revenue)}</td></tr>`,
    )
    .join("");

  const inventoryRows = inventory
    .map(
      (p) =>
        `<tr style="${p.stock <= p.low_stock_threshold ? "background:#fef2f2;" : ""}">
          <td style="padding:5px 12px;border-bottom:1px solid #e5e7eb;">${p.name}</td>
          <td style="padding:5px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;">${p.sku}</td>
          <td style="padding:5px 12px;border-bottom:1px solid #e5e7eb;text-align:right;${p.stock <= p.low_stock_threshold ? "color:#ef4444;font-weight:700;" : ""}">${p.stock}</td>
          <td style="padding:5px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatPKR(p.price_pkr)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${companyName} — Sales Report ${period.from} to ${period.to}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; font-size: 13px; color: #111827; background: #fff; padding: 32px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 2px; }
    h2 { font-size: 14px; font-weight: 700; margin: 24px 0 8px; border-bottom: 2px solid #b87333; padding-bottom: 4px; color: #b87333; }
    .meta { font-size: 11px; color: #6b7280; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f3f4f6; padding: 7px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
    th:last-child, td:last-child { text-align: right; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .highlight { background: #fffbf5; border-color: #b87333; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>${companyName}</h1>
  <div class="meta">
    Sales Report · ${period.from} – ${period.to} · Generated ${data.generatedAt}
  </div>

  <h2>Sales Summary</h2>
  <div class="card highlight">
    <table>
      ${row("Gross Sales", formatPKR(sales.grossSales))}
      ${row("Discounts Given", `− ${formatPKR(sales.discountsGiven)}`)}
      ${row("Net Sales", formatPKR(sales.netSales))}
      ${row("Shipping Collected", formatPKR(sales.shippingCollected))}
      ${row("Total Revenue", formatPKR(sales.totalRevenue), true)}
      ${row("Estimated Profit", `${formatPKR(sales.profit)} (${profitMargin}% margin)`, true)}
    </table>
  </div>

  <div class="grid2" style="margin-top:20px;">
    <div>
      <h2>Orders by Status</h2>
      <div class="card">
        <table>
          <thead><tr><th>Status</th><th>Count</th></tr></thead>
          <tbody>
            ${statusRows}
            <tr style="font-weight:700;background:#f9fafb;">
              <td style="padding:6px 12px;">Total Orders</td>
              <td style="padding:6px 12px;text-align:right;">${totalOrders}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div>
      <h2>Top Products</h2>
      <div class="card">
        <table>
          <thead><tr><th>Product</th><th style="text-align:center;">Qty</th><th>Revenue</th></tr></thead>
          <tbody>${topProductRows || '<tr><td colspan="3" style="padding:12px;text-align:center;color:#6b7280;">No data</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  </div>

  <h2>Inventory Record</h2>
  <div class="card">
    <table>
      <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Unit Price</th></tr></thead>
      <tbody>${inventoryRows || '<tr><td colspan="4" style="padding:12px;text-align:center;color:#6b7280;">No products</td></tr>'}</tbody>
    </table>
    <div style="padding:8px 12px;font-size:11px;color:#6b7280;background:#f9fafb;border-top:1px solid #e5e7eb;">
      Rows highlighted in red = low stock (at or below threshold)
    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Pop-up blocked — please allow pop-ups for this site to download reports.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}
