import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Truck, Wrench, Star } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { getRecentlyViewed, type RVItem } from "@/lib/recently-viewed";
import hero from "@/assets/hero-geyser.jpg";
import { catImg } from "@/lib/cat-images";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Shared ReviewCard component ──────────────────────────────────────────────
function ReviewCard({ review }: { review: { id: string; rating: number; title: string | null; body: string | null } }) {
  return (
    <figure className="bg-gradient-to-br from-[oklch(0.28_0.04_235)] to-[oklch(0.42_0.1_45)] border border-[oklch(0.28_0.04_235)] rounded-2xl p-8 sm:p-10 flex flex-col h-full relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 hover:shadow-[0_24px_48px_oklch(0.1_0.03_235/0.8)] hover:border-copper/30">
      <div className="absolute -top-4 -right-2 text-9xl text-white/[0.03] font-serif leading-none select-none pointer-events-none group-hover:text-copper/[0.05] transition-colors duration-500">
        &rdquo;
      </div>
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-copper/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute inset-0 thermal-gradient opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500" />
      <div className="flex gap-1.5 text-copper relative z-10 mb-6">
        {Array.from({ length: 5 }).map((_, k) => (
          <Star key={k} className={`h-4 w-4 sm:h-5 sm:w-5 ${k < review.rating ? "fill-current" : "fill-transparent stroke-[oklch(0.35_0.04_235)] stroke-2"}`} />
        ))}
      </div>
      <blockquote className="text-display text-lg sm:text-xl leading-relaxed flex-1 text-[oklch(0.95_0.005_80)] relative z-10 mb-8 font-light">
        "{review.body}"
      </blockquote>
      <figcaption className="flex items-center gap-4 relative z-10 mt-auto">
        <div className="h-10 w-10 shrink-0 rounded-full bg-[oklch(0.25_0.04_235)] border border-[oklch(0.35_0.04_235)] flex items-center justify-center text-copper font-serif text-lg">
          {(review.title || "C")[0].toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-semibold text-[oklch(0.9_0.005_80)] tracking-wide">{review.title || "Customer"}</div>
          <div className="text-[10px] uppercase tracking-widest text-copper/80 mt-0.5 flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" />
            Verified Buyer
          </div>
        </div>
      </figcaption>
    </figure>
  );
}

const featuredOpts = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,slug,name,brand,price_pkr,discount_price_pkr,cover_image_url,capacity_liters,warranty_months,stock,categories(slug)",
      )
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
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

const reviewsOpts = queryOptions({
  queryKey: ["approved_reviews"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("id,rating,title,body")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(6);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Asif Brothers Premium Geysers for Pakistan" },
      {
        name: "description",
        content:
          "Shop electric, gas, instant and solar geysers from Asif Brothers. Trusted by Pakistani families since 1998.",
      },
      { property: "og:title", content: "Asif Brothers Premium Geysers for Pakistan" },
      {
        property: "og:description",
        content: "Shop electric, gas, instant and solar geysers from Asif Brothers.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(featuredOpts),
      context.queryClient.ensureQueryData(categoriesOpts),
      context.queryClient.ensureQueryData(reviewsOpts),
    ]);
  },
  component: Home,
});

