/**
 * report-pdf.ts — direct PDF download using jspdf + jspdf-autotable.
 * Same approach used in invoice.$id.tsx — known to work.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SalesData } from "@/components/admin/SalesMetrics";
import { formatPKR } from "./format";

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

// ─── colors ───────────────────────────────────────────────────────────────────
const COPPER_RGB: [number, number, number] = [184, 115, 51];
const DARK_RGB:   [number, number, number] = [2, 8, 23];
const GRAY_RGB:   [number, number, number] = [100, 116, 139];
const LIGHT_RGB:  [number, number, number] = [241, 245, 249];
const RED_RGB:    [number, number, number] = [239, 68, 68];

export function downloadReportPDF(data: ReportData, companyName = "Admin") {
  const PDFConstructor =
    typeof jsPDF === "function" ? jsPDF : (jsPDF as any).jsPDF ?? (window as any).jspdf?.jsPDF;
  if (!PDFConstructor) {
    alert("PDF library failed to load. Please refresh and try again.");
    return;
  }

  const doc = new PDFConstructor({ orientation: "portrait", unit: "pt", format: "a4" });

  const { period, sales, orderCounts, topProducts, inventory, generatedAt } = data;
  const totalOrders = Object.values(orderCounts).reduce((a, b) => a + b, 0);
  const profitMargin =
    sales.totalRevenue > 0
      ? ((sales.profit / sales.totalRevenue) * 100).toFixed(1)
      : "0";

  const pageW = doc.internal.pageSize.getWidth();
  let y = 50;

  // ── Header ─────────────────────────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setTextColor(...COPPER_RGB);
  doc.text(companyName, 40, y);

  doc.setFontSize(10);
  doc.setTextColor(...GRAY_RGB);
  doc.text(`Sales Report · ${period.from} – ${period.to}`, 40, (y += 18));
  doc.text(`Generated ${generatedAt}`, 40, (y += 14));

  y += 20;
  doc.setDrawColor(...COPPER_RGB);
  doc.setLineWidth(1);
  doc.line(40, y, pageW - 40, y);
  y += 16;

  // ── Sales Summary ──────────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(...COPPER_RGB);
  doc.text("Sales Summary", 40, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Amount"]],
    body: [
      ["Gross Sales",                      formatPKR(sales.grossSales)],
      ["Discounts Given",                  `- ${formatPKR(sales.discountsGiven)}`],
      ["Net Sales",                        formatPKR(sales.netSales)],
      ["Shipping Collected",               formatPKR(sales.shippingCollected)],
      ["Total Revenue",                    formatPKR(sales.totalRevenue)],
      [`Est. Profit (${profitMargin}% margin)`, formatPKR(sales.profit)],
    ],
    theme: "plain",
    headStyles: { fillColor: LIGHT_RGB, textColor: DARK_RGB, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { textColor: DARK_RGB, fontSize: 9 },
    columnStyles: { 0: { textColor: GRAY_RGB }, 1: { halign: "right", fontStyle: "bold" } },
    styles: { cellPadding: 5 },
    margin: { left: 40, right: 40 },
  });

  y = (doc as any).lastAutoTable.finalY + 20;

  // ── Orders by Status + Top Products ───────────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(...COPPER_RGB);
  doc.text("Orders by Status", 40, y);
  doc.text("Top Products by Revenue", pageW / 2 + 10, y);
  y += 8;

  const halfW = (pageW - 80 - 20) / 2;

  autoTable(doc, {
    startY: y,
    head: [["Status", "Count"]],
    body: [
      ...Object.entries(orderCounts).map(([k, v]) => [
        k.replace(/_/g, " "),
        String(v),
      ]),
      ["Total Orders", String(totalOrders)],
    ],
    theme: "plain",
    headStyles: { fillColor: LIGHT_RGB, textColor: DARK_RGB, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { textColor: GRAY_RGB, fontSize: 9 },
    columnStyles: { 1: { halign: "right" } },
    styles: { cellPadding: 4 },
    margin: { left: 40, right: pageW / 2 + 10 },
    tableWidth: halfW,
  });

  const ordersEndY = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: y,
    head: [["Product", "Qty", "Revenue"]],
    body: topProducts.length
      ? topProducts.map((p) => [p.name, String(p.qty), formatPKR(p.revenue)])
      : [["No sales data yet", "", ""]],
    theme: "plain",
    headStyles: { fillColor: LIGHT_RGB, textColor: DARK_RGB, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { textColor: DARK_RGB, fontSize: 9 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    styles: { cellPadding: 4 },
    margin: { left: pageW / 2 + 10, right: 40 },
    tableWidth: halfW,
  });

  y = Math.max(ordersEndY, (doc as any).lastAutoTable.finalY) + 20;

  // ── Inventory ──────────────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(...COPPER_RGB);
  doc.text("Inventory Record", 40, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Product", "SKU", "Stock", "Threshold", "Price", "Stock Value"]],
    body: inventory.map((p) => [
      p.name,
      p.sku,
      String(p.stock),
      String(p.low_stock_threshold),
      formatPKR(p.price_pkr),
      formatPKR(p.stock * p.price_pkr),
    ]),
    theme: "plain",
    headStyles: { fillColor: LIGHT_RGB, textColor: DARK_RGB, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { textColor: DARK_RGB, fontSize: 8 },
    columnStyles: {
      2: {
        halign: "right",
      },
      3: { halign: "right", textColor: GRAY_RGB },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    styles: { cellPadding: 4 },
    margin: { left: 40, right: 40 },
    didParseCell: (hookData: any) => {
      // highlight low-stock rows in the Stock column
      if (hookData.column.index === 2 && hookData.section === "body") {
        const row = inventory[hookData.row.index];
        if (row && row.stock <= row.low_stock_threshold) {
          hookData.cell.styles.textColor = RED_RGB;
          hookData.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  const filename = `sales-report-${period.to.replace(/[\s,]/g, "-")}.pdf`;
  doc.save(filename);
}
