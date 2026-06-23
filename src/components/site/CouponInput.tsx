/**
 * CouponInput — shared coupon code field used in cart and checkout.
 */
import { useState } from "react";
import { applyCoupon } from "@/lib/coupon";
import { toast } from "sonner";

type Props = {
 subtotal: number;
 onApplied: (discount: number, code: string) => void;
};

export function CouponInput({ subtotal, onApplied }: Props) {
 const [coupon, setCoupon] = useState("");
 const [loading, setLoading] = useState(false);

 async function handleApply() {
 if (!coupon.trim()) return;
 setLoading(true);
 const result = await applyCoupon(coupon, subtotal);
 setLoading(false);
 if (!result.ok) {
 toast.error(result.message);
 } else {
 toast.success(result.message);
 onApplied(result.discount, coupon.trim().toUpperCase());
 }
 }

 return (
 <div className="flex gap-2">
 <input
 value={coupon}
 onChange={(e) => setCoupon(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && handleApply()}
 placeholder="Coupon code"
 className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
 />
 <button
 onClick={handleApply}
 disabled={loading}
 className="rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
 >
 {loading ? "…" : "Apply"}
 </button>
 </div>
 );
}
