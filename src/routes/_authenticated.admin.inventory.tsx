import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { toast } from "sonner";
import { AlertTriangle, Package, Search, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import { StockInput } from "@/components/admin/StockInput";

// ─── Query ────────────────────────────────────────────────────────────────────

const inventoryOpts = queryOptions({
  queryKey: ["admin-inventory"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,sku,brand,stock,low_stock_threshold,price_pkr,discount_price_pkr,is_active,categories(name)",
      )
      .order("stock", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  loader: ({ context }) => context.queryClient.ensureQueryData(inventoryOpts),
  component: AdminInventory,
});

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type SortKey = "name" | "stock" | "price" | "category";
type SortDir = "asc" | "desc";

function sortProducts(products: any[], key: SortKey, dir: SortDir) {
  return [...products].sort((a, b) => {
    let va: any, vb: any;
    if (key === "name") { va = a.name; vb = b.name; }
    else if (key === "stock") { va = a.stock; vb = b.stock; }
    else if (key === "price") {
      va = Number(a.discount_price_pkr ?? a.price_pkr);
      vb = Number(b.discount_price_pkr ?? b.price_pkr);
    } else {
      va = a.categories?.name ?? "";
      vb = b.categories?.name ?? "";
    }
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

function AdminInventory() {
  const qc = useQueryClient();
  const { data: products } = useSuspenseQuery(inventoryOpts);

  const [q, setQ] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("stock");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const stockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      if (Number.isNaN(stock) || stock < 0) throw new Error("Invalid stock value");
      const { error } = await supabase.from("products").update({ stock }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stock updated");
      qc.invalidateQueries({ queryKey: ["admin-inventory"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Summary stats
  const totalProducts  = products.length;
  const lowStockCount  = products.filter((p) => p.stock <= p.low_stock_threshold).length;
  const outOfStock     = products.filter((p) => p.stock === 0).length;
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.stock * Number(p.discount_price_pkr ?? p.price_pkr),
    0,
  );

  // Filter + sort
  const filtered = sortProducts(
    products.filter((p) => {
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.sku.toLowerCase().includes(q.toLowerCase()) ||
        (p.brand ?? "").toLowerCase().includes(q.toLowerCase());
      const matchLow = !showLowOnly || p.stock <= p.low_stock_threshold;
      return matchQ && matchLow;
    }),
    sortKey,
    sortDir,
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="h-3 w-3 inline-block" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 inline-block ml-0.5" />
    ) : (
      <ArrowDown className="h-3 w-3 inline-block ml-0.5" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
            Warehouse
          </div>
          <h1 className="text-display text-4xl">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalProducts} products · stock value {formatPKR(totalStockValue)}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["admin-inventory"] })}
          className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary transition-colors"
          aria-label="Refresh inventory"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Package}
          label="Total Products"
          value={totalProducts}
          colorCls="text-copper"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Low Stock"
          value={lowStockCount}
          colorCls="text-amber-500"
          accent={lowStockCount > 0}
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Out of Stock"
          value={outOfStock}
          colorCls="text-destructive"
          accent={outOfStock > 0}
        />
        <div className="surface-card p-5">
          <Package className="h-5 w-5 mb-3 text-emerald-500" />
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Stock Value
          </div>
          <div className="text-display text-2xl">{formatPKR(totalStockValue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, SKU, or brand…"
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => setShowLowOnly((v) => !v)}
          className={[
            "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
            showLowOnly
              ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
              : "border-input hover:bg-secondary",
          ].join(" ")}
        >
          <AlertTriangle className="h-4 w-4" />
          {showLowOnly ? "Showing low stock only" : "Show low stock only"}
        </button>
        <span className="text-sm text-muted-foreground">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th
                  className="text-left px-4 py-3 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort("name")}
                >
                  Product <SortIcon col="name" />
                </th>
                <th
                  className="text-left px-4 py-3 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort("category")}
                >
                  Category <SortIcon col="category" />
                </th>
                <th className="text-left px-4 py-3">SKU</th>
                <th
                  className="text-right px-4 py-3 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort("price")}
                >
                  Price <SortIcon col="price" />
                </th>
                <th
                  className="text-right px-4 py-3 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort("stock")}
                >
                  Stock <SortIcon col="stock" />
                </th>
                <th className="text-right px-4 py-3">Threshold</th>
                <th className="text-right px-4 py-3">Stock Value</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.low_stock_threshold;
                  const isOut = p.stock === 0;
                  const stockValue = p.stock * Number(p.discount_price_pkr ?? p.price_pkr);

                  return (
                    <tr
                      key={p.id}
                      className={
                        isOut
                          ? "bg-destructive/5"
                          : isLow
                          ? "bg-amber-500/5"
                          : ""
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.name}</div>
                        {p.brand && (
                          <div className="text-xs text-muted-foreground">{p.brand}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(p as any).categories?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatPKR(p.discount_price_pkr ?? p.price_pkr)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StockInput
                          product={p}
                          onSave={(id, stock) => stockMutation.mutate({ id, stock })}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {p.low_stock_threshold}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatPKR(stockValue)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOut ? (
                          <span className="rounded-full bg-destructive/10 text-destructive px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap">
                            Out of stock
                          </span>
                        ) : isLow ? (
                          <span className="rounded-full bg-amber-500/10 text-amber-600 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap">
                            Low stock
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-[11px] font-semibold">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  colorCls,
  accent = false,
}: {
  icon: any;
  label: string;
  value: number;
  colorCls: string;
  accent?: boolean;
}) {
  return (
    <div className={`surface-card p-5 ${accent ? "ring-1 ring-current/20" : ""}`}>
      <Icon className={`h-5 w-5 mb-3 ${colorCls}`} />
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="text-display text-2xl">{value}</div>
    </div>
  );
}
