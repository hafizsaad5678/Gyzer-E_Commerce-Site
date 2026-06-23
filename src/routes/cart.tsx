import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { OrderSummaryPanel } from "@/components/site/OrderSummaryPanel";
import { CouponInput } from "@/components/site/CouponInput";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { calcShipping } from "@/lib/shipping";
import { catImg } from "@/lib/cat-images";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// ─── Query ────────────────────────────────────────────────────────────────────

const cartOpts = queryOptions({
  queryKey: ["cart"],
  queryFn: async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return null; // null = not signed in

    const { data, error } = await supabase
      .from("cart_items")
      .select(
        "id,quantity,products(id,slug,name,brand,price_pkr,discount_price_pkr,cover_image_url,stock,categories(slug))",
      )
      .order("created_at");
    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      id: r.id,
      quantity: r.quantity,
      product: r.products,
    }));
  },
});

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "Your cart — Asif Brothers" }, { name: "robots", content: "noindex" }],
  }),
  component: Cart,
});

// ─── Component ────────────────────────────────────────────────────────────────

type CartRow = { id: string; quantity: number; product: any };

function Cart() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");

  const { data: items, isLoading } = useQuery(cartOpts);
  // null means not signed in, undefined means still loading
  const signedIn = items !== null;

  const updateQtyMutation = useMutation({
    mutationFn: async ({ id, qty, max }: { id: string; qty: number; max: number }) => {
      if (qty < 1) return;
      const newQty = Math.min(qty, max);
      if (qty > max) toast.error(`Only ${max} available in stock`);
      const { error } = await supabase.from("cart_items").update({ quantity: newQty }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: () => toast.error("Could not update quantity"),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: () => toast.error("Could not remove item"),
  });

  // Derive totals
  const rows: CartRow[] = Array.isArray(items) ? items : [];
  const subtotal = rows.reduce(
    (s, i) => s + Number(i.product?.discount_price_pkr ?? i.product?.price_pkr ?? 0) * i.quantity,
    0,
  );
  const shipping = calcShipping(subtotal);
  const total = Math.max(0, subtotal - discount + shipping);

  // Not signed in
  if (!isLoading && !signedIn) {
    return (
      <SiteLayout>
        <div className="container-page py-32 text-center max-w-md mx-auto">
          <ShoppingBag className="h-12 w-12 mx-auto text-copper mb-4" />
          <h1 className="text-display text-3xl mb-3">Sign in to view your cart</h1>
          <Link
            to="/auth"
            search={{ redirect: "/cart" } as any}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container-page py-12 md:py-16">
        <h1 className="text-display text-4xl mb-8">Your cart</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-5">Your cart is empty.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
            >
              Browse shop <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            {/* Line items */}
            <div className="space-y-4">
              {rows.map((i) => {
                const price = Number(i.product?.discount_price_pkr ?? i.product?.price_pkr ?? 0);
                const img = i.product?.cover_image_url || catImg[i.product?.categories?.slug ?? ""];
                return (
                  <div key={i.id} className="surface-card p-4 flex gap-4">
                    <Link
                      to="/product/$slug"
                      params={{ slug: i.product.slug }}
                      className="h-24 w-24 rounded-md overflow-hidden bg-steel/40 shrink-0"
                    >
                      {img && (
                        <img
                          src={img}
                          alt={i.product.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {i.product?.brand}
                      </div>
                      <Link
                        to="/product/$slug"
                        params={{ slug: i.product.slug }}
                        className="text-display text-lg hover:text-copper"
                      >
                        {i.product?.name}
                      </Link>
                      <div
                        className={`text-[11px] font-medium mt-0.5 ${
                          i.product.stock > 0 && i.product.stock < 5
                            ? "text-destructive"
                            : "text-success"
                        }`}
                      >
                        {i.product.stock > 0 ? `${i.product.stock} in stock` : "Out of stock"}
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="inline-flex items-center rounded-md border border-input">
                          <button
                            onClick={() =>
                              updateQtyMutation.mutate({
                                id: i.id,
                                qty: i.quantity - 1,
                                max: i.product.stock,
                              })
                            }
                            className="px-2.5 py-1 text-muted-foreground hover:text-foreground"
                          >
                            −
                          </button>
                          <span className="px-3 py-1 text-sm">{i.quantity}</span>
                          <button
                            onClick={() =>
                              updateQtyMutation.mutate({
                                id: i.id,
                                qty: i.quantity + 1,
                                max: i.product.stock,
                              })
                            }
                            className="px-2.5 py-1 text-muted-foreground hover:text-foreground"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeMutation.mutate(i.id)}
                          disabled={removeMutation.isPending}
                          className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
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

            {/* Order summary */}
            <aside className="surface-card p-6 h-fit space-y-4 lg:sticky lg:top-20">
              <h2 className="text-display text-xl">Order summary</h2>
              <CouponInput
                subtotal={subtotal}
                onApplied={(amt, code) => {
                  setDiscount(amt);
                  setCouponCode(code);
                }}
              />
              <OrderSummaryPanel
                subtotal={subtotal}
                discount={discount}
                shipping={shipping}
                total={total}
              />
              <button
                onClick={() =>
                  navigate({
                    to: "/checkout",
                    search: { coupon: discount > 0 ? couponCode : undefined } as any,
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-copper px-5 py-3 text-sm font-semibold text-copper-foreground hover:opacity-90"
              >
                Checkout <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                Cash on Delivery available nationwide
              </p>
            </aside>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
