import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";
import { Search } from "lucide-react";
import {
  OrderStatusBadges,
  computeStatusCounts,
} from "@/components/admin/OrderStatusBadges";

const statuses = [
  "pending",
  "payment_verified",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;
type OrderStatus = (typeof statuses)[number];

// ─── Query — always fetch ALL orders so we can compute counts ─────────────────

const allOrdersOpts = queryOptions({
  queryKey: ["admin-orders-all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

// Keep backward-compat alias used internally
const ordersOpts = (_filter: string) => allOrdersOpts;

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/admin/orders")({
 component: AdminOrders,
});

// ─── Component ────────────────────────────────────────────────────────────────

function AdminOrders() {
 const qc = useQueryClient();
 const [filter, setFilter] = useState<string>("");
 const [search, setSearch] = useState("");

 const { data: allOrders = [], isLoading } = useQuery(allOrdersOpts);

 // Client-side filter + search
 const orders = allOrders.filter((o) => {
   const matchStatus = !filter || o.status === filter;
   const q = search.toLowerCase();
   const matchSearch =
     !q ||
     (o.order_number ?? "").toLowerCase().includes(q) ||
     (o.email ?? "").toLowerCase().includes(q);
   return matchStatus && matchSearch;
 });

 // Compute status counts (from all orders, not filtered)
 const statusCounts = computeStatusCounts(allOrders);

 const statusMutation = useMutation({
 mutationFn: async ({ order, newStatus }: { order: any; newStatus: string }) => {
 const { error } = await supabase
 .from("orders")
 .update({ status: newStatus as any, updated_at: new Date().toISOString() })
 .eq("id", order.id);
 if (error) throw error;

 // Fire email notification non-blocking — don't await so the UI doesn't wait
 supabase.functions
 .invoke("send-order-status-email", {
 body: {
 to: order.email,
 customer_name: (order.shipping_address as any)?.full_name ?? null,
 order_number: order.order_number,
 order_total: order.total_pkr,
 status: newStatus,
 order_id: order.id,
 tracking_number: order.tracking_number,
 courier_name: order.courier_name,
 },
 })
 .then(({ error: fnErr }) => {
 if (fnErr) console.warn("Email notification failed:", fnErr.message);
 });

 return { orderNumber: order.order_number, newStatus };
 },
 onSuccess: ({ orderNumber, newStatus }) => {
 toast.success(`Order ${orderNumber} → ${newStatus}`);
 qc.invalidateQueries({ queryKey: ["admin-orders-all"] });
 },
 onError: () => toast.error("Failed to update status"),
 });

 const trackingMutation = useMutation({
 mutationFn: async ({
 orderId,
 courier,
 tracking,
 }: {
 orderId: string;
 courier: string | null;
 tracking: string | null;
 }) => {
 const { error } = await supabase
 .from("orders")
 .update({ courier_name: courier, tracking_number: tracking } as any)
 .eq("id", orderId);
 if (error) throw error;
 },
 onSuccess: () => {
 toast.success("Tracking saved");
 qc.invalidateQueries({ queryKey: ["admin-orders-all"] });
 },
 onError: () => toast.error("Failed to update tracking info"),
 });

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex justify-between items-end gap-4 flex-wrap">
 <div>
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Sales
 </div>
 <h1 className="text-display text-4xl">Orders</h1>
 <p className="text-sm text-muted-foreground mt-1">
 {allOrders.length} total · showing {orders.length}
 </p>
 </div>
 <div className="flex items-center gap-2 flex-wrap">
 {/* Search */}
 <div className="relative">
 <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Order # or email…"
 className="rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm w-52"
 />
 </div>
 {/* Status dropdown */}
 <select
 value={filter}
 onChange={(e) => setFilter(e.target.value)}
 className="rounded-md border border-input bg-background px-3 py-2 text-sm"
 >
 <option value="">All statuses</option>
 {statuses.map((s) => (
 <option key={s} value={s}>
 {s}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Status count badges */}
 <OrderStatusBadges
 counts={statusCounts}
 activeFilter={filter}
 onFilter={setFilter}
 />

 <div className="surface-card overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
 <tr>
 <th className="text-left px-4 py-3">Order</th>
 <th className="text-left px-4 py-3">Customer</th>
 <th className="text-left px-4 py-3">Date</th>
 <th className="text-right px-4 py-3">Total</th>
 <th className="text-left px-4 py-3">Status</th>
 <th className="text-left px-4 py-3">Payment</th>
 <th className="text-left px-4 py-3">Tracking Details</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {isLoading ? (
 <tr>
 <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
 Loading…
 </td>
 </tr>
 ) : orders.length === 0 ? (
 <tr>
 <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
 No orders yet.
 </td>
 </tr>
 ) : (
 orders.map((o) => (
 <tr key={o.id}>
 <td className="px-4 py-3 font-medium">{o.order_number}</td>
 <td className="px-4 py-3 text-muted-foreground">{o.email}</td>
 <td className="px-4 py-3 text-muted-foreground">
 {new Date(o.created_at).toLocaleDateString("en-PK")}
 </td>
 <td className="px-4 py-3 text-right">{formatPKR(o.total_pkr)}</td>
 <td className="px-4 py-3">
 <select
 value={o.status}
 onChange={(e) => {
 if (e.target.value !== o.status) {
 statusMutation.mutate({ order: o, newStatus: e.target.value });
 }
 }}
 className="rounded-md border border-input bg-background px-2 py-1 text-xs"
 >
 {statuses.map((s) => (
 <option key={s} value={s}>
 {s === "payment_verified" ? "✅ Payment Verified" : s}
 </option>
 ))}
 </select>
 </td>
 <td className="px-4 py-3">
 {o.status === "pending" ? (
 <button
 onClick={() => statusMutation.mutate({ order: o, newStatus: "payment_verified" })}
 disabled={statusMutation.isPending}
 className="inline-flex items-center gap-1 rounded-md bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
 >
 ✅ Verify Payment
 </button>
 ) : o.status === "payment_verified" ? (
 <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 text-green-600 px-2.5 py-0.5 text-xs font-semibold">
 ✅ Verified
 </span>
 ) : (
 <span className="text-xs text-muted-foreground">—</span>
 )}
 </td>
 <td className="px-4 py-3">
 <div className="flex flex-col gap-1.5">
 <input
 placeholder="Courier (e.g. TCS)"
 defaultValue={o.courier_name || ""}
 onBlur={(e) =>
 trackingMutation.mutate({
 orderId: o.id,
 courier: e.target.value || null,
 tracking: o.tracking_number,
 })
 }
 className="rounded-md border border-input bg-background px-2 py-1 text-xs w-32"
 />
 <input
 placeholder="Tracking ID"
 defaultValue={o.tracking_number || ""}
 onBlur={(e) =>
 trackingMutation.mutate({
 orderId: o.id,
 courier: o.courier_name,
 tracking: e.target.value || null,
 })
 }
 className="rounded-md border border-input bg-background px-2 py-1 text-xs w-32"
 />
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 <p className="text-xs text-muted-foreground">
 Status change automatically sends an email notification to the customer.
 </p>
 </div>
 );
}
