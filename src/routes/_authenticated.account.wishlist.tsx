import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { Heart, Trash2 } from "lucide-react";
import imgElectric from "@/assets/product-electric.jpg";
import imgGas from "@/assets/product-gas.jpg";
import imgInstant from "@/assets/product-instant.jpg";
import imgSolar from "@/assets/product-solar.jpg";

const catImg: Record<string, string> = { electric: imgElectric, gas: imgGas, instant: imgInstant, solar: imgSolar };

export const Route = createFileRoute("/_authenticated/account/wishlist")({
  component: Wishlist,
});

function Wishlist() {
  const [items, setItems] = useState<any[]>([]);
  async function load() {
    const { data } = await supabase.from("wishlist_items").select("id, products(id,slug,name,brand,price_pkr,discount_price_pkr,cover_image_url,categories(slug))");
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);
  async function remove(id: string) { await supabase.from("wishlist_items").delete().eq("id", id); load(); }

  if (items.length === 0) {
    return (
      <div className="surface-card p-12 text-center">
        <Heart className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Nothing saved yet.</p>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map((w) => {
        const p = w.products;
        if (!p) return null;
        const price = Number(p.discount_price_pkr ?? p.price_pkr);
        const img = p.cover_image_url || catImg[p.categories?.slug ?? ""];
        return (
          <div key={w.id} className="surface-card p-4 flex gap-4">
            <Link to="/product/$slug" params={{ slug: p.slug }} className="h-20 w-20 rounded-md bg-steel/40 overflow-hidden shrink-0">{img && <img src={img} alt={p.name} className="h-full w-full object-cover" />}</Link>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.brand}</div>
              <Link to="/product/$slug" params={{ slug: p.slug }} className="text-display text-base hover:text-copper">{p.name}</Link>
              <div className="text-sm font-semibold mt-1">{formatPKR(price)}</div>
            </div>
            <button onClick={() => remove(w.id)} className="text-muted-foreground hover:text-destructive self-start"><Trash2 className="h-4 w-4" /></button>
          </div>
        );
      })}
    </div>
  );
}
