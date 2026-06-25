import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { inputCls } from "@/lib/styles";
import { useSiteSettings } from "@/lib/settings";
import { Printer, ArrowLeft, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export const Route = createFileRoute("/invoice/$id")({
 head: () => ({
 meta: [{ title: "Invoice Asif Brothers" }, { name: "robots", content: "noindex" }],
 }),
 component: InvoicePage,
});

function InvoicePage() {
 const { id } = Route.useParams();
 const brand = useSiteSettings();
 const [order, setOrder] = useState<any>(null);
 const [items, setItems] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [downloading, setDownloading] = useState(false);
 const printRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 (async () => {
 const { data: { session } } = await supabase.auth.getSession();
 const [{ data: o }, { data: oi }] = await Promise.all([
 supabase.from("orders").select("*").eq("id", id).maybeSingle(),
 supabase.from("order_items").select("*").eq("order_id", id),
 ]);
 // Only show if signed in and order belongs to this user
 if (o && session && o.user_id === session.user.id) {
 setOrder(o);
 setItems(oi ?? []);
 }
 setLoading(false);
 })();
 }, [id]);

 function handlePrint() {
 window.print();
 }

 async function handleDownloadPDF() {
 setDownloading(true);
 try {
 const PDFConstructor =
 typeof jsPDF === "function" ? jsPDF : (jsPDF as any).jsPDF || (window as any).jspdf?.jsPDF;
 if (!PDFConstructor) throw new Error("PDF library failed to load");
 const doc = new PDFConstructor({ orientation: "portrait", unit: "pt", format: "a4" });

 const addr = order.shipping_address as any;
 const issueDate = new Date(order.created_at).toLocaleDateString("en-PK", {
 day: "numeric",
 month: "long",
 year: "numeric",
 });

 // Header
 doc.setFontSize(22);
 doc.setTextColor(2, 8, 23);
 doc.text(brand.company_name, 40, 60);
 doc.setFontSize(10);
 doc.setTextColor(100, 116, 139);
 doc.text(brand.address, 40, 80);
 doc.text(brand.phone, 40, 95);
 doc.text(brand.email, 40, 110);

 // Title
 doc.setFontSize(26);
 doc.setTextColor(2, 8, 23);
 doc.text("INVOICE", 550, 60, { align: "right" });
 doc.setFontSize(10);
 doc.setTextColor(100, 116, 139);
 doc.text(`# ${order.order_number}`, 550, 80, { align: "right" });
 doc.text(`Date: ${issueDate}`, 550, 95, { align: "right" });

 // Bill To
 doc.setFontSize(10);
 doc.text("BILL TO", 40, 150);
 doc.setFontSize(11);
 doc.setTextColor(2, 8, 23);
 doc.text(addr?.full_name || "", 40, 165);
 doc.setFontSize(10);
 doc.setTextColor(100, 116, 139);
 doc.text(addr?.phone || "", 40, 180);
 doc.text(`${addr?.line1 || ""}${addr?.line2 ? `, ${addr.line2}` : ""}`, 40, 195);
 doc.text(`${addr?.city || ""}, ${addr?.province || ""} ${addr?.postal_code || ""}`, 40, 210);

 // Table
 const tableBody = items.map((item) => [
 item.product_name || "Unknown",
 item.product_sku || "-",
 item.quantity.toString(),
 formatPKR(item.unit_price_pkr || 0),
 formatPKR(item.subtotal_pkr || 0),
 ]);

 autoTable(doc, {
 startY: 230,
 head: [["Description", "SKU", "Qty", "Unit Price", "Total"]],
 body: tableBody,
 theme: "plain",
 headStyles: { fillColor: [241, 245, 249], textColor: [2, 8, 23], fontStyle: "bold" },
 bodyStyles: { textColor: [2, 8, 23] },
 styles: { cellPadding: 8, fontSize: 10 },
 columnStyles: {
 0: { cellWidth: 180 },
 2: { halign: "right" },
 3: { halign: "right" },
 4: { halign: "right", fontStyle: "bold" },
 },
 });

 // Totals
 const finalY = (doc as any).lastAutoTable.finalY || 230;
 let currentY = finalY + 30;

 doc.setFontSize(10);
 doc.setTextColor(100, 116, 139);
 doc.text("Subtotal", 400, currentY);
 doc.setTextColor(2, 8, 23);
 doc.text(formatPKR(order.subtotal_pkr || 0), 550, currentY, { align: "right" });
 currentY += 20;

 if (Number(order.discount_pkr) > 0) {
 doc.setTextColor(100, 116, 139);
 doc.text("Discount", 400, currentY);
 doc.setTextColor(184, 115, 51);
 doc.text(`-${formatPKR(order.discount_pkr)}`, 550, currentY, { align: "right" });
 currentY += 20;
 }

 doc.setTextColor(100, 116, 139);
 doc.text("Shipping", 400, currentY);
 doc.setTextColor(2, 8, 23);
 doc.text(
 Number(order.shipping_pkr) === 0 ? "Free" : formatPKR(order.shipping_pkr || 0),
 550,
 currentY,
 { align: "right" },
 );
 currentY += 20;

 doc.setDrawColor(226, 232, 240);
 doc.line(400, currentY - 10, 550, currentY - 10);

 doc.setFontSize(12);
 doc.setFont("helvetica", "bold");
 doc.setTextColor(2, 8, 23);
 doc.text("Total", 400, currentY + 5);
 doc.text(formatPKR(order.total_pkr || 0), 550, currentY + 5, { align: "right" });

 doc.save(`Invoice-${order.order_number}.pdf`);
 } catch (err: any) {
 console.error("Failed to generate PDF", err);
 toast.error(err.message || "Failed to generate PDF");
 } finally {
 setDownloading(false);
 }
 }

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
 Loading invoice…
 </div>
 );
 }

 if (!order) {
 return (
 <div className="min-h-screen flex items-center justify-center text-center px-4">
 <div>
 <p className="text-muted-foreground mb-4">Invoice not found.</p>
 <Link to="/account/orders" className="text-copper underline text-sm">
 Back to orders
 </Link>
 </div>
 </div>
 );
 }

 const addr = order.shipping_address as any;
 const issueDate = new Date(order.created_at).toLocaleDateString("en-PK", {
 day: "numeric",
 month: "long",
 year: "numeric",
 });

 return (
 <div className="min-h-screen bg-background">
 {/* Toolbar — hidden on print */}
 <div className="print:hidden sticky top-0 z-10 border-b border-border bg-background px-6 py-3 flex items-center justify-between gap-4">
 <Link
 to="/account/orders"
 className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
 >
 <ArrowLeft className="h-4 w-4" /> Back to orders
 </Link>
 <div className="flex gap-2">
 <button
 onClick={handlePrint}
 className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-secondary"
 >
 <Printer className="h-4 w-4" /> Print
 </button>
 <button
 onClick={handleDownloadPDF}
 disabled={downloading}
 className="inline-flex items-center gap-2 rounded-md bg-copper px-4 py-2 text-sm font-medium text-copper-foreground disabled:opacity-50"
 >
 <Download className="h-4 w-4" /> {downloading ? "Generating..." : "Download PDF"}
 </button>
 </div>
 </div>

 {/* Invoice document */}
 <div ref={printRef} className="max-w-3xl mx-auto p-8 md:p-12 print:p-0 print:max-w-none">
 {/* Header */}
 <div className="flex items-start justify-between mb-10 gap-6">
 <div>
 <div className="text-2xl font-bold text-foreground mb-0.5">{brand.company_name}</div>
 <div className="text-sm text-muted-foreground">{brand.address}</div>
 <div className="text-sm text-muted-foreground">{brand.phone}</div>
 <div className="text-sm text-muted-foreground">{brand.email}</div>
 </div>
 <div className="text-right">
 <div className="text-3xl font-bold text-foreground tracking-tight">INVOICE</div>
 <div className="text-sm text-muted-foreground mt-1"># {order.order_number}</div>
 <div className="text-sm text-muted-foreground">Date: {issueDate}</div>
 </div>
 </div>

 {/* Bill to */}
 <div className="grid sm:grid-cols-2 gap-6 mb-8 p-5 rounded-xl bg-secondary/40 border border-border">
 <div>
 <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
 Bill to
 </div>
 <div className="text-sm font-medium">{addr?.full_name}</div>
 <div className="text-sm text-muted-foreground">{addr?.phone}</div>
 <div className="text-sm text-muted-foreground">
 {addr?.line1}
 {addr?.line2 ? `, ${addr.line2}` : ""},<br />
 {addr?.city}, {addr?.province} {addr?.postal_code ?? ""},<br />
 {addr?.country}
 </div>
 </div>
 <div className="text-sm sm:text-right">
 <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
 Order details
 </div>
 <div>
 <span className="text-muted-foreground">Status: </span>
 <span className="capitalize font-medium">{order.status}</span>
 </div>
 <div>
 <span className="text-muted-foreground">Payment: </span>
 <span className="capitalize font-medium">{order.payment_status}</span>
 </div>
 {order.coupon_code && (
 <div>
 <span className="text-muted-foreground">Coupon: </span>
 <span className="font-medium font-mono">{order.coupon_code}</span>
 </div>
 )}
 </div>
 </div>

 {/* Items table */}
 <table className="w-full text-sm mb-6">
 <thead>
 <tr className="border-b-2 border-border">
 <th className="py-2 text-left font-semibold text-foreground">Description</th>
 <th className="py-2 text-left font-semibold text-foreground">SKU</th>
 <th className="py-2 text-right font-semibold text-foreground">Qty</th>
 <th className="py-2 text-right font-semibold text-foreground">Unit price</th>
 <th className="py-2 text-right font-semibold text-foreground">Total</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {items.map((item) => (
 <tr key={item.id}>
 <td className="py-3 font-medium">{item.product_name}</td>
 <td className="py-3 text-muted-foreground font-mono text-xs">
 {item.product_sku ?? "—"}
 </td>
 <td className="py-3 text-right">{item.quantity}</td>
 <td className="py-3 text-right">{formatPKR(item.unit_price_pkr)}</td>
 <td className="py-3 text-right font-medium">{formatPKR(item.subtotal_pkr)}</td>
 </tr>
 ))}
 </tbody>
 </table>

 {/* Totals */}
 <div className="flex justify-end mb-10">
 <dl className="w-full max-w-xs space-y-2 text-sm">
 <div className="flex justify-between">
 <dt className="text-muted-foreground">Subtotal</dt>
 <dd>{formatPKR(order.subtotal_pkr)}</dd>
 </div>
 {Number(order.discount_pkr) > 0 && (
 <div className="flex justify-between">
 <dt className="text-muted-foreground">Discount</dt>
 <dd className="text-copper">-{formatPKR(order.discount_pkr)}</dd>
 </div>
 )}
 <div className="flex justify-between">
 <dt className="text-muted-foreground">Shipping</dt>
 <dd>{Number(order.shipping_pkr) === 0 ? "Free" : formatPKR(order.shipping_pkr)}</dd>
 </div>
 <div className="flex justify-between pt-2 border-t-2 border-border text-base font-bold">
 <dt>Total</dt>
 <dd>{formatPKR(order.total_pkr)}</dd>
 </div>
 </dl>
 </div>

 {/* Footer */}
 <div className="border-t border-border pt-6 text-xs text-muted-foreground text-center space-y-1">
 <p>Thank you for shopping with {brand.company_name}!</p>
 <p>For any queries, contact us at {brand.email} or {brand.phone}</p>
 <p>{brand.address}</p>
 </div>
 </div>

 <style>{`
 @media print {
 body { background: white !important; }
 .print\\:hidden { display: none !important; }
 .print\\:p-0 { padding: 0 !important; }
 .print\\:max-w-none { max-width: none !important; }
 }
 `}</style>
 </div>
 );
}
