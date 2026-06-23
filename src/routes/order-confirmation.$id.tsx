import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import {
 CheckCircle2,
 Package,
 Truck,
 Smartphone,
 Building2,
 X,
 MessageCircle,
} from "lucide-react";
import { BRAND } from "@/lib/format";

export const Route = createFileRoute("/order-confirmation/$id")({
 head: () => ({
 meta: [{ title: "Order confirmed — Asif Brothers" }, { name: "robots", content: "noindex" }],
 }),
 component: OrderConfirmation,
});

function OrderConfirmation() {
 const { id } = Route.useParams();
 const [order, setOrder] = useState<any>(null);
 const [items, setItems] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [showPopup, setShowPopup] = useState(false);

 useEffect(() => {
 (async () => {
 const [{ data: o }, { data: oi }] = await Promise.all([
 supabase.from("orders").select("*").eq("id", id).maybeSingle(),
 supabase.from("order_items").select("*").eq("order_id", id),
 ]);
 setOrder(o);
 setItems(oi ?? []);
 setLoading(false);
 if (
 o?.notes &&
 (o.notes.includes("[Payment: BANK]") ||
 o.notes.includes("[Payment: EASYPAISA]") ||
 o.notes.includes("[Payment: JAZZCASH]"))
 ) {
 setShowPopup(true);
 }
 })();
 }, [id]);

 if (loading)
 return (
 <SiteLayout>
 <div className="container-page py-20 text-muted-foreground">Loading…</div>
 </SiteLayout>
 );
 if (!order)
 return (
 <SiteLayout>
 <div className="container-page py-32 text-center">
 <h1 className="text-display text-3xl mb-3">Order not found</h1>
 <Link to="/" className="text-copper underline">
 Home
 </Link>
 </div>
 </SiteLayout>
 );

 const a = order.shipping_address as any;

 return (
 <SiteLayout>
 <section className="container-page py-12 max-w-3xl">
 <div className="text-center mb-10">
 <div className="inline-grid h-16 w-16 place-items-center rounded-full bg-copper/15 text-copper mb-4">
 <CheckCircle2 className="h-8 w-8" />
 </div>
 <h1 className="text-display text-4xl mb-2">Thank you for your order</h1>
 <p className="text-muted-foreground">
 Order <span className="font-mono text-foreground">{order.order_number}</span> · We've
 sent confirmation to {order.email}.
 </p>
 </div>

 <div className="surface-card p-6 mb-6">
 <div className="grid sm:grid-cols-3 gap-6 text-sm">
 <div>
 <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
 Status
 </div>
 <div className="font-medium capitalize">{order.status}</div>
 </div>
 <div>
 <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
 Payment
 </div>
 <div className="font-medium">
 {order.notes?.includes("[Payment: COD]")
 ? "Cash on Delivery"
 : order.notes?.includes("[Payment: BANK]")
 ? "Bank Transfer"
 : order.notes?.includes("[Payment: EASYPAISA]")
 ? "Easypaisa"
 : order.notes?.includes("[Payment: JAZZCASH]")
 ? "JazzCash"
 : "Manual Payment"}
 </div>
 </div>
 <div>
 <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
 Total
 </div>
 <div className="font-semibold">{formatPKR(order.total_pkr)}</div>
 </div>
 </div>
 </div>

 <div className="surface-card p-6 mb-6">
 <h2 className="text-display text-xl mb-4">Items</h2>
 <ul className="divide-y divide-border">
 {items.map((i) => (
 <li key={i.id} className="flex justify-between py-3 text-sm">
 <div>
 <div className="font-medium">{i.product_name}</div>
 <div className="text-xs text-muted-foreground">
 {i.product_sku} · Qty {i.quantity}
 </div>
 </div>
 <div>{formatPKR(i.subtotal_pkr)}</div>
 </li>
 ))}
 </ul>
 <dl className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
 <Row k="Subtotal" v={formatPKR(order.subtotal_pkr)} />
 {Number(order.discount_pkr) > 0 && (
 <Row k="Discount" v={`-${formatPKR(order.discount_pkr)}`} />
 )}
 <Row
 k="Shipping"
 v={Number(order.shipping_pkr) === 0 ? "Free" : formatPKR(order.shipping_pkr)}
 />
 <div className="flex justify-between pt-3 border-t border-border text-base font-semibold">
 <dt>Total</dt>
 <dd>{formatPKR(order.total_pkr)}</dd>
 </div>
 </dl>
 </div>

 <div className="surface-card p-6 mb-8">
 <h2 className="text-display text-xl mb-4">Delivering to</h2>
 <div className="text-sm">
 <div className="font-medium">
 {a?.full_name} <span className="text-muted-foreground font-normal">· {a?.phone}</span>
 </div>
 <div className="text-muted-foreground">
 {a?.line1}
 {a?.line2 ? `, ${a.line2}` : ""}, {a?.city}, {a?.province} {a?.postal_code ?? ""},{" "}
 {a?.country}
 </div>
 </div>
 </div>

 <div className="grid sm:grid-cols-2 gap-4 mb-8">
 <div className="surface-card p-5 flex items-start gap-3">
 <Package className="h-5 w-5 text-copper mt-0.5" />
 <div className="text-sm">
 <div className="font-medium">We're preparing your order</div>
 <div className="text-muted-foreground">You'll get an update once it ships.</div>
 </div>
 </div>
 {order.notes?.includes("[Payment: COD]") ? (
 <div className="surface-card p-5 flex items-start gap-3">
 <Truck className="h-5 w-5 text-copper mt-0.5" />
 <div className="text-sm">
 <div className="font-medium">Pay on delivery</div>
 <div className="text-muted-foreground">
 Please have {formatPKR(order.total_pkr)} ready in cash.
 </div>
 </div>
 </div>
 ) : order.notes?.includes("[Payment: BANK]") ? (
 <div className="surface-card p-5 flex items-start gap-3">
 <Building2 className="h-5 w-5 text-copper mt-0.5" />
 <div className="text-sm">
 <div className="font-medium">Action Required: Bank Transfer</div>
 <div className="text-muted-foreground">
 Please transfer {formatPKR(order.total_pkr)} to our HBL account and WhatsApp the
 receipt.
 </div>
 </div>
 </div>
 ) : (
 <div className="surface-card p-5 flex items-start gap-3">
 <Smartphone className="h-5 w-5 text-copper mt-0.5" />
 <div className="text-sm">
 <div className="font-medium">Action Required: Mobile Wallet</div>
 <div className="text-muted-foreground">
 Please send {formatPKR(order.total_pkr)} via Easypaisa/JazzCash and WhatsApp the
 receipt.
 </div>
 </div>
 </div>
 )}
 </div>

 <div className="flex flex-wrap gap-3 justify-center">
 <Link
 to="/account/orders"
 className="rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-5 py-3 text-sm font-medium "
 >
 View my orders
 </Link>
 <Link to="/shop" className="rounded-md border border-input px-5 py-3 text-sm">
 Continue shopping
 </Link>
 </div>
 </section>

 {/* WHATSAPP POPUP MODAL */}
 {showPopup && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
 <div className="relative w-full max-w-md surface-card p-8 rounded-xl shadow-2xl border-copper/50 border-2 animate-in fade-in zoom-in duration-300">
 <button
 onClick={() => setShowPopup(false)}
 className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
 >
 <X className="h-5 w-5" />
 </button>
 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-500 mb-6">
 <MessageCircle className="h-8 w-8" />
 </div>
 <h2 className="text-display text-2xl text-center mb-3">One last step!</h2>
 <p className="text-center text-muted-foreground mb-6">
 To complete your order, please transfer the funds and send the screenshot to our
 WhatsApp team.
 </p>
 <div className="bg-secondary rounded-md p-4 text-sm text-center mb-6">
 WhatsApp: <span className="font-semibold text-foreground">{BRAND.phone}</span>
 <br />
 Order #: <span className="font-mono text-foreground">{order.order_number}</span>
 </div>
 <button
 onClick={() => setShowPopup(false)}
 className="w-full rounded-md bg-copper px-5 py-3 text-sm font-semibold text-copper-foreground transition"
 >
 I understand
 </button>
 </div>
 </div>
 )}
 </SiteLayout>
 );
}

function Row({ k, v }: { k: string; v: string }) {
 return (
 <div className="flex justify-between">
 <dt className="text-muted-foreground">{k}</dt>
 <dd>{v}</dd>
 </div>
 );
}
