import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { Package } from "lucide-react";

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

function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("orders").select("*, order_items(quantity)").order("created_at", { ascending: false });
      setOrders(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  if (orders.length === 0) {
    return (
      <div className="surface-card p-12 text-center">
        <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-5">No orders yet.</p>
        <Link to="/shop" className="inline-flex rounded-md bg-primary px-5 py-2.5 text-sm text-primary-foreground font-medium">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const items = (o.order_items as any[])?.reduce((s, i) => s + i.quantity, 0) ?? 0;
        return (
          <div key={o.id} className="surface-card p-5 flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-PK")}</div>
              <div className="text-display text-lg">{o.order_number}</div>
              <div className="text-xs text-muted-foreground">{items} item{items !== 1 && "s"} · {formatPKR(o.total_pkr)}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusColor[o.status] ?? "bg-secondary"}`}>{o.status}</span>
          </div>
        );
      })}
    </div>
  );
}