function Home() {
  const { data: featured } = useSuspenseQuery(featuredOpts);
  const { data: categories } = useSuspenseQuery(categoriesOpts);
  const { data: reviews } = useSuspenseQuery(reviewsOpts);
  const [recentlyViewed, setRecentlyViewed] = useState<RVItem[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });
  const [featuredRef, featuredApi] = useEmblaCarousel({ align: "start", loop: false });

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
              Hot water,
              <br />
              <span className="italic text-copper">engineered</span> for Pakistan.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              From load-shedding-ready electric tanks to high-efficiency solar systems Asif
              Brothers builds geysers that survive Pakistani winters and last decades.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-5 py-3 text-sm font-medium transition"
              >
                Browse the shop <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/categories"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-secondary transition"
              >
                Explore categories
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 pt-6 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-copper" /> Up to 7-year warranty
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-copper" /> Nationwide shipping
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-copper" /> Authorized service
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 thermal-gradient blur-3xl opacity-20 rounded-full" />
            <img
              src={hero}
              alt="Premium Asif Brothers geyser"
              fetchPriority="high"
              width={1600}
              height={1280}
              className="relative rounded-2xl shadow-[var(--shadow-elevated)] object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page py-16 md:py-24">
        <div className="flex items-end justify-between mb-10 gap-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
              Categories
            </div>
            <h2 className="text-display text-3xl md:text-4xl">Choose your heat source</h2>
          </div>
          <Link
            to="/categories"
            className="text-sm text-muted-foreground hover:text-copper transition-colors inline-flex items-center gap-1"
          >
            All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/categories/$slug"
              params={{ slug: c.slug }}
              className="surface-card overflow-hidden group hover:shadow-[var(--shadow-elevated)] transition-all hover:-translate-y-1"
            >
              <div className="aspect-[4/3] bg-steel/40 overflow-hidden relative">
                <img
                  src={catImg[c.slug]}
                  alt={c.name}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="p-6 relative bg-card">
                <h3 className="text-display text-2xl mb-2 group-hover:text-copper transition-colors">
                  {c.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
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
              <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
                Bestsellers
              </div>
              <h2 className="text-display text-3xl md:text-4xl">Featured geysers</h2>
            </div>
            <Link
              to="/shop"
              className="text-sm text-muted-foreground hover:text-copper inline-flex items-center gap-1"
            >
              Shop all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {featured.length > 3 ? (
            <div className="relative max-w-6xl mx-auto">
              <div className="overflow-hidden" ref={featuredRef}>
                <div className="flex gap-8 touch-pan-y">
                  {featured.map((p: any) => (
                    <div key={p.id} className="flex-[0_0_100%] md:flex-[0_0_calc(33.333%-1.33rem)] min-w-0 pb-4">
                      <ProductCard
                        p={p as ProductCardData}
                        fallbackImg={catImg[p.categories?.slug ?? ""]}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => featuredApi?.scrollPrev()} className="absolute top-[40%] -left-4 md:-left-12 -translate-y-1/2 h-10 w-10 rounded-full bg-[oklch(0.25_0.04_235)] border border-[oklch(0.35_0.04_235)] text-copper flex items-center justify-center hover:text-copper-foreground transition-colors z-10 shadow-lg">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => featuredApi?.scrollNext()} className="absolute top-[40%] -right-4 md:-right-12 -translate-y-1/2 h-10 w-10 rounded-full bg-[oklch(0.25_0.04_235)] border border-[oklch(0.35_0.04_235)] text-copper flex items-center justify-center hover:text-copper-foreground transition-colors z-10 shadow-lg">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {featured.map((p: any) => (
                <ProductCard
                  key={p.id}
                  p={p as ProductCardData}
                  fallbackImg={catImg[p.categories?.slug ?? ""]}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-page py-16 md:py-24">
        <div className="flex items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
              Reviews
            </div>
            <h2 className="text-display text-3xl md:text-4xl">
              Trusted by 50,000+ Pakistani homes
            </h2>
          </div>
          <Link
            to="/write-review"
            className="text-sm text-copper hover:underline inline-flex items-center gap-1 shrink-0"
          >
            Write a review <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="text-muted-foreground text-sm">No reviews yet.</div>
        ) : reviews.length > 3 ? (
          <div className="relative max-w-6xl mx-auto">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-8 touch-pan-y">
                {reviews.map((t) => (
                  <div key={t.id} className="flex-[0_0_100%] md:flex-[0_0_calc(33.333%-1.33rem)] min-w-0 pb-4">
                    <ReviewCard review={t} />
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => emblaApi?.scrollPrev()} className="absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 h-10 w-10 rounded-full bg-[oklch(0.25_0.04_235)] border border-[oklch(0.35_0.04_235)] text-copper flex items-center justify-center hover:text-copper-foreground transition-colors z-10 shadow-lg">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => emblaApi?.scrollNext()} className="absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 h-10 w-10 rounded-full bg-[oklch(0.25_0.04_235)] border border-[oklch(0.35_0.04_235)] text-copper flex items-center justify-center hover:text-copper-foreground transition-colors z-10 shadow-lg">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {reviews.map((t) => (
              <ReviewCard key={t.id} review={t} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="bg-gradient-to-br from-[oklch(0.28_0.04_235)] to-[oklch(0.42_0.1_45)] border border-[oklch(0.28_0.04_235)] p-10 md:p-14 rounded-2xl flex flex-col relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 hover:shadow-[0_24px_48px_oklch(0.1_0.03_235/0.8)] hover:border-copper/30 ">
          <div className="relative z-10 max-w-2xl space-y-5">
            <h2 className="text-display text-3xl md:text-4xl">
              Not sure which geyser fits your home?
            </h2>
            <p className="text-white/85">
              Tell us about your household size, gas connection, and usage  we'll recommend the
              right model and quote installation.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground px-5 py-3 text-sm font-medium transition-colors"
            >
              Talk to an expert <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>


    </SiteLayout>
  );
}
