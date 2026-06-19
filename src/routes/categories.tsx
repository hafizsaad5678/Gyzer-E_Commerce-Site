import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import imgElectric from "@/assets/product-electric.jpg";
import imgGas from "@/assets/product-gas.jpg";
import imgInstant from "@/assets/product-instant.jpg";
import imgSolar from "@/assets/product-solar.jpg";

const catImg: Record<string, string> = { electric: imgElectric, gas: imgGas, instant: imgInstant, solar: imgSolar };

const opts = queryOptions({
  queryKey: ["categories", "full"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Asif Brothers" },
      { name: "description", content: "Browse geysers by type: electric, gas, instant, and solar." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: Categories,
});

function Categories() {
  const { data: cats } = useSuspenseQuery(opts);
  return (
    <SiteLayout>
      <section className="container-page py-12 md:py-16">
        <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Categories</div>
        <h1 className="text-display text-4xl md:text-5xl mb-3">Find your geyser type</h1>
        <p className="text-muted-foreground max-w-2xl mb-10">Each category is engineered for a different home setup. Not sure? <Link to="/contact" className="text-copper underline">Ask us.</Link></p>
        <div className="grid sm:grid-cols-2 gap-6">
          {cats.map((c) => (
            <Link key={c.id} to="/categories/$slug" params={{ slug: c.slug }} className="surface-card overflow-hidden grid md:grid-cols-[40%_1fr] group hover:shadow-[var(--shadow-elevated)] transition">
              <div className="aspect-square md:aspect-auto bg-steel/40 overflow-hidden">
                <img src={catImg[c.slug]} alt={c.name} loading="lazy" width={800} height={800} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 space-y-3">
                <h2 className="text-display text-2xl group-hover:text-copper transition-colors">{c.name}</h2>
                <p className="text-sm text-muted-foreground">{c.description}</p>
                <div className="text-sm text-copper font-medium">Browse {c.name} →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
