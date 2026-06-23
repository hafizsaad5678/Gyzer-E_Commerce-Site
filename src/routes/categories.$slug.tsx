import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { catImg } from "@/lib/cat-images";

const opts = (slug: string) =>
 queryOptions({
 queryKey: ["category", slug],
 queryFn: async () => {
 const { data: cat, error: cErr } = await supabase
 .from("categories")
 .select("*")
 .eq("slug", slug)
 .eq("is_active", true)
 .maybeSingle();
 if (cErr) throw cErr;
 if (!cat) throw notFound();
 const { data: products } = await supabase
 .from("products")
 .select(
 "id,slug,name,brand,price_pkr,discount_price_pkr,cover_image_url,capacity_liters,warranty_months,stock",
 )
 .eq("category_id", cat.id)
 .eq("is_active", true);
 return { cat, products: products ?? [] };
 },
 });

export const Route = createFileRoute("/categories/$slug")({
 head: ({ params }) => ({
 meta: [
 { title: `${params.slug} geysers — Asif Brothers` },
 { name: "description", content: `Shop ${params.slug} geysers from Asif Brothers.` },
 ],
 }),
 loader: ({ context, params }) => context.queryClient.ensureQueryData(opts(params.slug)),
 component: CategoryPage,
 notFoundComponent: () => (
 <SiteLayout>
 <div className="container-page py-32 text-center">
 <h1 className="text-display text-3xl mb-3">Category not found</h1>
 <Link to="/categories" className="text-copper underline">
 All categories
 </Link>
 </div>
 </SiteLayout>
 ),
});

function CategoryPage() {
 const { slug } = Route.useParams();
 const { data } = useSuspenseQuery(opts(slug));
 const { cat, products } = data;
 return (
 <SiteLayout>
 <section className="container-page py-12 md:py-16">
 <Link to="/categories" className="text-sm text-muted-foreground hover:text-foreground">
 ← All categories
 </Link>
 <div className="my-6">
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Category
 </div>
 <h1 className="text-display text-4xl md:text-5xl mb-3">{cat.name}</h1>
 <p className="text-muted-foreground max-w-2xl">{cat.description}</p>
 </div>
 {products.length === 0 ? (
 <p className="text-muted-foreground">No products in this category yet.</p>
 ) : (
 <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
 {products.map((p) => (
 <ProductCard key={p.id} p={p as ProductCardData} fallbackImg={catImg[slug]} />
 ))}
 </div>
 )}
 </section>
 </SiteLayout>
 );
}
