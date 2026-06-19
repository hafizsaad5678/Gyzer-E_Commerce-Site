import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import imgElectric from "@/assets/product-electric.jpg";
import imgGas from "@/assets/product-gas.jpg";
import imgInstant from "@/assets/product-instant.jpg";
import imgSolar from "@/assets/product-solar.jpg";

const catImg: Record<string, string> = { electric: imgElectric, gas: imgGas, instant: imgInstant, solar: imgSolar };

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — Asif Brothers" }, { name: "robots", content: "noindex" }] }),
  component: Cart,
});

type CartRow = { id: string; quantity: number; product: any };

function Cart() {
  const [items, setItems] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const navigate = useNavigate();

  async function load() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { setSignedIn(false); setLoading(false); return; }
    setSignedIn(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id,quantity,products(id,slug,name,brand,price_pkr,discount_price_pkr,cover_image_url,stock,categories(slug))")
      .order("created_at");
    if (error) toast.error("Could not load cart");
    setItems((data ?? []).map((r: any) => ({ id: r.id, quantity: r.quantity, product: r.products })));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function updateQty(id: string, q: number) {
    if (q < 1) return;
    await supabase.from("cart_items").update({ quantity: q }).eq("id", id);
    load();
  }
  async function remove(id: string) {
    await supabase.from("cart_items").delete().eq("id", id);
    load();
  }

  async function applyCoupon() {
    if (!coupon.trim()) return;
    const { data } = await supabase.from("coupons").select("*").eq("code", coupon.trim().toUpperCase()).eq("is_active", true).maybeSingle();
    if (!data) return toast.error("Invalid coupon");
    if (subtotal < Number(data.min_order_pkr ?? 0)) return toast.error(`Minimum order ${formatPKR(data.min_order_pkr)}`);
    const amt = data.discount_percent ? subtotal * (data.discount_percent / 100) : Number(data.discount_amount_pkr ?? 0);
    setDiscount(amt);
    toast.success(`Coupon applied: -${formatPKR(amt)}`);
  }

  const subtotal = items.reduce((s, i) => s + Number(i.product?.discount_price_pkr ?? i.product?.price_pkr ?? 0) * i.quantity, 0);
  const shipping = subtotal > 50000 || subtotal === 0 ? 0 : subtotal > 20000 ? 800 : 1200;
  const total = Math.max(0, subtotal - discount + shipping);

  if (signedIn === false) {
    return (
      <SiteLayout>
        <div className="container-page py-32 text-center max-w-md mx-auto">
          <ShoppingBag className="h-12 w-12 mx-auto text-copper mb-4" />
          <h1 className="text-display text-3xl mb-3">Sign in to view your cart</h1>
          <Link to="/auth" search={{ redirect: "/cart" } as any} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Sign in <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container-page py-12 md:py-16">
        <h1 className="text-display text-4xl mb-8">Your cart</h1>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-5">Your cart is empty.</p>
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Browse shop <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-4">
              {items.map((i) => {
                const price = Number(i.product?.discount_price_pkr ?? i.product?.price_pkr ?? 0);
                const img = i.product?.cover_image_url || catImg[i.product?.categories?.slug ?? ""];
                return (
                  <div key={i.id} className="surface-card p-4 flex gap-4">
                    <Link to="/product/$slug" params={{ slug: i.product.slug }} className="h-24 w-24 rounded-md overflow-hidden bg-steel/40 shrink-0">
                      {img && <img src={img} alt={i.product.name} className="h-full w-full object-cover" />}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{i.product?.brand}</div>
                      <Link to="/product/$slug" params={{ slug: i.product.slug }} className="text-display text-lg hover:text-copper">{i.product?.name}</Link>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="inline-flex items-center rounded-md border border-input">
                          <button onClick={() => updateQty(i.id, i.quantity - 1)} className="px-2.5 py-1 text-muted-foreground">−</button>
                          <span className="px-3 py-1 text-sm">{i.quantity}</span>
                          <button onClick={() => updateQty(i.id, i.quantity + 1)} className="px-2.5 py-1 text-muted-foreground">+</button>
                        </div>
                        <button onClick={() => remove(i.id)} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPKR(price * i.quantity)}</div>
                      <div className="text-xs text-muted-foreground">{formatPKR(price)} each</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="surface-card p-6 h-fit space-y-4 lg:sticky lg:top-20">
              <h2 className="text-display text-xl">Order summary</h2>
              <div className="flex gap-2">
                <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <button onClick={applyCoupon} className="rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary">Apply</button>
              </div>
              <dl className="space-y-2 text-sm border-t border-border pt-4">
                <Row k="Subtotal" v={formatPKR(subtotal)} />
                {discount > 0 && <Row k="Discount" v={`-${formatPKR(discount)}`} accent />}
                <Row k="Shipping" v={shipping === 0 ? "Free" : formatPKR(shipping)} />
                <div className="flex justify-between pt-3 border-t border-border text-base font-semibold">
                  <dt>Total</dt><dd>{formatPKR(total)}</dd>
                </div>
              </dl>
              <button
                onClick={() => navigate({ to: "/checkout", search: { coupon: discount > 0 ? coupon : undefined } as any })}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-copper px-5 py-3 text-sm font-semibold text-copper-foreground hover:opacity-90"
              >
                Checkout <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-[11px] text-muted-foreground text-center">Cash on Delivery available nationwide</p>
            </aside>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return <div className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className={accent ? "text-copper font-medium" : ""}>{v}</dd></div>;
}
