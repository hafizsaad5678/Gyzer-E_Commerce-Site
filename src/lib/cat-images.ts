/**
 * Shared fallback images keyed by category slug.
 * Import this instead of duplicating the catImg map in every route file.
 */
import imgElectric from "@/assets/product-electric.jpg";
import imgGas from "@/assets/product-gas.jpg";
import imgInstant from "@/assets/product-instant.jpg";
import imgSolar from "@/assets/product-solar.jpg";

export const catImg: Record<string, string> = {
 electric: imgElectric,
 gas: imgGas,
 instant: imgInstant,
 solar: imgSolar,
};
