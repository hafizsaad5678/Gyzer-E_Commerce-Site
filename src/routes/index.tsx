import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Truck, Wrench, Star } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { getRecentlyViewed, type RVItem } from "@/lib/recently-viewed";
import hero from "@/assets/hero-geyser.jpg";
import imgElectric from "@/assets/product-electric.jpg";
import imgGas from "@/assets/product-gas.jpg";
import imgInstant from "@/assets/product-instant.jpg";
import imgSolar from "@/assets/product-solar.jpg";

const featuredOpts = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,slug,name,brand,price_pkr,discount_price_pkr,cover_image_url,capacity_liters,warranty_months,stock,categories(slug)")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    return data ?? [];
  },
});

const categoriesOpts = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,slug,name,description,sort_order")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Asif Brothers — Premium Geysers for Pakistan" },
      { name: "description", content: "Shop electric, gas, instant and solar geysers from Asif Brothers. Trusted by Pakistani families since 1998." },
      { property: "og:title", content: "Asif Brothers — Premium Geysers for Pakistan" },
      { property: "og:description", content: "Shop electric, gas, instant and solar geysers from Asif Brothers." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(featuredOpts),
      context.queryClient.ensureQueryData(categoriesOpts),
    ]);
  },
  component: Home,
});

const catImg: Record<string, string> = {
  electric: imgElectric,
  gas: imgGas,
  instant: imgInstant,
  solar: imgSolar,
};

function Home() {
  const { data: featured } = useSuspenseQuery(featuredOpts);
  const { data: categories } = useSuspenseQuery(categoriesOpts);
  const [recentlyViewed, setRecentlyViewed] = useState<RVItem[]>([]);

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed().slice(0, 4));
  }, []);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-page pt-12 pb-20 md:pt-20 md:pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-7 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-copper" />
              Trusted since 1998
            </div>
            <h1 className="text-display text-5xl sm:text-6xl lg:text-7xl">
              Hot water,<br />
              <span className="italic text-copper">engineered</span> for Pakistan.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              From load-shedding-ready electric tanks to high-efficiency solar systems — Asif Brothers builds geysers that survive Pakistani winters and last decades.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
                Browse the shop <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/categories" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-secondary transition">
                Explore categories
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 pt-6 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-copper" /> Up to 7-year warranty</span>
              <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-copper" /> Nationwide shipping</span>
              <span className="inline-flex items-center gap-1.5"><Wrench className="h-4 w-4 text-copper" /> Authorized service</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 thermal-gradient blur-3xl opacity-20 rounded-full" />
            <img src={hero} alt="Premium Asif Brothers geyser" fetchPriority="high" width={1600} height={1280} className="relative rounded-2xl shadow-[var(--shadow-elevated)] object-cover aspect-[4/3]" />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page py-16 md:py-24">
        <div className="flex items-end justify-between mb-10 gap-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Categories</div>
            <h2 className="text-display text-3xl md:text-4xl">Choose your heat source</h2>
          </div>
          <Link to="/categories" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">All <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/categories/$slug"
              params={{ slug: c.slug }}
              className="surface-card overflow-hidden group hover:shadow-[var(--shadow-elevated)] transition-all"
            >
              <div className="aspect-[4/3] bg-steel/40 overflow-hidden">
                <img src={catImg[c.slug]} alt={c.name} loading="lazy" width={800} height={600} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <h3 className="text-display text-xl mb-1.5 group-hover:text-copper transition-colors">{c.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-steel/30 border-y border-border">
        <div className="container-page py-16 md:py-24">
          <div className="flex items-end justify-between mb-10 gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Bestsellers</div>
              <h2 className="text-display text-3xl md:text-4xl">Featured geysers</h2>
            </div>
            <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">Shop all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((p: any) => (
              <ProductCard key={p.id} p={p as ProductCardData} fallbackImg={catImg[p.categories?.slug ?? ""]} />
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-page py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Reviews</div>
          <h2 className="text-display text-3xl md:text-4xl">Trusted by 50,000+ Pakistani homes</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { q: "Survived three Lahore winters with zero issues. The 5-year warranty sealed the deal.", a: "Ayesha K., Lahore" },
            { q: "Installed the Sahara gas geyser — hot water in 60 seconds, gas bill barely moved.", a: "Bilal R., Karachi" },
            { q: "Solar system pays for itself. Their installation team was professional and on time.", a: "Hamza M., Islamabad" },
          ].map((t, i) => (
            <figure key={i} className="surface-card p-6 space-y-4">
              <div className="flex gap-1 text-copper">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}</div>
              <blockquote className="text-display text-lg leading-snug">&ldquo;{t.q}&rdquo;</blockquote>
              <figcaption className="text-xs uppercase tracking-wider text-muted-foreground">{t.a}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="thermal-gradient rounded-2xl p-10 md:p-14 text-primary-foreground relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-5">
            <h2 className="text-display text-3xl md:text-4xl">Not sure which geyser fits your home?</h2>
            <p className="text-primary-foreground/85">Tell us about your household size, gas connection, and usage — we'll recommend the right model and quote installation.</p>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-md bg-background px-5 py-3 text-sm font-medium text-foreground hover:opacity-90 transition">
              Talk to an expert <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* RECENTLY VIEWED */}
      {recentlyViewed.length > 0 && (
        <section className="container-page pb-20">
          <div className="flex items-end justify-between mb-10 gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Your history</div>
              <h2 className="text-display text-3xl md:text-4xl">Recently viewed</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
