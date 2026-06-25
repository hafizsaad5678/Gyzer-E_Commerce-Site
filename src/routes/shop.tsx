import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { supabase } from "@/integrations/supabase/client";
import { catImg } from "@/lib/cat-images";

const searchSchema = z.object({
 q: z.string().optional(),
 category: z.string().optional(),
 sort: z.enum(["new", "price_asc", "price_desc"]).optional(),
 brand: z.string().optional(),
 capacity: z.string().optional(),
});

const shopOpts = () =>
 queryOptions({
 queryKey: ["products", "all"],
 queryFn: async () => {
 const { data, error } = await supabase
 .from("products")
 .select(
 "id,slug,name,brand,price_pkr,discount_price_pkr,cover_image_url,capacity_liters,warranty_months,stock,categories(slug,name)",
 )
 .eq("is_active", true);
 if (error) throw error;
 return data ?? [];
 },
 });

// NOTE: uses ["categories","list"] — not ["categories"] — to avoid a cache
// collision with index.tsx which selects different fields under ["categories"].
const catsOpts = queryOptions({
 queryKey: ["categories", "list"],
 queryFn: async () => {
 const { data, error } = await supabase
 .from("categories")
 .select("id,slug,name")
 .eq("is_active", true)
 .order("sort_order");
 if (error) throw error;
 return data ?? [];
 },
});

export const Route = createFileRoute("/shop")({
 validateSearch: searchSchema,
 head: () => ({
 meta: [
 { title: "Shop Geysers — Asif Brothers" },
 {
 name: "description",
 content:
 "Browse all electric, gas, instant and solar geysers from Asif Brothers. Filter by category, price, and capacity.",
 },
 { property: "og:title", content: "Shop Geysers Asif Brothers" },
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
 const [maxPrice, setMaxPrice] = useState<number>(250_000);
 const [brand, setBrand] = useState(search.brand ?? "");
 const [capacity, setCapacity] = useState(search.capacity ?? "");

 // Sync filter state when URL search params change
 useEffect(() => {
 setQ(search.q ?? "");
 setCat(search.category ?? "");
 setSort(search.sort ?? "new");
 setBrand(search.brand ?? "");
 setCapacity(search.capacity ?? "");
 }, [search.q, search.category, search.sort, search.brand, search.capacity]);

 const allBrands = useMemo(() => {
 const set = new Set<string>();
 (products as any[]).forEach((p) => {
 if (p.brand) set.add(p.brand);
 });
 return Array.from(set).sort();
 }, [products]);

 const allCapacities = useMemo(() => {
 const set = new Set<number>();
 (products as any[]).forEach((p) => {
 if (p.capacity_liters) set.add(Number(p.capacity_liters));
 });
 return Array.from(set).sort((a, b) => a - b);
 }, [products]);

 const filtered = useMemo(() => {
 let list = products as any[];
 if (q)
 list = list.filter(
 (p) =>
 p.name.toLowerCase().includes(q.toLowerCase()) ||
 (p.brand ?? "").toLowerCase().includes(q.toLowerCase()),
 );
 if (cat) list = list.filter((p) => p.categories?.slug === cat);
 if (brand) list = list.filter((p) => p.brand === brand);
 if (capacity) list = list.filter((p) => String(p.capacity_liters) === capacity);
 list = list.filter((p) => Number(p.discount_price_pkr ?? p.price_pkr) <= maxPrice);
 if (sort === "price_asc")
 list = [...list].sort(
 (a, b) =>
 Number(a.discount_price_pkr ?? a.price_pkr) - Number(b.discount_price_pkr ?? b.price_pkr),
 );
 else if (sort === "price_desc")
 list = [...list].sort(
 (a, b) =>
 Number(b.discount_price_pkr ?? b.price_pkr) - Number(a.discount_price_pkr ?? a.price_pkr),
 );
 return list;
 }, [products, q, cat, sort, maxPrice, brand, capacity]);

 const hasFilters = !!(q || cat || brand || capacity || maxPrice < 250_000);

 function clearAll() {
 setQ("");
 setCat("");
 setBrand("");
 setCapacity("");
 setMaxPrice(250_000);
 setSort("new");
 }

 return (
 <SiteLayout>
 <section className="container-page py-12 md:py-16">
 {/* Page header */}
 <div className="mb-8">
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Shop
 </div>
 <h1 className="text-display text-4xl md:text-5xl mb-3">All geysers</h1>
 <div className="flex items-center justify-between gap-4 flex-wrap">
 <p className="text-muted-foreground">
 {filtered.length} product{filtered.length !== 1 && "s"} available. Free delivery on
 orders over Rs 50,000.
 </p>
 {hasFilters && (
 <button onClick={clearAll} className="text-xs text-copper hover:underline">
 Clear all filters
 </button>
 )}
 </div>
 </div>

 <div className="grid lg:grid-cols-[260px_1fr] gap-8">
 {/* Sidebar filters */}
 <aside className="lg:sticky lg:top-20 lg:self-start">
 <ShopFilters
 q={q}
 onQ={setQ}
 cat={cat}
 onCat={setCat}
 brand={brand}
 onBrand={setBrand}
 capacity={capacity}
 onCapacity={setCapacity}
 maxPrice={maxPrice}
 onMaxPrice={setMaxPrice}
 sort={sort}
 onSort={(v: any) => setSort(v)}
 categories={cats}
 allBrands={allBrands}
 allCapacities={allCapacities}
 />
 </aside>

 {/* Product grid */}
 <div>
 {filtered.length === 0 ? (
 <div className="surface-card p-12 text-center text-muted-foreground">
 No products match your filters.
 </div>
 ) : (
 <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
 {filtered.map((p) => (
 <ProductCard
 key={p.id}
 p={p as ProductCardData}
 fallbackImg={catImg[p.categories?.slug ?? ""]}
 />
 ))}
 </div>
 )}
 </div>
 </div>
 </section>
 </SiteLayout>
 );
}
