import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, Truck, CheckCircle2, Clock } from "lucide-react";
import { z } from "zod";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";

const trackSearchSchema = z.object({
 order: z.string().optional(),
});

export const Route = createFileRoute("/track")({
 validateSearch: trackSearchSchema,
 head: () => ({ meta: [{ title: "Track Your Order Asif Brothers" }] }),
 component: TrackOrder,
});

function TrackOrder() {
 const search = useSearch({ from: "/track" });
 const [orderNum, setOrderNum] = useState(search.order ?? "");
 const [email, setEmail] = useState("");
 const [loading, setLoading] = useState(false);
 const [order, setOrder] = useState<any | null>(null);

 async function handleSearch(e: React.FormEvent) {
 e.preventDefault();
 if (!orderNum.trim() || !email.trim())
 return toast.error("Please enter both Order Number and Email");

 setLoading(true);
 const { data, error } = await supabase
 .from("orders")
 .select("*, order_items(*)")
 .eq("order_number", orderNum.trim().toUpperCase())
 .ilike("email", email.trim())
 .maybeSingle();

 setLoading(false);

 if (error || !data) {
 setOrder(null);
 toast.error("Order not found. Please check your details.");
 } else {
 setOrder(data);
 }
 }

 // Determine active step based on status
 const statuses = ["pending", "processing", "shipped", "delivered"];
 const currentStep = Math.max(0, statuses.indexOf(order?.status || "pending"));

 return (
 <SiteLayout>
 <section className="container-page py-16 md:py-24 max-w-4xl mx-auto">
 <div className="text-center mb-10">
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Order Support
 </div>
 <h1 className="text-display text-4xl md:text-5xl mb-4">Track your order</h1>
 <p className="text-muted-foreground">
 Enter your order number and email address to check the current status.
 </p>
 </div>

 <div className="surface-card p-6 md:p-8 max-w-xl mx-auto mb-12">
 <form onSubmit={handleSearch} className="space-y-4">
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
 Order Number
 </label>
 <input
 value={orderNum}
 onChange={(e) => setOrderNum(e.target.value)}
 placeholder="e.g. ORD-12345"
 className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm"
 required
 />
 </div>
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
 Email Address
 </label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="The email used during checkout"
 className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm"
 required
 />
 </div>
 <button
 type="submit"
 disabled={loading}
 className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-copper px-5 py-3 text-sm font-semibold text-copper-foreground disabled:opacity-50 mt-2"
 >
 <Search className="h-4 w-4" />
 {loading ? "Searching..." : "Track Order"}
 </button>
 </form>
 </div>

 {order && (
 <div className="grid md:grid-cols-2 gap-8">
 {/* Status Timeline */}
 <div className="surface-card p-6 md:p-8 space-y-8">
 <h2 className="text-display text-2xl mb-6">
 Status: <span className="capitalize text-copper">{order.status}</span>
 </h2>

 <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
 <TimelineStep
 active={currentStep >= 0}
 icon={<Clock className="h-4 w-4" />}
 title="Order Placed"
 desc="We have received your order."
 date={new Date(order.created_at).toLocaleDateString("en-PK")}
 />

 <TimelineStep
 active={currentStep >= 1}
 icon={<Package className="h-4 w-4" />}
 title="Processing"
 desc="We are preparing your items for dispatch."
 date={currentStep >= 1 ? "In progress" : undefined}
 />

 <TimelineStep
 active={currentStep >= 2}
 icon={<Truck className="h-4 w-4" />}
 title="Shipped"
 desc="Your order is with the courier."
 date={order.courier_name ? `via ${order.courier_name}` : undefined}
 />

 <TimelineStep
 active={currentStep >= 3}
 icon={<CheckCircle2 className="h-4 w-4" />}
 title="Delivered"
 desc="Your order has arrived!"
 />
 </div>

 {order.tracking_number &&
 order.status !== "pending" &&
 order.status !== "processing" && (
 <div className="mt-8 p-4 rounded-md bg-secondary/50 border border-border">
 <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
 Tracking Information
 </div>
 <div className="text-lg font-medium">{order.tracking_number}</div>
 {order.courier_name && (
 <div className="text-sm text-muted-foreground mt-1">
 Courier: {order.courier_name}
 </div>
 )}
 </div>
 )}
 </div>

 {/* Order Details */}
 <div className="surface-card p-6 md:p-8 h-fit space-y-6">
 <h2 className="text-display text-2xl">Order Summary</h2>
 <div className="text-sm text-muted-foreground">Order #{order.order_number}</div>

 <ul className="space-y-4 pt-4 border-t border-border">
 {order.order_items?.map((item: any) => (
 <li key={item.id} className="flex justify-between gap-3 text-sm">
 <div>
 <div className="font-medium">{item.product_name}</div>
 <div className="text-xs text-muted-foreground">Qty {item.quantity}</div>
 </div>
 <div className="whitespace-nowrap">{formatPKR(item.subtotal_pkr)}</div>
 </li>
 ))}
 </ul>

 <dl className="space-y-2 text-sm pt-4 border-t border-border">
 <div className="flex justify-between">
 <dt className="text-muted-foreground">Subtotal</dt>
 <dd>{formatPKR(order.subtotal_pkr)}</dd>
 </div>
 {order.discount_pkr > 0 && (
 <div className="flex justify-between text-copper font-medium">
 <dt>Discount</dt>
 <dd>-{formatPKR(order.discount_pkr)}</dd>
 </div>
 )}
 <div className="flex justify-between">
 <dt className="text-muted-foreground">Shipping</dt>
 <dd>{order.shipping_pkr === 0 ? "Free" : formatPKR(order.shipping_pkr)}</dd>
 </div>
 <div className="flex justify-between pt-3 border-t border-border text-base font-semibold">
 <dt>Total</dt>
 <dd>{formatPKR(order.total_pkr)}</dd>
 </div>
 </dl>
 </div>
 </div>
 )}
 </section>
 </SiteLayout>
 );
}

function TimelineStep({
 active,
 icon,
 title,
 desc,
 date,
}: {
 active: boolean;
 icon: React.ReactNode;
 title: string;
 desc: string;
 date?: string;
}) {
 return (
 <div
 className={`relative flex items-start justify-between gap-4 ${active ? "opacity-100" : "opacity-40"}`}
 >
 <div className="absolute left-0 -ml-[21px] flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background border-border">
 {active ? (
 <div className="text-copper">{icon}</div>
 ) : (
 <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
 )}
 </div>
 <div>
 <h4
 className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}
 >
 {title}
 </h4>
 <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
 </div>
 {date && <div className="text-xs text-muted-foreground shrink-0 mt-0.5">{date}</div>}
 </div>
 );
}
