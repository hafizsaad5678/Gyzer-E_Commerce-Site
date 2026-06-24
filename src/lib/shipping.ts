/**
 * Shared shipping cost calculation.
 * Used by both cart.tsx and checkout.tsx.
 *
 * Logic (in priority order):
 * 1. Empty cart → free
 * 2. Same city as company (Gujranwala) → free
 * 3. Any item has a per-product shipping_fee_pkr set →
 *    take the MAX across all items (heaviest item wins)
 * 4. Fallback to global subtotal-based tiers
 */

/** The company's home city — same-city deliveries are always free. */
export const COMPANY_CITY = "gujranwala";

/** Normalise a city string for comparison */
function normaliseCity(city: string): string {
 return city.trim().toLowerCase().replace(/[^a-z]/g, "");
}

export function isSameCity(customerCity: string): boolean {
 return normaliseCity(customerCity) === normaliseCity(COMPANY_CITY);
}

type CartItem = {
 quantity: number;
 /** product may be nested as `product` or `products` depending on the caller */
 product?: { shipping_fee_pkr?: number | null };
 products?: { shipping_fee_pkr?: number | null };
};

/**
 * @param subtotal   Cart subtotal in PKR (used for global tier fallback)
 * @param items      Cart line items (optional — enables per-product fee logic)
 * @param city       Customer's destination city (optional — enables same-city free)
 */
export function calcShipping(
 subtotal: number,
 items: CartItem[] = [],
 city = "",
): number {
 if (subtotal === 0) return 0;

 // Same city → always free
 if (city && isSameCity(city)) return 0;

 // Collect per-product fees (ignoring items where fee is null/undefined)
 const fees = items
  .map((i) => {
   const p = i.product ?? i.products;
   return p?.shipping_fee_pkr != null ? Number(p.shipping_fee_pkr) : null;
  })
  .filter((f): f is number => f !== null);

 // If any item has a per-product fee → use the max (most expensive to ship wins)
 if (fees.length > 0) {
  return Math.max(...fees);
 }

 // Global subtotal-based tiers
 if (subtotal > 50_000) return 0;
 if (subtotal > 20_000) return 800;
 return 1_200;
}
