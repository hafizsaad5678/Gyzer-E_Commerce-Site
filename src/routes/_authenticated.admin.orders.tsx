import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";

const statuses = ["pending","paid","processing","shipped","delivered","cancelled","refunded"] as const;

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");

  async function load() {
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (filter) q = q.eq("status", filter as any);
    const { data } = await q;
    setOrders(data ?? []);
  }
  useEffect(() => { load(); }, [filter]);

  async function changeStatus(order: any, newStatus: string) {
    if (order.status === newStatus) return;

    // Update DB
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as any, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    if (error) { toast.error("Failed to update status"); return; }

    // Fire email notification (non-blocking)
    supabase.functions
      .invoke("send-order-status-email", {
        body: {
          to: order.email,
          customer_name: (order.shipping_address as any)?.full_name ?? null,
          order_number: order.order_number,
          order_total: order.total_pkr,
          status: newStatus,
          order_id: order.id,
        },
      })
      .then(({ error: fnErr }) => {
        if (fnErr) console.warn("Email notification failed:", fnErr.message);
      });

    toast.success(`Order ${order.order_number} → ${newStatus}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Sales</div>
          <h1 className="text-display text-4xl">Orders</h1>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium">{o.order_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-PK")}</td>
                  <td className="px-4 py-3 text-right">{formatPKR(o.total_pkr)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => changeStatus(o, e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Status change automatically sends an email notification to the customer via Resend.
      </p>
    </div>
  );
}
