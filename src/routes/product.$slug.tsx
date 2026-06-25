import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import {
 ShieldCheck,
 Truck,
 Zap,
 ArrowLeft,
 ShoppingCart,
 Heart,
 Star,
 GitCompareArrows,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { ImageGallery } from "@/components/site/ImageGallery";
import { ReviewsSection } from "@/components/site/ReviewsSection";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { addRecentlyViewed, getRecentlyViewed, type RVItem } from "@/lib/recently-viewed";
import { addToCompare } from "@/lib/compare";
import { catImg } from "@/lib/cat-images";

// ─── Queries ──────────────────────────────────────────────────────────────────

const productOpts = (slug: string) =>
 queryOptions({
 queryKey: ["product", slug],
 queryFn: async () => {
 const { data, error } = await supabase
 .from("products")
 .select(
 "*, categories(id,slug,name), product_images(url,alt,sort_order), reviews(rating,title,body,created_at)",
 )
 .eq("slug", slug)
 .eq("is_active", true)
 .maybeSingle();
 if (error) throw error;
 if (!data) throw notFound();
 return data;
 },
 });

const relatedOpts = (categoryId: string | null, excludeId: string) =>
 queryOptions({
 queryKey: ["related", categoryId, excludeId],
 queryFn: async () => {
 if (!categoryId) return [];
 const { data } = await supabase
 .from("products")
 .select(
 "id,slug,name,brand,price_pkr,discount_price_pkr,cover_image_url,capacity_liters,warranty_months,stock,categories(slug)",
 )
 .eq("category_id", categoryId)
 .eq("is_active", true)
 .neq("id", excludeId)
 .limit(4);
 return data ?? [];
 },
 });

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/product/$slug")({
 head: ({ params }) => ({
 meta: [
 { title: `${params.slug} Asif Brothers` },
 {
 name: "description",
 content: `View specifications and price for ${params.slug} from Asif Brothers.`,
 },
 ],
 }),
 loader: ({ context, params }) => context.queryClient.ensureQueryData(productOpts(params.slug)),
 component: ProductPage,
 notFoundComponent: () => (
 <SiteLayout>
 <div className="container-page py-32 text-center">
 <h1 className="text-display text-3xl mb-3">Product not found</h1>
 <Link to="/shop" className="text-copper underline">
 Back to shop
 </Link>
 </div>
 </SiteLayout>
 ),
});

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProductPage() {
 const { slug } = Route.useParams();
 const { data: p } = useSuspenseQuery(productOpts(slug));
 const { data: related } = useSuspenseQuery(relatedOpts((p as any).category_id, (p as any).id));
 const qc = useQueryClient();

 const [qty, setQty] = useState(1);
 const [adding, setAdding] = useState(false);
 const [signedIn, setSignedIn] = useState(false);
 const [recentlyViewed, setRecentlyViewed] = useState<RVItem[]>([]);

 useEffect(() => {
 supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
 }, []);

 // Track recently viewed
 useEffect(() => {
 const item: RVItem = {
 id: (p as any).id,
 slug: (p as any).slug,
 name: p.name,
 brand: p.brand,
 price_pkr: Number(p.price_pkr),
 discount_price_pkr: p.discount_price_pkr ? Number(p.discount_price_pkr) : null,
 cover_image_url: p.cover_image_url,
 capacity_liters: p.capacity_liters,
 warranty_months: p.warranty_months,
 stock: p.stock,
 };
 addRecentlyViewed(item);
 setRecentlyViewed(
 getRecentlyViewed()
 .filter((x) => x.id !== (p as any).id)
 .slice(0, 4),
 );
 }, [(p as any).id]);

 // Derived values
 const hasDiscount =
 p.discount_price_pkr != null && Number(p.discount_price_pkr) < Number(p.price_pkr);
 const price = hasDiscount ? Number(p.discount_price_pkr) : Number(p.price_pkr);
 const fallback = catImg[(p as any).categories?.slug ?? ""];
 const cover = p.cover_image_url || fallback;

 // Gallery images — sorted extras, fallback to cover
 const galleryImages = (() => {
 const extras: { url: string; alt: string | null }[] = ((p as any).product_images ?? [])
 .slice()
 .sort((a: any, b: any) => a.sort_order - b.sort_order)
 .map((img: any) => ({ url: img.url, alt: img.alt }));
 if (extras.length > 0) return extras;
 if (cover) return [{ url: cover, alt: p.name }];
 return [];
 })();

 const reviews: any[] = (p as any).reviews ?? [];
 const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

 // Estimated delivery window
 const deliveryMin = new Date();
 deliveryMin.setDate(deliveryMin.getDate() + 3);
 const deliveryMax = new Date();
 deliveryMax.setDate(deliveryMax.getDate() + 7);
 const fmtDate = (d: Date) =>
 d.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });

 async function addToCart() {
 if (!signedIn) {
 toast.info("Please sign in to add to cart");
 window.location.href = "/auth?redirect=" + encodeURIComponent("/product/" + slug);
 return;
 }
 setAdding(true);
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) { setAdding(false); return; }

 const { data: existing } = await supabase
 .from("cart_items")
 .select("id,quantity")
 .eq("product_id", (p as any).id)
 .maybeSingle();
 const newQty = existing ? existing.quantity + qty : qty;
 if (newQty > p.stock) {
 setAdding(false);
 return toast.error(`Only ${p.stock} available in stock.`);
 }
 const { error } = existing
 ? await supabase.from("cart_items").update({ quantity: newQty }).eq("id", existing.id)
 : await supabase.from("cart_items").insert({
 product_id: (p as any).id,
 quantity: qty,
 user_id: user.id,
 });
 setAdding(false);
 if (error) return toast.error("Could not add to cart");
 toast.success("Added to cart");
 qc.invalidateQueries({ queryKey: ["cart"] });
 }

 async function toggleWishlist() {
 if (!signedIn) {
 toast.info("Please sign in to save items");
 return;
 }
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;
 const { error } = await supabase
 .from("wishlist_items")
 .insert({ product_id: (p as any).id, user_id: user.id });
 if (error?.message.includes("duplicate")) return toast.info("Already in wishlist");
 if (error) return toast.error("Could not save");
 toast.success("Saved to wishlist");
 }

 function handleCompare() {
 const added = addToCompare({
 id: (p as any).id,
 slug: (p as any).slug,
 name: p.name,
 brand: p.brand,
 price_pkr: Number(p.price_pkr),
 discount_price_pkr: p.discount_price_pkr ? Number(p.discount_price_pkr) : null,
 cover_image_url: p.cover_image_url,
 capacity_liters: p.capacity_liters,
 warranty_months: p.warranty_months,
 stock: p.stock,
 energy_rating: p.energy_rating,
 category_name: (p as any).categories?.name ?? null,
 });
 if (added) toast.success("Added to comparison visit /compare to compare");
 else toast.info("Already in comparison list or list is full (max 3)");
 }

 const specs = (p as any).specifications as Record<string, any>;

 return (
 <SiteLayout>
 <div className="container-page py-8">
 <Link
 to="/shop"
 className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
 >
 <ArrowLeft className="h-4 w-4" /> Back to shop
 </Link>

 <div className="grid lg:grid-cols-2 gap-12">
 {/* Left: image gallery */}
 <ImageGallery images={galleryImages} productName={p.name} />

 {/* Right: product info */}
 <div className="space-y-6">
 {/* Title & meta */}
 <div>
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 {p.brand} · {(p as any).categories?.name}
 </div>
 <h1 className="text-display text-4xl md:text-5xl">{p.name}</h1>
 <p className="mt-3 text-muted-foreground">{p.short_description}</p>
 <div
 className={`inline-block mt-3 px-3 py-1.5 rounded-md text-sm font-medium ${
 p.stock <= 0
 ? "bg-destructive/10 text-destructive"
 : p.stock < 5
 ? "bg-destructive/10 text-destructive"
 : "bg-success/10 text-success"
 }`}
 >
 {p.stock <= 0
 ? "Out of stock"
 : p.stock < 5
 ? `Low Stock: Only ${p.stock} remaining`
 : `${p.stock} in stock`}
 </div>
 </div>

 {/* Rating summary */}
 {reviews.length > 0 && (
 <div className="flex items-center gap-2 text-sm">
 <div className="flex text-copper">
 {Array.from({ length: 5 }).map((_, i) => (
 <Star
 key={i}
 className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-current" : ""}`}
 />
 ))}
 </div>
 <span className="text-muted-foreground">
 {avgRating.toFixed(1)} · {reviews.length} reviews
 </span>
 </div>
 )}

 {/* Price */}
 <div className="flex items-baseline gap-3 py-4 border-y border-border">
 <span className="text-3xl font-semibold">{formatPKR(price)}</span>
 {hasDiscount && (
 <>
 <span className="text-base text-muted-foreground line-through">
 {formatPKR(p.price_pkr)}
 </span>
 <span className="ml-2 rounded bg-copper/15 text-copper px-2 py-0.5 text-xs font-semibold">
 SAVE {Math.round((1 - price / Number(p.price_pkr)) * 100)}%
 </span>
 </>
 )}
 </div>

 {/* Add-to-cart actions */}
 <div className="flex flex-wrap items-center gap-2">
 {/* Quantity selector */}
 <div className="inline-flex items-center rounded-md border border-input">
 <button
 onClick={() => setQty(Math.max(1, qty - 1))}
 className="px-3 py-2 text-muted-foreground hover:text-foreground"
 >
 −
 </button>
 <span className="px-4 py-2 text-sm font-medium">{qty}</span>
 <button
 onClick={() => setQty(Math.min(p.stock, qty + 1))}
 className="px-3 py-2 text-muted-foreground hover:text-foreground"
 >
 +
 </button>
 </div>
 <button
 disabled={adding || p.stock <= 0}
 onClick={addToCart}
 className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-5 py-3 text-sm font-medium disabled:opacity-50"
 >
 <ShoppingCart className="h-4 w-4" />
 {p.stock <= 0 ? "Out of stock" : adding ? "Adding..." : "Add to cart"}
 </button>
 <button
 onClick={toggleWishlist}
 className="grid h-11 w-11 place-items-center rounded-md border border-input text-muted-foreground hover:text-copper hover:border-copper"
 aria-label="Save to wishlist"
 >
 <Heart className="h-4 w-4" />
 </button>
 <button
 onClick={handleCompare}
 className="grid h-11 w-11 place-items-center rounded-md border border-input text-muted-foreground hover:text-copper hover:border-copper"
 aria-label="Add to comparison"
 title="Compare"
 >
 <GitCompareArrows className="h-4 w-4" />
 </button>
 </div>

 {/* Estimated delivery */}
 <div className="flex items-center gap-2.5 rounded-md border border-border bg-secondary/40 px-4 py-3 text-sm">
 <Truck className="h-4 w-4 text-copper shrink-0" />
 <span>
 <span className="font-medium text-foreground">Estimated delivery: </span>
 <span className="text-muted-foreground">
 {fmtDate(deliveryMin)} – {fmtDate(deliveryMax)}
 </span>
 </span>
 </div>

 {/* Trust badges */}
 <ul className="grid grid-cols-3 gap-3 text-xs text-center">
 <li className="surface-card p-3">
 <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-copper" />
 {p.warranty_months
 ? `${Math.round(p.warranty_months / 12)}-year warranty`
 : "Warranty"}
 </li>
 <li className="surface-card p-3">
 <Truck className="h-5 w-5 mx-auto mb-1 text-copper" />
 Nationwide delivery
 </li>
 <li className="surface-card p-3">
 <Zap className="h-5 w-5 mx-auto mb-1 text-copper" />
 {p.energy_rating ?? "Efficient"}
 </li>
 </ul>

 {/* Description */}
 <div className="surface-card p-6 space-y-4">
 <h3 className="text-display text-xl">Description</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
 </div>

 {/* Specifications */}
 {specs && Object.keys(specs).length > 0 && (
 <div className="surface-card p-6">
 <h3 className="text-display text-xl mb-4">Specifications</h3>
 <dl className="grid grid-cols-2 gap-y-3 text-sm">
 {p.capacity_liters && (
 <>
 <dt className="text-muted-foreground">Capacity</dt>
 <dd>{p.capacity_liters} L</dd>
 </>
 )}
 {p.warranty_months && (
 <>
 <dt className="text-muted-foreground">Warranty</dt>
 <dd>{p.warranty_months} months</dd>
 </>
 )}
 {p.sku && (
 <>
 <dt className="text-muted-foreground">SKU</dt>
 <dd>{p.sku}</dd>
 </>
 )}
 {Object.entries(specs).map(([k, v]) => (
 <div key={k} className="contents">
 <dt className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</dt>
 <dd>{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
 </div>
 ))}
 </dl>
 </div>
 )}

 {/* Reviews */}
 <ReviewsSection
 productId={(p as any).id}
 productSlug={(p as any).slug}
 reviews={reviews}
 signedIn={signedIn}
 />
 </div>
 </div>

 {/* Related products */}
 {related.length > 0 && (
 <section className="mt-20">
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Often paired with
 </div>
 <h2 className="text-display text-2xl mb-6">Frequently bought together</h2>
 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
 {related.map((r: any) => (
 <ProductCard
 key={r.id}
 p={r as ProductCardData}
 fallbackImg={catImg[r.categories?.slug ?? ""]}
 />
 ))}
 </div>
 </section>
 )}

 {/* Recently viewed */}
 {recentlyViewed.length > 0 && (
 <section className="mt-16 pt-10 border-t border-border">
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Your history
 </div>
 <h2 className="text-display text-2xl mb-6">Recently viewed</h2>
 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
 {recentlyViewed.map((r) => (
 <ProductCard key={r.id} p={r} fallbackImg={catImg[""]} />
 ))}
 </div>
 </section>
 )}
 </div>
 </SiteLayout>
 );
}
