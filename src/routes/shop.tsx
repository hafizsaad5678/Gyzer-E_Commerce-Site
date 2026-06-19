import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import imgElectric from "@/assets/product-electric.jpg";
import imgGas from "@/assets/product-gas.jpg";
import imgInstant from "@/assets/product-instant.jpg";
import imgSolar from "@/assets/product-solar.jpg";

const catImg: Record<string, string> = { electric: imgElectric, gas: imgGas, instant: imgInstant, solar: imgSolar };

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["new", "price_asc", "price_desc"]).optional(),
});

const shopOpts = () =>
  queryOptions({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,name,brand,price_pkr,discount_price_pkr,cover_image_url,capacity_liters,warranty_months,stock,categories(slug,name)")
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

const catsOpts = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("id,slug,name").eq("is_active", true).order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Shop Geysers — Asif Brothers" },
      { name: "description", content: "Browse all electric, gas, instant and solar geysers from Asif Brothers. Filter by category, price, and capacity." },
      { property: "og:title", content: "Shop Geysers — Asif Brothers" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(shopOpts()),
      context.queryClient.ensureQueryData(catsOpts),
    ]);
  },
  component: Shop,
});

function Shop() {
  const { data: products } = useSuspenseQuery(shopOpts());
  const { data: cats } = useSuspenseQuery(catsOpts);
  const search = useSearch({ from: "/shop" });
  const [q, setQ] = useState(search.q ?? "");
  const [cat, setCat] = useState(search.category ?? "");
  const [sort, setSort] = useState(search.sort ?? "new");
  const [maxPrice, setMaxPrice] = useState<number>(250000);

  useEffect(() => {
    setQ(search.q ?? "");
    setCat(search.category ?? "");
    setSort(search.sort ?? "new");
  }, [search.q, search.category, search.sort]);

  const filtered = useMemo(() => {
    let list = products as any[];
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (cat) list = list.filter((p) => p.categories?.slug === cat);
    list = list.filter((p) => Number(p.discount_price_pkr ?? p.price_pkr) <= maxPrice);
    if (sort === "price_asc") list = [...list].sort((a, b) => Number(a.discount_price_pkr ?? a.price_pkr) - Number(b.discount_price_pkr ?? b.price_pkr));
    else if (sort === "price_desc") list = [...list].sort((a, b) => Number(b.discount_price_pkr ?? b.price_pkr) - Number(a.discount_price_pkr ?? a.price_pkr));
    return list;
  }, [products, q, cat, sort, maxPrice]);

  return (
    <SiteLayout>
      <section className="container-page py-12 md:py-16">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Shop</div>
          <h1 className="text-display text-4xl md:text-5xl mb-3">All geysers</h1>
          <p className="text-muted-foreground max-w-2xl">{filtered.length} products available. Free delivery on orders over Rs 50,000.</p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <div className="surface-card p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Search</label>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a geyser..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
                <div className="space-y-1.5">
                  <button onClick={() => setCat("")} className={`block w-full text-left text-sm px-2 py-1.5 rounded-md ${!cat ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary"}`}>All</button>
                  {cats.map((c) => (
                    <button key={c.id} onClick={() => setCat(c.slug)} className={`block w-full text-left text-sm px-2 py-1.5 rounded-md ${cat === c.slug ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary"}`}>{c.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Max price: Rs {maxPrice.toLocaleString()}</label>
                <input type="range" min={10000} max={250000} step={5000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-copper" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Sort by</label>
                <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="new">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </aside>

          <div>
            {filtered.length === 0 ? (
              <div className="surface-card p-12 text-center text-muted-foreground">No products match your filters.</div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((p) => (
                  <ProductCard key={p.id} p={p as ProductCardData} fallbackImg={catImg[p.categories?.slug ?? ""]} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
