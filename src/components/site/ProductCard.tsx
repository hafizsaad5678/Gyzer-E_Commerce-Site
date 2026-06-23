import { Link } from "@tanstack/react-router";
import { formatPKR } from "@/lib/format";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price_pkr: number;
  discount_price_pkr: number | null;
  cover_image_url: string | null;
  capacity_liters: number | null;
  warranty_months: number | null;
  stock: number;
};

export function ProductCard({ p, fallbackImg }: { p: ProductCardData; fallbackImg?: string }) {
  const [adding, setAdding] = useState(false);
  const qc = useQueryClient();

  const hasDiscount =
    p.discount_price_pkr != null && Number(p.discount_price_pkr) < Number(p.price_pkr);
  const off = hasDiscount
    ? Math.round((1 - Number(p.discount_price_pkr) / Number(p.price_pkr)) * 100)
    : 0;
  const img = p.cover_image_url || fallbackImg;

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault(); // Prevent link navigation
    setAdding(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.info("Please sign in to add to cart");
      window.location.href = "/auth?redirect=" + encodeURIComponent("/product/" + p.slug);
      setAdding(false);
      return;
    }
    const uid = sessionData.session.user.id;
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id,quantity")
      .eq("product_id", p.id)
      .eq("user_id", uid)
      .maybeSingle();
    const { error } = existing
      ? await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id)
      : await supabase.from("cart_items").insert({ product_id: p.id, quantity: 1, user_id: uid });

    setAdding(false);
    if (error) return toast.error("Could not add to cart");
    toast.success("Added to cart");
    qc.invalidateQueries({ queryKey: ["cart"] });
  }

  return (
    <div className="group surface-card flex flex-col h-full overflow-hidden transition-all hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5">
      <Link
        to="/product/$slug"
        params={{ slug: p.slug }}
        className="flex-1 flex flex-col focus:outline-none"
      >
        <div className="relative aspect-square bg-steel/40 overflow-hidden shrink-0">
          {img ? (
            <img
              src={img}
              alt={p.name}
              loading="lazy"
              width={600}
              height={600}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground text-xs">
              No image
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-3 left-3 rounded-full bg-copper px-2.5 py-1 text-[11px] font-semibold text-copper-foreground">
              -{off}%
            </span>
          )}
          {p.stock <= 0 && (
            <span className="absolute top-3 right-3 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground">
              Out of stock
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
            {p.brand}
          </div>
          <h3 className="text-display text-lg leading-tight group-hover:text-copper transition-colors line-clamp-2">
            {p.name}
          </h3>

          <div className="text-xs text-muted-foreground flex gap-3 mt-3 mb-4">
            {p.capacity_liters ? <span>{p.capacity_liters}L</span> : null}
            {p.warranty_months ? (
              <span>{Math.round(p.warranty_months / 12)}yr warranty</span>
            ) : null}
          </div>

          <div className="flex items-baseline gap-2 pt-3 border-t border-border mt-auto">
            {hasDiscount ? (
              <>
                <span className="text-lg font-semibold text-foreground">
                  {formatPKR(p.discount_price_pkr!)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatPKR(p.price_pkr)}
                </span>
              </>
            ) : (
              <span className="text-lg font-semibold text-foreground">
                {formatPKR(p.price_pkr)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-1">
        <button
          onClick={handleAdd}
          disabled={adding || p.stock <= 0}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-secondary/80 hover:bg-copper hover:text-copper-foreground px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:hover:bg-secondary/80 disabled:hover:text-foreground"
        >
          <ShoppingCart className="h-4 w-4" />
          {p.stock <= 0 ? "Out of stock" : adding ? "Adding..." : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
