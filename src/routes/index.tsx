import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { ArrowRight, ShieldCheck, Truck, Wrench, Star, MessageCircle, Zap, ThumbsUp } from "lucide-react";
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
  const initial = (review.title || "C")[0].toUpperCase();
  const avatarColors = ["#5C2A0E", "#7A3519", "#8B3A1A", "#6B3010", "#4A2008"];
  const colorIdx = initial.charCodeAt(0) % avatarColors.length;

  return (
    <figure className="relative flex flex-col h-full rounded-2xl overflow-hidden group transition-all duration-500 hover:-translate-y-2">
      {/* Card background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.92_0.01_235)] via-[oklch(0.94_0.015_40)] to-[oklch(0.96_0.01_40)]" />
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-copper to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      {/* Subtle corner glow */}
      <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-copper/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      {/* Border */}
      <div className="absolute inset-0 rounded-2xl border border-slate-200 group-hover:border-copper/40 transition-colors duration-500" />

      <div className="relative z-10 p-8 sm:p-9 flex flex-col h-full">
        {/* Stars */}
        <div className="flex gap-1 mb-5">
          {Array.from({ length: 5 }).map((_, k) => (
            <Star
              key={k}
              className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${
                k < review.rating ? "fill-copper text-copper" : "fill-transparent text-white/20 stroke-white/20"
              }`}
              style={{ transitionDelay: `${k * 40}ms` }}
            />
          ))}
        </div>

        {/* Quote mark */}
        <div className="absolute top-6 right-7 text-7xl text-slate-200 font-serif leading-none select-none pointer-events-none group-hover:text-copper/20 transition-colors duration-500">
          &rdquo;
        </div>

        {/* Review body */}
        <blockquote className="flex-1 text-slate-700 text-base sm:text-[1.05rem] leading-relaxed font-light mb-7 line-clamp-4">
          "{review.body}"
        </blockquote>

        {/* Divider */}
        <div className="w-full h-px bg-slate-200 mb-6 group-hover:bg-copper/30 transition-colors duration-500" />

        {/* Author */}
        <figcaption className="flex items-center gap-3.5 mt-auto">
          <div
            className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-base shadow-inner border border-white/10"
            style={{ backgroundColor: avatarColors[colorIdx] }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">
              {review.title || "Customer"}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="h-3 w-3 text-copper shrink-0" />
              <span className="text-[10px] uppercase tracking-widest text-copper/80 font-medium">
                Verified Buyer
              </span>
            </div>
          </div>
          {/* Rating badge */}
          <div className="ml-auto shrink-0 flex items-center gap-1 bg-copper/10 border border-copper/25 rounded-full px-2.5 py-1">
            <Star className="h-3 w-3 fill-copper text-copper" />
            <span className="text-xs font-bold text-copper">{review.rating}.0</span>
          </div>
        </figcaption>
      </div>
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
  const [reviewDot, setReviewDot] = useState(0);

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed().slice(0, 4));
  }, []);

  // Track active dot for reviews carousel
  const onReviewSelect = useCallback(() => {
    if (!emblaApi) return;
    setReviewDot(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onReviewSelect);
    return () => { emblaApi.off("select", onReviewSelect); };
  }, [emblaApi, onReviewSelect]);

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
              <button onClick={() => featuredApi?.scrollPrev()} className="absolute top-[40%] -left-4 md:-left-12 -translate-y-1/2 h-10 w-10 rounded-full bg-white border border-slate-200 text-copper flex items-center justify-center hover:bg-copper hover:text-white hover:border-copper transition-all duration-200 z-10 shadow-md">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => featuredApi?.scrollNext()} className="absolute top-[40%] -right-4 md:-right-12 -translate-y-1/2 h-10 w-10 rounded-full bg-white border border-slate-200 text-copper flex items-center justify-center hover:bg-copper hover:text-white hover:border-copper transition-all duration-200 z-10 shadow-md">
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
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
              Reviews
            </div>
            <h2 className="text-display text-3xl md:text-4xl">
              Trusted by 50,000+ Pakistani homes
            </h2>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {/* Aggregate rating pill */}
            <div className="flex items-center gap-2 bg-copper/10 border border-copper/25 rounded-full px-4 py-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-copper text-copper" />
                ))}
              </div>
              <span className="text-sm font-bold text-copper">5.0</span>
              <span className="text-xs text-slate-400">/ 5</span>
            </div>
            <Link
              to="/write-review"
              className="text-sm text-copper hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Write a review <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-muted-foreground text-sm">No reviews yet.</div>
        ) : reviews.length > 3 ? (
          <div className="relative max-w-6xl mx-auto">
            <div className="overflow-hidden rounded-xl" ref={emblaRef}>
              <div className="flex gap-6 touch-pan-y">
                {reviews.map((t) => (
                  <div key={t.id} className="flex-[0_0_100%] md:flex-[0_0_calc(33.333%-1rem)] min-w-0 pb-4">
                    <ReviewCard review={t} />
                  </div>
                ))}
              </div>
            </div>

            {/* Nav buttons */}
            <button
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous review"
              className="absolute top-1/2 -left-4 md:-left-14 -translate-y-1/2 h-11 w-11 rounded-full bg-white border border-slate-200 text-copper flex items-center justify-center hover:bg-copper hover:text-white hover:border-copper transition-all duration-200 z-10 shadow-md"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next review"
              className="absolute top-1/2 -right-4 md:-right-14 -translate-y-1/2 h-11 w-11 rounded-full bg-white border border-slate-200 text-copper flex items-center justify-center hover:bg-copper hover:text-white hover:border-copper transition-all duration-200 z-10 shadow-md"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Go to review ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === reviewDot ? "w-6 bg-copper" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {reviews.map((t) => (
              <ReviewCard key={t.id} review={t} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-[oklch(0.32_0.07_30)] to-[oklch(0.42_0.14_35)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_50%,oklch(0.55_0.15_40/0.3),transparent)]" />
          {/* Decorative rings */}
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full border border-copper/10" />
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full border border-copper/15" />
          <div className="absolute right-8 top-8 w-24 h-24 rounded-full border border-copper/20" />
          {/* Top shimmer */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-copper/50 to-transparent" />

          <div className="relative z-10 p-10 md:p-14 grid md:grid-cols-[1fr_auto] gap-10 items-center">
            {/* Left content */}
            <div className="space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper/10 px-3.5 py-1.5 text-xs font-semibold text-copper uppercase tracking-wider">
                <MessageCircle className="h-3.5 w-3.5" />
                Free Expert Consultation
              </div>
              <h2 className="text-display text-3xl md:text-4xl text-white leading-tight">
                Not sure which geyser
                <br />
                <span className="text-copper">fits your home?</span>
              </h2>
              <p className="text-white/70 text-base leading-relaxed">
                Tell us about your household size, gas connection, and usage — we'll recommend
                the right model and quote installation.
              </p>

              {/* Feature bullets */}
              <ul className="space-y-2.5">
                {[
                  { icon: Zap, text: "Instant recommendation based on your needs" },
                  { icon: ThumbsUp, text: "No obligation, completely free advice" },
                  { icon: Wrench, text: "Installation quote included" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-white/65">
                    <div className="h-6 w-6 rounded-full bg-copper/15 border border-copper/25 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-copper" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-md bg-copper hover:bg-copper/90 text-white px-6 py-3 text-sm font-semibold transition-all duration-200 hover:shadow-[0_8px_24px_oklch(0.36_0.14_35/0.5)] hover:-translate-y-0.5"
                >
                  Talk to an expert <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.06] hover:bg-white/10 text-white/80 hover:text-white px-6 py-3 text-sm font-medium transition-all duration-200"
                >
                  Browse all geysers
                </Link>
              </div>
            </div>

            {/* Right stat block */}
            <div className="hidden md:flex flex-col gap-4 shrink-0">
              {[
                { value: "50K+", label: "Homes served" },
                { value: "25+", label: "Years trusted" },
                { value: "7yr", label: "Max warranty" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-center min-w-[130px] hover:border-white/40 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-white/70 mt-0.5 uppercase tracking-wider font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


    </SiteLayout>
  );
}
