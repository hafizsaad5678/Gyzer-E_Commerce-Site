const KEY = "compare_products";
const MAX = 3;

export type CompareItem = {
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
 energy_rating: string | null;
 category_name: string | null;
};

export function getCompareList(): CompareItem[] {
 try {
 return JSON.parse(localStorage.getItem(KEY) ?? "[]");
 } catch {
 return [];
 }
}

/** Returns true if added, false if already present or list full */
export function addToCompare(item: CompareItem): boolean {
 try {
 const list = getCompareList();
 if (list.some((p) => p.id === item.id)) return false;
 if (list.length >= MAX) return false;
 list.push(item);
 localStorage.setItem(KEY, JSON.stringify(list));
 return true;
 } catch {
 return false;
 }
}

export function removeFromCompare(id: string) {
 try {
 const list = getCompareList().filter((p) => p.id !== id);
 localStorage.setItem(KEY, JSON.stringify(list));
 } catch {}
}

export function clearCompare() {
 try {
 localStorage.removeItem(KEY);
 } catch {}
}
