import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { Package, ChevronDown, ChevronUp, Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/orders")({
  component: Orders,
});

const statusColor: Record<string, string> = {
  pending: "bg-secondary text-muted-foreground",
  paid: "bg-success/15 text-success",
  processing: "bg-accent text-copper",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-destructive/10 text-destructive",
};

// Visual order tracking steps
const STEPS = ["pending", "processing", "shipped", "delivered"] as const;
type OrderStatus = (typeof STEPS)[number] | "paid" | "cancelled" | "refunded";

function TrackingBar({ status }: { status: string }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive mt-3">
        <span className="h-2 w-2 rounded-full bg-destructive" />
        Order {status}
      </div>
    );
  }
  // Normalize "paid" → "processing" for display
  const displayStatus = status === "paid" ? "processing" : status;
  const activeIdx = STEPS.indexOf(displayStatus as any);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const done = i <= activeIdx;
          const isLast = i === STEPS.length - 1;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${done ? "bg-copper" : "bg-border"}`} />
              {!isLast && <div className={`h-0.5 flex-1 transition-colors ${i < activeIdx ? "bg-copper" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5">
        {STEPS.map((step) => (
          <span key={step} className="text-[10px] capitalize text-muted-foreground">{step}</span>
        ))}
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      setOrders(data ?? []);
      setLoading(false);
    })();
  }, []);

  async function toggleExpand(orderId: string) {
    if (expanded === orderId) { setExpanded(null); return; }
    setExpanded(orderId);
    if (!orderItems[orderId]) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      setOrderItems((prev) => ({ ...prev, [orderId]: data ?? [] }));
    }
  }

  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  if (orders.length === 0) {
    return (
      <div className="surface-card p-12 text-center">
        <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-5">No orders yet.</p>
        <Link to="/shop" className="inline-flex rounded-md bg-primary px-5 py-2.5 text-sm text-primary-foreground font-medium">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-display text-2xl mb-4">My orders</h2>
      {orders.map((o) => {
        const addr = o.shipping_address as any;
        const isOpen = expanded === o.id;
        return (
          <div key={o.id} className="surface-card overflow-hidden">
            {/* Header row */}
            <button
              className="w-full text-left p-5 flex flex-wrap justify-between items-center gap-4 hover:bg-secondary/40 transition-colors"
              onClick={() => toggleExpand(o.id)}
              aria-expanded={isOpen}
            >
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div className="text-display text-lg font-medium">{o.order_number}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{formatPKR(o.total_pkr)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusColor[o.status] ?? "bg-secondary"}`}>
                  {o.status}
                </span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="border-t border-border px-5 pb-5 pt-4 space-y-5">
                {/* Tracking bar */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Order status</div>
                  <TrackingBar status={o.status} />
                </div>

                {/* Items */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Items</div>
                  {orderItems[o.id] ? (
                    <ul className="divide-y divide-border text-sm">
                      {orderItems[o.id].map((item) => (
                        <li key={item.id} className="flex justify-between py-2.5">
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-xs text-muted-foreground">{item.product_sku} · Qty {item.quantity}</div>
                          </div>
                          <div className="font-medium">{formatPKR(item.subtotal_pkr)}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  )}
                  <dl className="mt-3 pt-3 border-t border-border space-y-1.5 text-sm">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPKR(o.subtotal_pkr)}</dd></div>
                    {Number(o.discount_pkr) > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="text-copper">-{formatPKR(o.discount_pkr)}</dd></div>}
                    <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{Number(o.shipping_pkr) === 0 ? "Free" : formatPKR(o.shipping_pkr)}</dd></div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-border"><dt>Total</dt><dd>{formatPKR(o.total_pkr)}</dd></div>
                  </dl>
                </div>

                {/* Delivery address */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Delivering to</div>
                  <div className="text-sm">
                    <div className="font-medium">{addr?.full_name} <span className="text-muted-foreground font-normal">· {addr?.phone}</span></div>
                    <div className="text-muted-foreground">{addr?.line1}{addr?.line2 ? `, ${addr.line2}` : ""}, {addr?.city}, {addr?.province}, {addr?.country}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/invoice/$id"
                    params={{ id: o.id }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-input px-4 py-2 text-sm hover:bg-secondary transition-colors"
                  >
                    <Printer className="h-4 w-4" /> Download invoice
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
