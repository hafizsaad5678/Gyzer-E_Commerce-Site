import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { OrderSummaryPanel } from "@/components/site/OrderSummaryPanel";
import { CouponInput } from "@/components/site/CouponInput";
import {
 PaymentMethodSelector,
 BankTransferInfo,
 MobileWalletInfo,
 type PaymentMethod,
} from "@/components/checkout/PaymentMethodSelector";
import { AddressForm, type AddressFields } from "@/components/checkout/AddressForm";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { calcShipping, resolveZone, shippingZoneLabel } from "@/lib/shipping";
import { ArrowLeft, ShieldCheck, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
 head: () => ({
 meta: [{ title: "Checkout — Asif Brothers" }, { name: "robots", content: "noindex" }],
 }),
 component: Checkout,
});

const EMPTY_ADDRESS: AddressFields = {
 full_name: "",
 phone: "",
 line1: "",
 line2: "",
 city: "",
 province: "",
 postal_code: "",
 country: "Pakistan",
};

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function Checkout() {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(true);
 const [placing, setPlacing] = useState(false);
 const [items, setItems] = useState<any[]>([]);
 const [addresses, setAddresses] = useState<any[]>([]);
 const [selectedAddr, setSelectedAddr] = useState<string>("");
 const [email, setEmail] = useState("");
 const [discount, setDiscount] = useState(0);
 const [couponCode, setCouponCode] = useState("");
 const [notes, setNotes] = useState("");
 const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
 const [newAddr, setNewAddr] = useState<AddressFields>(EMPTY_ADDRESS);
 const [useNew, setUseNew] = useState(false);
 // committedAddr is what shipping is actually calculated from for new addresses
 // It only updates when the user clicks "Calculate Shipping"
 const [committedAddr, setCommittedAddr] = useState<AddressFields | null>(null);
 const [shippingCalculated, setShippingCalculated] = useState(false);

 useEffect(() => {
 (async () => {
 const { data: s } = await supabase.auth.getSession();
 if (!s.session) {
 navigate({ to: "/auth", search: { redirect: "/checkout" } as any });
 return;
 }
 setEmail(s.session.user.email ?? "");
 const [{ data: ci }, { data: addr }] = await Promise.all([
 supabase.from("cart_items").select("id,quantity,products(id,name,sku,price_pkr,discount_price_pkr,stock,shipping_zones)").order("created_at"),
 supabase.from("addresses").select("*").order("is_default", { ascending: false }),
 ]);
 setItems(ci ?? []);
 setAddresses(addr ?? []);
 if (addr && addr.length) setSelectedAddr(addr[0].id);
 else setUseNew(true);
 setLoading(false);
 })();
 }, [navigate]);

 const subtotal = items.reduce(
 (s, i) => s + Number(i.products?.discount_price_pkr ?? i.products?.price_pkr ?? 0) * i.quantity,
 0,
 );
 // Resolve the address for shipping calc:
 // - saved address: use immediately
 // - new address: only use committedAddr (set when user clicks Calculate Shipping)
 const resolvedAddr = (() => {
 if (useNew) return committedAddr ?? EMPTY_ADDRESS;
 return addresses.find((x: any) => x.id === selectedAddr) ?? EMPTY_ADDRESS;
 })();
 const zone = resolveZone(
 resolvedAddr.city ?? "",
 resolvedAddr.province ?? "",
 resolvedAddr.country ?? "Pakistan",
 );
 const shipping = calcShipping(subtotal, items, resolvedAddr.city ?? "", resolvedAddr.province ?? "", resolvedAddr.country ?? "Pakistan");
 const total = Math.max(0, subtotal - discount + shipping);

 function handleCalculateShipping() {
 if (!newAddr.city || !newAddr.province) {
 return toast.error("Please enter city and province to calculate shipping");
 }
 setCommittedAddr({ ...newAddr });
 setShippingCalculated(true);
 }

 async function placeOrder() {
 if (items.length === 0) return toast.error("Cart is empty");

 // Validate email
 if (!email.includes("@")) {
 return toast.error("Please enter a valid email address");
 }

 let shipping_address: any;
 if (useNew) {
 if (
 !newAddr.full_name ||
 !newAddr.phone ||
 !newAddr.line1 ||
 !newAddr.city ||
 !newAddr.province
 ) {
 return toast.error("Please fill in all required shipping address fields");
 }
 const phoneDigits = newAddr.phone.replace(/\D/g, "");
 if (phoneDigits.length < 9 || phoneDigits.length > 11) {
 return toast.error("Phone number must be 9–11 digits");
 }
 if (newAddr.postal_code) {
 const postalDigits = newAddr.postal_code.replace(/\D/g, "");
 if (postalDigits.length < 4 || postalDigits.length > 6) {
 return toast.error("Postal code must be 4–6 digits");
 }
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

 // Save new address for future orders
 if (useNew) {
 await supabase.from("addresses").insert({
 ...newAddr,
 user_id,
 is_default: addresses.length === 0,
 });
 }

 // Create order record
 const { data: order, error } = await supabase
 .from("orders")
 .insert({
 user_id,
 email,
 subtotal_pkr: subtotal,
 discount_pkr: discount,
 shipping_pkr: shipping,
 total_pkr: total,
 coupon_code: discount > 0 ? couponCode : null,
 shipping_address,
 notes: `[Payment: ${paymentMethod.toUpperCase()}] ${notes}`.trim(),
 status: "pending",
 payment_status: "pending",
 })
 .select()
 .single();

 if (error || !order) {
 setPlacing(false);
 return toast.error(error?.message ?? "Could not place order");
 }

 // Insert order line items
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
 if (oiErr) {
 setPlacing(false);
 return toast.error(oiErr.message);
 }

  // Decrement stock and send low-stock alerts if needed
  await Promise.all(
    items.map(async (i: any) => {
      const currentStock = i.products.stock ?? 0;
      const newStock = Math.max(0, currentStock - i.quantity);
      // Direct update — more reliable than RPC
      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", i.products.id);
      if (currentStock >= 5 && newStock < 5) {
        await supabase.from("contact_messages").insert({
          name: "System Alert",
          email: "system@asifbrothers.com",
          subject: `Low Stock Alert: ${i.products.name}`,
          message: `The product "${i.products.name}" has just dropped to ${newStock} items in stock after a recent purchase. Please restock soon!`,
          is_read: false,
        });
      }
    }),
  );

 // Clear cart
 await supabase.from("cart_items").delete().eq("user_id", user_id);

 setPlacing(false);
 toast.success("Order placed!");
 navigate({ to: "/order-confirmation/$id", params: { id: order.id } });
 }

 if (loading) {
 return (
 <SiteLayout>
 <div className="container-page py-20 text-muted-foreground">Loading…</div>
 </SiteLayout>
 );
 }

 if (items.length === 0) {
 return (
 <SiteLayout>
 <div className="container-page py-32 text-center">
 <h1 className="text-display text-3xl mb-3">Your cart is empty</h1>
 <Link to="/shop" className="text-copper underline">
 Browse products
 </Link>
 </div>
 </SiteLayout>
 );
 }

 return (
 <SiteLayout>
 <section className="container-page py-10 md:py-14">
 <Link
 to="/cart"
 className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
 >
 <ArrowLeft className="h-4 w-4" /> Back to cart
 </Link>
 <h1 className="text-display text-4xl mb-8">Checkout</h1>

 <div className="grid lg:grid-cols-[1fr_400px] gap-8">
 {/* Left: forms */}
 <div className="space-y-6">
 {/* Contact */}
 <div className="surface-card p-6 space-y-4">
 <h2 className="text-display text-xl">Contact</h2>
 <label className="block">
 <div className="text-xs font-medium text-muted-foreground mb-1.5">Email</div>
 <input
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className={inputCls}
 />
 </label>
 </div>

 {/* Shipping address */}
 <div className="surface-card p-6 space-y-4">
 <h2 className="text-display text-xl">Shipping address</h2>
 {addresses.length > 0 && (
 <div className="space-y-2">
 {addresses.map((a) => (
 <label
 key={a.id}
 className={[
 "flex items-start gap-3 p-3 rounded-md border cursor-pointer",
 !useNew && selectedAddr === a.id
 ? "border-copper bg-copper/5"
 : "border-border",
 ].join(" ")}
 >
 <input
 type="radio"
 checked={!useNew && selectedAddr === a.id}
 onChange={() => {
 setUseNew(false);
 setSelectedAddr(a.id);
 }}
 className="mt-1"
 />
 <div className="text-sm">
 <div className="font-medium">
 {a.full_name}{" "}
 <span className="text-muted-foreground font-normal">· {a.phone}</span>
 </div>
 <div className="text-muted-foreground">
 {a.line1}
 {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.province}{" "}
 {a.postal_code ?? ""}, {a.country}
 </div>
 </div>
 </label>
 ))}
 <label
 className={[
 "flex items-center gap-3 p-3 rounded-md border cursor-pointer",
 useNew ? "border-copper bg-copper/5" : "border-border",
 ].join(" ")}
 >
 <input type="radio" checked={useNew} onChange={() => setUseNew(true)} />
 <span className="text-sm">Use a different address</span>
 </label>
 </div>
 )}
 {useNew && <AddressForm value={newAddr} onChange={(v) => {
 setNewAddr(v);
 // Reset shipping when address changes so user must recalculate
 if (shippingCalculated) setShippingCalculated(false);
 }} />}
 {useNew && (
 <button
 type="button"
 onClick={handleCalculateShipping}
 className="inline-flex items-center gap-2 rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-4 py-2 text-sm font-medium"
 >
 <MapPin className="h-4 w-4" />
 {shippingCalculated ? "Recalculate shipping" : "Calculate shipping"}
 </button>
 )}
 {useNew && shippingCalculated && (
 <p className="text-xs text-success">
 ✓ Shipping calculated for {committedAddr?.city}, {committedAddr?.province} — {formatPKR(shipping)}
 </p>
 )}
 </div>

 {/* Payment method */}
 <div className="surface-card p-6 space-y-4">
 <h2 className="text-display text-xl">Payment method</h2>
 <PaymentMethodSelector selected={paymentMethod} onChange={setPaymentMethod} />
 {paymentMethod === "bank" && <BankTransferInfo />}
 {(paymentMethod === "easypaisa" || paymentMethod === "jazzcash") && (
 <MobileWalletInfo method={paymentMethod} total={total} />
 )}
 </div>

 {/* Order notes */}
 <div className="surface-card p-6">
 <label className="block">
 <div className="text-xs font-medium text-muted-foreground mb-1.5">
 Order notes (optional)
 </div>
 <textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 rows={3}
 placeholder="Delivery instructions, installation notes…"
 className={inputCls}
 />
 </label>
 </div>
 </div>

 {/* Right: order summary */}
 <aside className="surface-card p-6 h-fit space-y-4 lg:sticky lg:top-20">
 <h2 className="text-display text-xl">Your order</h2>

 {/* Items list */}
 <ul className="space-y-3 text-sm">
 {items.map((i: any) => (
 <li key={i.id} className="flex justify-between gap-3">
 <div className="min-w-0">
 <div className="truncate font-medium">{i.products.name}</div>
 <div className="text-xs text-muted-foreground">Qty {i.quantity}</div>
 </div>
 <div className="whitespace-nowrap">
 {formatPKR(
 Number(i.products.discount_price_pkr ?? i.products.price_pkr) * i.quantity,
 )}
 </div>
 </li>
 ))}
 </ul>

 <div className="border-t border-border pt-4">
 <CouponInput
 subtotal={subtotal}
 onApplied={(amt, code) => {
 setDiscount(amt);
 setCouponCode(code);
 }}
 />
 </div>

 <OrderSummaryPanel
 subtotal={subtotal}
 discount={discount}
 shipping={shipping}
 total={total}
 shippingLabel={
 (!useNew || shippingCalculated) && shipping === 0
 ? `Free · ${shippingZoneLabel(zone)}`
 : useNew && !shippingCalculated
 ? "Enter address to calculate"
 : undefined
 }
 />

 <button
 onClick={placeOrder}
 disabled={placing}
 className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-copper px-5 py-3 text-sm font-semibold text-copper-foreground disabled:opacity-50"
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
