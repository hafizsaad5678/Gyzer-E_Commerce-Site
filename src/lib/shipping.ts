/**
 * Shipping cost calculation — per-product zone tiers.
 *
 * Each product can define a `shipping_zones` object with up to 4 tiers:
 *   { city: 0, province: 500, country: 1200, international: 3000 }
 *
 * At checkout the customer's address is matched in order:
 *   1. city      → customer city  === company city
 *   2. province  → customer province === company province
 *   3. country   → customer country  === "Pakistan"
 *   4. international → everything else
 *
 * When a cart has multiple products the HIGHEST applicable fee wins
 * (most expensive to ship sets the rate for the whole cart).
 *
 * Fallback (no shipping_zones on any product):
 *   - subtotal > 20,000  → Rs 800
 *   - subtotal ≤ 20,000  → Rs 1,200
 */

// ─── Company location constants ───────────────────────────────────────────────

export const COMPANY_CITY     = "gujranwala";
export const COMPANY_PROVINCE = "punjab";
export const COMPANY_COUNTRY  = "pakistan";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShippingZones = {
  city?:          number | null;
  province?:      number | null;
  country?:       number | null;
  international?: number | null;
};

type ProductShipping = {
  shipping_zones?: ShippingZones | null;
};

type CartItem = {
  quantity: number;
  product?:  ProductShipping;
  products?: ProductShipping;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Determine which zone a customer address falls into relative to
 * the company location.
 */
export function resolveZone(
  city:     string,
  province: string,
  country:  string,
): "city" | "province" | "country" | "international" {
  const c  = norm(city);
  const pr = norm(province);
  const co = norm(country);

  if (c  === COMPANY_CITY)     return "city";
  if (pr === COMPANY_PROVINCE) return "province";
  if (co === COMPANY_COUNTRY || co === "pk" || co === "") return "country";
  return "international";
}

/**
 * Get the shipping fee for a single product given the resolved zone.
 * Returns null if the product has no shipping_zones defined.
 */
function productFee(zones: ShippingZones, zone: "city" | "province" | "country" | "international"): number | null {
  const fee = zones[zone];
  return fee != null ? Number(fee) : null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * @param subtotal  Cart subtotal in PKR (fallback tiers)
 * @param items     Cart line items
 * @param city      Customer city
 * @param province  Customer province
 * @param country   Customer country (defaults to "Pakistan")
 */
export function calcShipping(
  subtotal: number,
  items:    CartItem[] = [],
  city      = "",
  province  = "",
  country   = "Pakistan",
): number {
  if (subtotal === 0) return 0;

  const zone = resolveZone(city, province, country);

  // Collect per-product fees for the resolved zone
  const fees: number[] = [];
  for (const item of items) {
    const p = item.product ?? item.products;
    const zones = p?.shipping_zones;
    if (!zones) continue;
    const fee = productFee(zones, zone);
    if (fee !== null) fees.push(fee);
  }

  // If any product has zone fees → use the max across all items
  if (fees.length > 0) {
    return Math.max(...fees);
  }

  // Fallback global tiers (no per-product zones set)
  if (zone === "city") return 0;
  if (subtotal > 20_000) return 800;
  return 1_200;
}

/** Convenience: human-readable label for the shipping row */
export function shippingZoneLabel(zone: "city" | "province" | "country" | "international"): string {
  return {
    city:          "Same city (Gujranwala)",
    province:      "Within Punjab",
    country:       "Nationwide",
    international: "International",
  }[zone];
}
