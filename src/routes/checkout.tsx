import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { CreditCard, ArrowLeft, Banknote, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Asif Brothers" }, { name: "robots", content: "noindex" }] }),
  component: Checkout,
});

function Checkout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string>("");
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [newAddr, setNewAddr] = useState({
    full_name: "", phone: "", line1: "", line2: "", city: "", province: "", postal_code: "", country: "Pakistan",
  });
  const [useNew, setUseNew] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { navigate({ to: "/auth", search: { redirect: "/checkout" } as any }); return; }
      setEmail(s.session.user.email ?? "");
      const [{ data: ci }, { data: addr }] = await Promise.all([
        supabase.from("cart_items").select("id,quantity,products(*)").order("created_at"),
        supabase.from("addresses").select("*").order("is_default", { ascending: false }),
      ]);
      setItems(ci ?? []);
      setAddresses(addr ?? []);
      if (addr && addr.length) setSelectedAddr(addr[0].id);
      else setUseNew(true);
      setLoading(false);
    })();
  }, [navigate]);

  async function applyCoupon() {
    if (!coupon.trim()) return;
    const { data } = await supabase.from("coupons").select("*").eq("code", coupon.trim().toUpperCase()).eq("is_active", true).maybeSingle();
    if (!data) return toast.error("Invalid coupon");
    if (subtotal < Number(data.min_order_pkr ?? 0)) return toast.error(`Minimum order ${formatPKR(data.min_order_pkr)}`);
    const amt = data.discount_percent ? subtotal * (data.discount_percent / 100) : Number(data.discount_amount_pkr ?? 0);
    setDiscount(amt);
    toast.success(`Coupon applied: -${formatPKR(amt)}`);
  }

  const subtotal = items.reduce((s, i) => s + Number(i.products?.discount_price_pkr ?? i.products?.price_pkr ?? 0) * i.quantity, 0);
  const shipping = subtotal > 50000 || subtotal === 0 ? 0 : subtotal > 20000 ? 800 : 1200;
  const total = Math.max(0, subtotal - discount + shipping);

  async function placeOrder() {
    if (items.length === 0) return toast.error("Cart is empty");

    let shipping_address: any;
    if (useNew) {
      if (!newAddr.full_name || !newAddr.phone || !newAddr.line1 || !newAddr.city || !newAddr.province) {
        return toast.error("Please fill in shipping address");
      }
      shipping_address = newAddr;
    } else {
      const a = addresses.find((x) => x.id === selectedAddr);
      if (!a) return toast.error("Select a shipping address");
      shipping_address = a;
    }

    setPlacing(true);
    const { data: u } = await supabase.auth.getUser();
    const user_id = u.user!.id;

    // Save new address for future
    if (useNew) {
      await supabase.from("addresses").insert({ ...newAddr, user_id, is_default: addresses.length === 0 });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id,
        email,
        subtotal_pkr: subtotal,
        discount_pkr: discount,
        shipping_pkr: shipping,
        total_pkr: total,
        coupon_code: discount > 0 ? coupon.trim().toUpperCase() : null,
        shipping_address,
        notes: notes || null,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (error || !order) { setPlacing(false); return toast.error(error?.message ?? "Could not place order"); }

    const orderItems = items.map((i: any) => {
      const unit = Number(i.products.discount_price_pkr ?? i.products.price_pkr);
      return {
        order_id: order.id,
        product_id: i.products.id,
        product_name: i.products.name,
        product_sku: i.products.sku,
        quantity: i.quantity,
        unit_price_pkr: unit,
        subtotal_pkr: unit * i.quantity,
      };
    });
    const { error: oiErr } = await supabase.from("order_items").insert(orderItems);
    if (oiErr) { setPlacing(false); return toast.error(oiErr.message); }

    // Decrement stock and notify admin if low
    await Promise.all(items.map(async (i: any) => {
      const currentStock = i.products.stock ?? 0;
      const newStock = Math.max(0, currentStock - i.quantity);
      
      await supabase.from("products").update({ stock: newStock }).eq("id", i.products.id);

      // Send a persistent system notification to the admin messages board if stock is getting low
      if (currentStock >= 5 && newStock < 5) {
        await supabase.from("contact_messages").insert({
          name: "System Alert",
          email: "system@asifbrothers.com",
          subject: `Low Stock Alert: ${i.products.name}`,
          message: `The product "${i.products.name}" has just dropped to ${newStock} items in stock after a recent purchase. Please restock soon!`,
          is_read: false,
        });
      }
    }));

    // Clear cart
    await supabase.from("cart_items").delete().eq("user_id", user_id);

    setPlacing(false);
    toast.success("Order placed!");
    navigate({ to: "/order-confirmation/$id", params: { id: order.id } });
  }

  if (loading) {
    return <SiteLayout><div className="container-page py-20 text-muted-foreground">Loading…</div></SiteLayout>;
  }

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="container-page py-32 text-center">
          <h1 className="text-display text-3xl mb-3">Your cart is empty</h1>
          <Link to="/shop" className="text-copper underline">Browse products</Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container-page py-10 md:py-14">
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" /> Back to cart</Link>
        <h1 className="text-display text-4xl mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div className="space-y-6">
            {/* Contact */}
            <div className="surface-card p-6 space-y-4">
              <h2 className="text-display text-xl">Contact</h2>
              <label className="block">
                <div className="text-xs font-medium text-muted-foreground mb-1.5">Email</div>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </label>
            </div>

            {/* Address */}
            <div className="surface-card p-6 space-y-4">
              <h2 className="text-display text-xl">Shipping address</h2>
              {addresses.length > 0 && (
                <div className="space-y-2">
                  {addresses.map((a) => (
                    <label key={a.id} className={`flex items-start gap-3 p-3 rounded-md border ${!useNew && selectedAddr === a.id ? "border-copper bg-copper/5" : "border-border"} cursor-pointer`}>
                      <input type="radio" checked={!useNew && selectedAddr === a.id} onChange={() => { setUseNew(false); setSelectedAddr(a.id); }} className="mt-1" />
                      <div className="text-sm">
                        <div className="font-medium">{a.full_name} <span className="text-muted-foreground font-normal">· {a.phone}</span></div>
                        <div className="text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.province} {a.postal_code ?? ""}, {a.country}</div>
                      </div>
                    </label>
                  ))}
                  <label className={`flex items-center gap-3 p-3 rounded-md border ${useNew ? "border-copper bg-copper/5" : "border-border"} cursor-pointer`}>
                    <input type="radio" checked={useNew} onChange={() => setUseNew(true)} />
                    <span className="text-sm">Use a different address</span>
                  </label>
                </div>
              )}
              {useNew && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <input placeholder="Full name" value={newAddr.full_name} onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })} className={inputCls} />
                  <input placeholder="Phone" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} className={inputCls} />
                  <input placeholder="Address line 1" value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} className={inputCls + " sm:col-span-2"} />
                  <input placeholder="Address line 2 (optional)" value={newAddr.line2} onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })} className={inputCls + " sm:col-span-2"} />
                  <input placeholder="City" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} className={inputCls} />
                  <input placeholder="Province" value={newAddr.province} onChange={(e) => setNewAddr({ ...newAddr, province: e.target.value })} className={inputCls} />
                  <input placeholder="Postal code" value={newAddr.postal_code} onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })} className={inputCls} />
                  <input placeholder="Country" value={newAddr.country} onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })} className={inputCls} />
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="surface-card p-6 space-y-4">
              <h2 className="text-display text-xl">Payment method</h2>
              <div className="p-4 rounded-md border border-copper bg-copper/5 flex items-start gap-3">
                <Banknote className="h-5 w-5 text-copper mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Cash on Delivery</div>
                  <div className="text-muted-foreground">Pay in cash to the delivery agent upon receiving your geyser.</div>
                </div>
              </div>
              <div className="p-4 rounded-md border border-border bg-secondary/40 flex items-start gap-3 opacity-60">
                <CreditCard className="h-5 w-5 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Card payment</div>
                  <div className="text-muted-foreground">Coming soon — secure card checkout via Stripe.</div>
                </div>
              </div>
            </div>

            <div className="surface-card p-6 space-y-2">
              <label className="block">
                <div className="text-xs font-medium text-muted-foreground mb-1.5">Order notes (optional)</div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Delivery instructions, installation notes…" className={inputCls} />
              </label>
            </div>
          </div>

          {/* Summary */}
          <aside className="surface-card p-6 h-fit space-y-4 lg:sticky lg:top-20">
            <h2 className="text-display text-xl">Your order</h2>
            <ul className="space-y-3 text-sm">
              {items.map((i: any) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{i.products.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {i.quantity}</div>
                  </div>
                  <div className="whitespace-nowrap">{formatPKR(Number(i.products.discount_price_pkr ?? i.products.price_pkr) * i.quantity)}</div>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 border-t border-border pt-4">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className={inputCls} />
              <button onClick={applyCoupon} className="rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary">Apply</button>
            </div>
            <dl className="space-y-2 text-sm">
              <Row k="Subtotal" v={formatPKR(subtotal)} />
              {discount > 0 && <Row k="Discount" v={`-${formatPKR(discount)}`} accent />}
              <Row k="Shipping" v={shipping === 0 ? "Free" : formatPKR(shipping)} />
              <div className="flex justify-between pt-3 border-t border-border text-base font-semibold">
                <dt>Total</dt><dd>{formatPKR(total)}</dd>
              </div>
            </dl>
            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-copper px-5 py-3 text-sm font-semibold text-copper-foreground hover:opacity-90 disabled:opacity-50"
            >
              {placing ? "Placing order…" : `Place order · ${formatPKR(total)}`}
            </button>
            <p className="text-[11px] text-muted-foreground text-center inline-flex items-center justify-center gap-1.5 w-full">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout · COD available nationwide
            </p>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return <div className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className={accent ? "text-copper font-medium" : ""}>{v}</dd></div>;
}
