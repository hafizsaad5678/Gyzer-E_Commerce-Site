/**
 * Shared shipping cost calculation.
 * Used by both cart.tsx and checkout.tsx.
 */
export function calcShipping(subtotal: number): number {
  if (subtotal === 0 || subtotal > 50_000) return 0;
  if (subtotal > 20_000) return 800;
  return 1_200;
}
