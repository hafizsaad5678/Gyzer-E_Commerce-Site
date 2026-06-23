const KEY = "rv_products";
const MAX = 8;

export type RVItem = {
 id: string;
 slug: string;
 name: string;
 brand: string | null;
 price_pkr: number;
 discount_price_pkr: number | null;
 cover_image_url: string | null;
 capacity_liters: number | null;
 warranty_months: number | null;
 stock: number;
};

export function getRecentlyViewed(): RVItem[] {
 try {
 return JSON.parse(localStorage.getItem(KEY) ?? "[]");
 } catch {
 return [];
 }
}

export function addRecentlyViewed(item: RVItem) {
 try {
 const list = getRecentlyViewed().filter((p) => p.id !== item.id);
 list.unshift(item);
 localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
 } catch {
 // silently fail in SSR or storage-blocked contexts
 }
}
