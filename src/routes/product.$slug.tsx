import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Truck, Zap, ArrowLeft, ShoppingCart, Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import imgElectric from "@/assets/product-electric.jpg";
import imgGas from "@/assets/product-gas.jpg";
import imgInstant from "@/assets/product-instant.jpg";
import imgSolar from "@/assets/product-solar.jpg";

const catImg: Record<string, string> = { electric: imgElectric, gas: imgGas, instant: imgInstant, solar: imgSolar };

const productOpts = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(id,slug,name), product_images(url,alt,sort_order), reviews(rating,title,body,created_at)")
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
        .select("id,slug,name,brand,price_pkr,discount_price_pkr,cover_image_url,capacity_liters,warranty_months,stock,categories(slug)")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .neq("id", excludeId)
        .limit(4);
      return data ?? [];
    },
  });

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Asif Brothers` },
      { name: "description", content: `View specifications and price for ${params.slug} from Asif Brothers.` },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productOpts(params.slug)),
  component: ProductPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-page py-32 text-center">
        <h1 className="text-display text-3xl mb-3">Product not found</h1>
        <Link to="/shop" className="text-copper underline">Back to shop</Link>
      </div>
    </SiteLayout>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productOpts(slug));
  const { data: related } = useSuspenseQuery(relatedOpts((p as any).category_id, (p as any).id));
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, []);

  const hasDiscount = p.discount_price_pkr != null && Number(p.discount_price_pkr) < Number(p.price_pkr);
  const price = hasDiscount ? Number(p.discount_price_pkr) : Number(p.price_pkr);
  const fallback = catImg[(p as any).categories?.slug ?? ""];
  const cover = p.cover_image_url || fallback;
  const reviews: any[] = (p as any).reviews ?? [];
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function addToCart() {
    if (!signedIn) { toast.info("Please sign in to add to cart"); window.location.href = "/auth?redirect=" + encodeURIComponent("/product/" + slug); return; }
    setAdding(true);
    const { data: existing } = await supabase.from("cart_items").select("id,quantity").eq("product_id", (p as any).id).maybeSingle();
    const { error } = existing
      ? await supabase.from("cart_items").update({ quantity: existing.quantity + qty }).eq("id", existing.id)
      : await supabase.from("cart_items").insert({ product_id: (p as any).id, quantity: qty, user_id: (await supabase.auth.getUser()).data.user!.id });
    setAdding(false);
    if (error) return toast.error("Could not add to cart");
    toast.success("Added to cart");
    qc.invalidateQueries({ queryKey: ["cart"] });
  }

  async function toggleWishlist() {
    if (!signedIn) { toast.info("Please sign in to save items"); return; }
    const uid = (await supabase.auth.getUser()).data.user!.id;
    const { error } = await supabase.from("wishlist_items").insert({ product_id: (p as any).id, user_id: uid });
    if (error && error.message.includes("duplicate")) return toast.info("Already in wishlist");
    if (error) return toast.error("Could not save");
    toast.success("Saved to wishlist");
  }

  const specs = (p as any).specifications as Record<string, any>;

  return (
    <SiteLayout>
      <div className="container-page py-8">
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" /> Back to shop</Link>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="surface-card overflow-hidden aspect-square bg-steel/30">
            {cover ? <img src={cover} alt={p.name} width={800} height={800} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground">No image</div>}
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">{p.brand} · {(p as any).categories?.name}</div>
              <h1 className="text-display text-4xl md:text-5xl">{p.name}</h1>
              <p className="mt-3 text-muted-foreground">{p.short_description}</p>
            </div>

            {reviews.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex text-copper">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-current" : ""}`} />)}</div>
                <span className="text-muted-foreground">{avgRating.toFixed(1)} · {reviews.length} reviews</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 py-4 border-y border-border">
              <span className="text-3xl font-semibold">{formatPKR(price)}</span>
              {hasDiscount && <span className="text-base text-muted-foreground line-through">{formatPKR(p.price_pkr)}</span>}
              {hasDiscount && <span className="ml-2 rounded bg-copper/15 text-copper px-2 py-0.5 text-xs font-semibold">SAVE {Math.round((1 - price/Number(p.price_pkr))*100)}%</span>}
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-md border border-input">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-muted-foreground hover:text-foreground">−</button>
                <span className="px-4 py-2 text-sm font-medium">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-muted-foreground hover:text-foreground">+</button>
              </div>
              <button disabled={adding || p.stock <= 0} onClick={addToCart} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                <ShoppingCart className="h-4 w-4" /> {p.stock <= 0 ? "Out of stock" : adding ? "Adding..." : "Add to cart"}
              </button>
              <button onClick={toggleWishlist} className="grid h-11 w-11 place-items-center rounded-md border border-input text-muted-foreground hover:text-copper hover:border-copper" aria-label="Save">
                <Heart className="h-4 w-4" />
              </button>
            </div>

            <ul className="grid grid-cols-3 gap-3 text-xs">
              <li className="surface-card p-3 text-center"><ShieldCheck className="h-5 w-5 mx-auto mb-1 text-copper" />{p.warranty_months ? `${Math.round(p.warranty_months/12)}-year warranty` : "Warranty"}</li>
              <li className="surface-card p-3 text-center"><Truck className="h-5 w-5 mx-auto mb-1 text-copper" />Nationwide delivery</li>
              <li className="surface-card p-3 text-center"><Zap className="h-5 w-5 mx-auto mb-1 text-copper" />{p.energy_rating ?? "Efficient"}</li>
            </ul>

            <div className="surface-card p-6 space-y-4">
              <h3 className="text-display text-xl">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>

            {specs && Object.keys(specs).length > 0 && (
              <div className="surface-card p-6">
                <h3 className="text-display text-xl mb-4">Specifications</h3>
                <dl className="grid grid-cols-2 gap-y-3 text-sm">
                  {p.capacity_liters && (<><dt className="text-muted-foreground">Capacity</dt><dd>{p.capacity_liters} L</dd></>)}
                  {p.warranty_months && (<><dt className="text-muted-foreground">Warranty</dt><dd>{p.warranty_months} months</dd></>)}
                  {p.sku && (<><dt className="text-muted-foreground">SKU</dt><dd>{p.sku}</dd></>)}
                  {Object.entries(specs).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</dt>
                      <dd>{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <ReviewsSection productId={(p as any).id} reviews={reviews} signedIn={signedIn} />
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-display text-2xl mb-6">You may also like</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((r: any) => <ProductCard key={r.id} p={r as ProductCardData} fallbackImg={catImg[r.categories?.slug ?? ""]} />)}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}

function ReviewsSection({ productId, reviews, signedIn }: { productId: string; reviews: any[]; signedIn: boolean }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!signedIn) { toast.info("Please sign in to leave a review"); return; }
    if (!body.trim()) return toast.error("Please write a short review");
    setSubmitting(true);
    const uid = (await supabase.auth.getUser()).data.user!.id;
    const { error } = await supabase.from("reviews").insert({
      product_id: productId, user_id: uid, rating, title: title || null, body,
    });
    setSubmitting(false);
    if (error) {
      if (error.message.includes("duplicate")) return toast.info("You've already reviewed this product");
      return toast.error(error.message);
    }
    toast.success("Thanks for your review!");
    setTitle(""); setBody(""); setRating(5);
    qc.invalidateQueries({ queryKey: ["product"] });
  }

  return (
    <div className="surface-card p-6 space-y-5">
      <h3 className="text-display text-xl">Customer reviews</h3>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.slice(0, 6).map((r, i) => (
            <li key={i} className="border-b border-border last:border-0 pb-4 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex text-copper">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`h-3.5 w-3.5 ${j < r.rating ? "fill-current" : ""}`} />)}</div>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.title && <div className="font-medium text-sm mb-1">{r.title}</div>}
              <p className="text-sm text-muted-foreground">{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border pt-5">
        <div className="text-sm font-medium mb-3">Write a review</div>
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              onMouseEnter={() => setHover(i + 1)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(i + 1)}
              className="text-copper"
              aria-label={`${i + 1} stars`}
            >
              <Star className={`h-5 w-5 ${i < (hover || rating) ? "fill-current" : ""}`} />
            </button>
          ))}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-2" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your experience with this product…" rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-3" />
        <button onClick={submit} disabled={submitting} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </div>
  );
}
