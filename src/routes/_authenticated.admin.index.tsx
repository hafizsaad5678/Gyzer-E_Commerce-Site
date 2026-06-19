import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { Package, AlertTriangle, ShoppingCart, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState<any>({ revenue: 0, orders: 0, products: 0, lowStock: [] });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: orders }, { data: products }, { data: lowStock }, { data: recentOrders }] = await Promise.all([
        supabase.from("orders").select("total_pkr,status,payment_status"),
        supabase.from("products").select("id"),
        supabase.from("products").select("id,name,sku,stock,low_stock_threshold").lte("stock", 5).order("stock"),
        supabase.from("orders").select("id,order_number,email,total_pkr,status,created_at").order("created_at", { ascending: false }).limit(8),
      ]);
      const revenue = (orders ?? []).filter((o) => o.payment_status === "succeeded").reduce((s, o) => s + Number(o.total_pkr), 0);
      setStats({ revenue, orders: orders?.length ?? 0, products: products?.length ?? 0, lowStock: lowStock ?? [] });
      setRecent(recentOrders ?? []);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Overview</div>
        <h1 className="text-display text-4xl">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={TrendingUp} label="Revenue (paid)" value={formatPKR(stats.revenue)} />
        <Stat icon={ShoppingCart} label="Total orders" value={stats.orders.toString()} />
        <Stat icon={Package} label="Products" value={stats.products.toString()} />
        <Stat icon={AlertTriangle} label="Low stock" value={stats.lowStock.length.toString()} accent={stats.lowStock.length > 0} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="surface-card p-6">
          <h2 className="text-display text-xl mb-4">Recent orders</h2>
          {recent.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : (
            <div className="divide-y divide-border">
              {recent.map((o) => (
                <div key={o.id} className="py-3 flex justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground truncate">{o.email}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold">{formatPKR(o.total_pkr)}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="surface-card p-6">
          <h2 className="text-display text-xl mb-4">Low stock alerts</h2>
          {stats.lowStock.length === 0 ? <p className="text-sm text-muted-foreground">All products well stocked.</p> : (
            <div className="space-y-2">
              {stats.lowStock.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.sku}</div>
                  </div>
                  <span className="rounded-full bg-destructive/10 text-destructive px-2.5 py-0.5 text-xs font-semibold">{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`surface-card p-5 ${accent ? "ring-1 ring-destructive/30" : ""}`}>
      <Icon className={`h-5 w-5 mb-3 ${accent ? "text-destructive" : "text-copper"}`} />
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="text-display text-2xl">{value}</div>
    </div>
  );
}
