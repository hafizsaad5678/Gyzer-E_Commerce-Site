/**
 * Shared coupon-validation utility.
 * Used by both cart.tsx and checkout.tsx to avoid duplicated logic.
 *
 * Checks (in order):
 *  1. Code exists and is active
 *  2. Not expired (expires_at)
 *  3. Under usage limit (usage_limit vs times_used)
 *  4. Meets minimum order value (min_order_pkr)
 *
 * Call incrementCouponUsage() after a successful order is placed.
 */
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";

export type CouponResult =
  | { ok: true; discount: number; message: string; couponId: string }
  | { ok: false; message: string };

export async function applyCoupon(code: string, subtotal: number): Promise<CouponResult> {
  if (!code.trim()) return { ok: false, message: "Please enter a coupon code" };

  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { ok: false, message: "Invalid or inactive coupon code" };

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { ok: false, message: "This coupon has expired" };
  }

  // Check usage limit
  if (data.usage_limit != null && data.times_used >= data.usage_limit) {
    return { ok: false, message: "This coupon has reached its usage limit" };
  }

  // Check minimum order
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
    couponId: data.id,
  };
}

/**
 * Increment times_used for a coupon after a successful order.
 * Call this inside placeOrder() after the order is confirmed.
 */
export async function incrementCouponUsage(code: string): Promise<void> {
  if (!code.trim()) return;
  await supabase.rpc("increment_coupon_usage", { coupon_code: code.trim().toUpperCase() });
}
