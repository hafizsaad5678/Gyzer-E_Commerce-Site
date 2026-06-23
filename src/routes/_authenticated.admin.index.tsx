import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { Package, AlertTriangle, ShoppingCart, TrendingUp, Users, BarChart2 } from "lucide-react";
import {
 AreaChart,
 Area,
 BarChart,
 Bar,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 PieChart,
 Pie,
 Cell,
 Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({
 component: Dashboard,
});

// Build last-30-days revenue chart data from orders array
function buildRevenueChart(orders: any[]) {
 const map: Record<string, number> = {};
 const now = new Date();
 for (let i = 29; i >= 0; i--) {
 const d = new Date(now);
 d.setDate(d.getDate() - i);
 const key = d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" });
 map[key] = 0;
 }
 orders.forEach((o) => {
 const key = new Date(o.created_at).toLocaleDateString("en-PK", {
 day: "2-digit",
 month: "short",
 });
 if (key in map) map[key] += Number(o.total_pkr);
 });
 return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
}

// Build order status breakdown
function buildStatusChart(orders: any[]) {
 const map: Record<string, number> = {};
 orders.forEach((o) => {
 map[o.status] = (map[o.status] ?? 0) + 1;
 });
 return Object.entries(map).map(([name, value]) => ({ name, value }));
}

const STATUS_COLORS: Record<string, string> = {
 pending: "#94a3b8",
 paid: "#22c55e",
 processing: "#f59e0b",
 shipped: "#3b82f6",
 delivered: "#10b981",
 cancelled: "#ef4444",
 refunded: "#f43f5e",
};

function Dashboard() {
 const [stats, setStats] = useState<any>({
 revenue: 0,
 orders: 0,
 products: 0,
 customers: 0,
 lowStock: [],
 });
 const [recent, setRecent] = useState<any[]>([]);
 const [revenueData, setRevenueData] = useState<any[]>([]);
 const [statusData, setStatusData] = useState<any[]>([]);
 const [topProducts, setTopProducts] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 (async () => {
 const [
 { data: allOrders },
 { data: products },
 { data: lowStock },
 { data: recentOrders },
 { data: customers },
 { data: orderItems },
 ] = await Promise.all([
 supabase
 .from("orders")
 .select("id,total_pkr,status,payment_status,created_at")
 .order("created_at"),
 supabase.from("products").select("id"),
 supabase
 .from("products")
 .select("id,name,sku,stock,low_stock_threshold")
 .lte("stock", 5)
 .order("stock"),
 supabase
 .from("orders")
 .select("id,order_number,email,total_pkr,status,created_at")
 .order("created_at", { ascending: false })
 .limit(8),
 supabase.from("profiles").select("id"),
 supabase.from("order_items").select("product_id,product_name,quantity,subtotal_pkr"),
 ]);

 const orders = allOrders ?? [];
 const revenue = orders.reduce((s, o) => s + Number(o.total_pkr), 0);

 // Top products by revenue
 const productMap: Record<string, { name: string; revenue: number; qty: number }> = {};
 (orderItems ?? []).forEach((oi: any) => {
 const key = oi.product_id ?? oi.product_name;
 if (!productMap[key]) productMap[key] = { name: oi.product_name, revenue: 0, qty: 0 };
 productMap[key].revenue += Number(oi.subtotal_pkr);
 productMap[key].qty += Number(oi.quantity);
 });
 const top = Object.values(productMap)
 .sort((a, b) => b.revenue - a.revenue)
 .slice(0, 6);

 setStats({
 revenue,
 orders: orders.length,
 products: products?.length ?? 0,
 customers: customers?.length ?? 0,
 lowStock: lowStock ?? [],
 });
 setRecent(recentOrders ?? []);
 setRevenueData(buildRevenueChart(orders));
 setStatusData(buildStatusChart(orders));
 setTopProducts(top);
 setLoading(false);
 })();
 }, []);

 if (loading) {
 return (
 <div className="space-y-6 animate-pulse">
 <div className="h-8 bg-secondary rounded w-48" />
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {[...Array(4)].map((_, i) => (
 <div key={i} className="surface-card h-24" />
 ))}
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-8">
 {/* Header */}
 <div>
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Overview
 </div>
 <h1 className="text-display text-4xl">Analytics Dashboard</h1>
 </div>

 {/* KPI cards */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <Stat icon={TrendingUp} label="Total revenue" value={formatPKR(stats.revenue)} />
 <Stat icon={ShoppingCart} label="Total orders" value={stats.orders.toLocaleString()} />
 <Stat icon={Package} label="Products" value={stats.products.toLocaleString()} />
 <Stat icon={Users} label="Customers" value={stats.customers.toLocaleString()} />
 </div>

 {/* Revenue area chart */}
 <div className="surface-card p-6">
 <div className="flex items-center justify-between mb-5">
 <h2 className="text-display text-xl">Revenue — last 30 days</h2>
 <span className="text-xs text-muted-foreground">{formatPKR(stats.revenue)} total</span>
 </div>
 <ResponsiveContainer width="100%" height={220}>
 <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
 <defs>
 <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#b87333" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#b87333" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
 <XAxis
 dataKey="date"
 tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
 tickLine={false}
 axisLine={false}
 interval={4}
 />
 <YAxis
 tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
 tickLine={false}
 axisLine={false}
 tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`}
 />
 <Tooltip
 contentStyle={{
 background: "var(--card)",
 border: "1px solid var(--border)",
 borderRadius: 8,
 fontSize: 12,
 }}
 formatter={(v: any) => [formatPKR(v), "Revenue"]}
 />
 <Area
 type="monotone"
 dataKey="revenue"
 stroke="#b87333"
 strokeWidth={2}
 fill="url(#revGrad)"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>

 <div className="grid lg:grid-cols-2 gap-6">
 {/* Top products bar chart */}
 <div className="surface-card p-6">
 <div className="flex items-center gap-2 mb-5">
 <BarChart2 className="h-4 w-4 text-copper" />
 <h2 className="text-display text-xl">Top products by revenue</h2>
 </div>
 {topProducts.length === 0 ? (
 <p className="text-sm text-muted-foreground">No sales data yet.</p>
 ) : (
 <ResponsiveContainer width="100%" height={220}>
 <BarChart
 data={topProducts}
 layout="vertical"
 margin={{ left: 8, right: 16, top: 0, bottom: 0 }}
 >
 <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
 <XAxis
 type="number"
 tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
 tickLine={false}
 axisLine={false}
 tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
 />
 <YAxis
 type="category"
 dataKey="name"
 tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
 tickLine={false}
 axisLine={false}
 width={100}
 />
 <Tooltip
 contentStyle={{
 background: "var(--card)",
 border: "1px solid var(--border)",
 borderRadius: 8,
 fontSize: 12,
 }}
 formatter={(v: any) => [formatPKR(v), "Revenue"]}
 />
 <Bar dataKey="revenue" fill="#b87333" radius={[0, 4, 4, 0]} />
 </BarChart>
 </ResponsiveContainer>
 )}
 </div>

 {/* Order status pie */}
 <div className="surface-card p-6">
 <h2 className="text-display text-xl mb-5">Orders by status</h2>
 {statusData.length === 0 ? (
 <p className="text-sm text-muted-foreground">No orders yet.</p>
 ) : (
 <ResponsiveContainer width="100%" height={220}>
 <PieChart>
 <Pie
 data={statusData}
 dataKey="value"
 nameKey="name"
 cx="50%"
 cy="50%"
 outerRadius={80}
 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
 labelLine={false}
 >
 {statusData.map((entry) => (
 <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
 ))}
 </Pie>
 <Tooltip
 contentStyle={{
 background: "var(--card)",
 border: "1px solid var(--border)",
 borderRadius: 8,
 fontSize: 12,
 }}
 />
 <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
 </PieChart>
 </ResponsiveContainer>
 )}
 </div>
 </div>

 <div className="grid lg:grid-cols-2 gap-6">
 {/* Recent orders */}
 <div className="surface-card p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-display text-xl">Recent orders</h2>
 <Link to="/admin/orders" className="text-xs text-copper hover:underline">
 View all
 </Link>
 </div>
 {recent.length === 0 ? (
 <p className="text-sm text-muted-foreground">No orders yet.</p>
 ) : (
 <div className="divide-y divide-border">
 {recent.map((o) => (
 <div key={o.id} className="py-3 flex justify-between gap-3">
 <div className="min-w-0">
 <div className="text-sm font-medium truncate">{o.order_number}</div>
 <div className="text-xs text-muted-foreground truncate">{o.email}</div>
 </div>
 <div className="text-right shrink-0">
 <div className="text-sm font-semibold">{formatPKR(o.total_pkr)}</div>
 <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
 {o.status}
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Low stock */}
 <div className="surface-card p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-display text-xl">Low stock alerts</h2>
 {stats.lowStock.length > 0 && (
 <span className="rounded-full bg-destructive/10 text-destructive text-xs font-semibold px-2.5 py-1">
 {stats.lowStock.length} items
 </span>
 )}
 </div>
 {stats.lowStock.length === 0 ? (
 <p className="text-sm text-muted-foreground">All products well stocked.</p>
 ) : (
 <div className="space-y-2">
 {stats.lowStock.map((p: any) => (
 <div
 key={p.id}
 className="flex justify-between items-center py-2.5 border-b border-border last:border-0"
 >
 <div>
 <div className="text-sm font-medium">{p.name}</div>
 <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
 </div>
 <span className="rounded-full bg-destructive/10 text-destructive px-2.5 py-0.5 text-xs font-semibold">
 {p.stock} left
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

function Stat({
 icon: Icon,
 label,
 value,
 accent,
}: {
 icon: any;
 label: string;
 value: string;
 accent?: boolean;
}) {
 return (
 <div className={`surface-card p-5 ${accent ? "ring-1 ring-destructive/30" : ""}`}>
 <Icon className={`h-5 w-5 mb-3 ${accent ? "text-destructive" : "text-copper"}`} />
 <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
 <div className="text-display text-2xl">{value}</div>
 </div>
 );
}
