/**
 * StockInput — inline editable stock field for the admin products table.
 * Saves on blur if the value changed.
 * Extracted from _authenticated.admin.products.tsx.
 */
import { useEffect, useState } from "react";

type Props = {
 product: { id: string; stock: number };
 onSave: (id: string, newStock: number) => void;
};

export function StockInput({ product, onSave }: Props) {
 const [val, setVal] = useState(String(product.stock));

 // Sync when external data changes (e.g. after edit modal save)
 useEffect(() => {
 setVal(String(product.stock));
 }, [product.stock]);

 return (
 <input
 type="number"
 value={val}
 onChange={(e) => setVal(e.target.value)}
 onBlur={() => {
 const num = Number(val);
 if (!Number.isNaN(num) && num !== product.stock) {
 onSave(product.id, num);
 }
 }}
 className={[
 "w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-right",
 product.stock <= 5 ? "text-destructive font-semibold" : "",
 ].join(" ")}
 />
 );
}
