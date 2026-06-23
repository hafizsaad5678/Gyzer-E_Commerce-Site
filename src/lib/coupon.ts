/**
 * Shared coupon-validation utility.
 * Used by both cart.tsx and checkout.tsx to avoid duplicated logic.
 */
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";

export type CouponResult =
  | { ok: true; discount: number; message: string }
  | { ok: false; message: string };

export async function applyCoupon(code: string, subtotal: number): Promise<CouponResult> {
  if (!code.trim()) return { ok: false, message: "Please enter a coupon code" };

  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { ok: false, message: "Invalid coupon code" };

  if (subtotal < Number(data.min_order_pkr ?? 0)) {
    return {
      ok: false,
      message: `Minimum order for this coupon is ${formatPKR(data.min_order_pkr)}`,
    };
  }

  const discount = data.discount_percent
    ? subtotal * (data.discount_percent / 100)
    : Number(data.discount_amount_pkr ?? 0);

  return {
    ok: true,
    discount,
    message: `Coupon applied: -${formatPKR(discount)}`,
  };
}
