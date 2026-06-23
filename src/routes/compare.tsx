import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getCompareList, removeFromCompare, clearCompare, type CompareItem } from "@/lib/compare";
import { formatPKR } from "@/lib/format";
import { X, ShoppingCart, GitCompareArrows } from "lucide-react";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [{ title: "Compare Geysers — Asif Brothers" }] }),
  component: ComparePage,
});

const ROWS: { label: string; key: keyof CompareItem; fmt?: (v: any) => string }[] = [
  { label: "Brand", key: "brand" },
  { label: "Category", key: "category_name" },
  { label: "Price", key: "price_pkr", fmt: (v) => formatPKR(v) },
  { label: "Sale price", key: "discount_price_pkr", fmt: (v) => (v ? formatPKR(v) : "—") },
  { label: "Capacity", key: "capacity_liters", fmt: (v) => (v ? `${v} L` : "—") },
  { label: "Warranty", key: "warranty_months", fmt: (v) => (v ? `${Math.round(v / 12)} yr` : "—") },
  { label: "Energy rating", key: "energy_rating", fmt: (v) => v ?? "—" },
  { label: "Stock", key: "stock", fmt: (v) => (v > 0 ? `${v} units` : "Out of stock") },
];

function ComparePage() {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    setItems(getCompareList());
  }, []);

  function remove(id: string) {
    removeFromCompare(id);
    setItems(getCompareList());
  }

  function clear() {
    clearCompare();
    setItems([]);
  }

  return (
    <SiteLayout>
      <section className="container-page py-12">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
              Compare
            </div>
            <h1 className="text-display text-4xl">Compare geysers</h1>
          </div>
          {items.length > 0 && (
            <button
              onClick={clear}
              className="text-sm text-muted-foreground hover:text-destructive"
            >
              Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="surface-card p-16 text-center space-y-4">
            <GitCompareArrows className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No products added for comparison yet.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="w-36 p-0" />
                  {items.map((item) => (
                    <th key={item.id} className="p-3 text-left align-top">
                      <div className="surface-card p-3 relative">
                        <button
                          onClick={() => remove(item.id)}
                          className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-destructive"
                          aria-label="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <Link to="/product/$slug" params={{ slug: item.slug }}>
                          <div className="aspect-square bg-steel/30 rounded-md overflow-hidden mb-3">
                            {item.cover_image_url ? (
                              <img
                                src={item.cover_image_url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full grid place-items-center text-[10px] text-muted-foreground">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="text-sm font-semibold leading-snug hover:text-copper transition-colors line-clamp-2">
                            {item.name}
                          </div>
                        </Link>
                        <div className="mt-2 text-sm font-bold text-foreground">
                          {formatPKR(item.discount_price_pkr ?? item.price_pkr)}
                        </div>
                        <Link
                          to="/product/$slug"
                          params={{ slug: item.slug }}
                          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-secondary/80 hover:bg-copper hover:text-copper-foreground px-3 py-2 text-xs font-medium transition-colors"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> View product
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.key} className="border-t border-border">
                    <td className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {row.label}
                    </td>
                    {items.map((item) => {
                      const val = item[row.key];
                      const display = row.fmt ? row.fmt(val) : (val ?? "—");
                      return (
                        <td key={item.id} className="py-3 px-3 text-sm">
                          {String(display)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-6">
          You can compare up to 3 products. Add more from any product page using the{" "}
          <GitCompareArrows className="h-3.5 w-3.5 inline" /> icon.
        </p>
      </section>
    </SiteLayout>
  );
}
