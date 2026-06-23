/**
 * ProductEditor — create / edit product modal for the admin products page.
 * Extracted from _authenticated.admin.products.tsx.
 */
import { useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/lib/upload";

export type Category = { id: string; name: string; slug: string };
type Product = any; // keep loose — matches the existing pattern

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function slugify(s: string) {
 return s
 .toLowerCase()
 .trim()
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/(^-|-$)/g, "");
}

type Props = {
 initial: Product | null;
 categories: Category[];
 onClose: () => void;
 onSaved: () => void;
};

export function ProductEditor({ initial, categories, onClose, onSaved }: Props) {
 const isEdit = !!initial;

 const [form, setForm] = useState({
 name: initial?.name ?? "",
 slug: initial?.slug ?? "",
 sku: initial?.sku ?? "",
 brand: initial?.brand ?? "",
 category_id: initial?.category_id ?? categories[0]?.id ?? "",
 short_description: initial?.short_description ?? "",
 description: initial?.description ?? "",
 price_pkr: initial?.price_pkr ?? 0,
 discount_price_pkr: initial?.discount_price_pkr ?? "",
 stock: initial?.stock ?? 0,
 low_stock_threshold: initial?.low_stock_threshold ?? 5,
 capacity_liters: initial?.capacity_liters ?? "",
 warranty_months: initial?.warranty_months ?? "",
 energy_rating: initial?.energy_rating ?? "",
 cover_image_url: initial?.cover_image_url ?? "",
 is_active: initial?.is_active ?? true,
 is_featured: initial?.is_featured ?? false,
 });

 const [specs, setSpecs] = useState<Array<{ k: string; v: string }>>(() => {
 const s = (initial?.specifications ?? {}) as Record<string, any>;
 const entries = Object.entries(s).map(([k, v]) => ({
 k,
 v: Array.isArray(v) ? v.join(", ") : String(v),
 }));
 return entries.length ? entries : [{ k: "", v: "" }];
 });

 const [uploading, setUploading] = useState(false);
 const [saving, setSaving] = useState(false);

 function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
 setForm((f) => ({ ...f, [k]: v }));
 }

 async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
 const file = e.target.files?.[0];
 if (!file) return;
 setUploading(true);
 try {
 const url = await uploadProductImage(file);
 set("cover_image_url", url);
 toast.success("Image uploaded");
 } catch (err: any) {
 toast.error(err.message ?? "Upload failed");
 } finally {
 setUploading(false);
 }
 }

 async function save() {
 if (!form.name || !form.sku || !form.price_pkr) {
 return toast.error("Name, SKU, and price are required");
 }
 setSaving(true);

 const specsObj: Record<string, string> = {};
 specs.forEach(({ k, v }) => {
 if (k.trim()) specsObj[k.trim()] = v;
 });

 const payload: any = {
 name: form.name,
 slug: form.slug || slugify(form.name),
 sku: form.sku,
 brand: form.brand || null,
 category_id: form.category_id || null,
 short_description: form.short_description || null,
 description: form.description || null,
 price_pkr: Number(form.price_pkr),
 discount_price_pkr: form.discount_price_pkr === "" ? null : Number(form.discount_price_pkr),
 stock: Number(form.stock),
 low_stock_threshold: Number(form.low_stock_threshold),
 capacity_liters: form.capacity_liters === "" ? null : Number(form.capacity_liters),
 warranty_months: form.warranty_months === "" ? null : Number(form.warranty_months),
 energy_rating: form.energy_rating || null,
 cover_image_url: form.cover_image_url || null,
 is_active: form.is_active,
 is_featured: form.is_featured,
 specifications: specsObj,
 };

 const { error } = isEdit
 ? await supabase.from("products").update(payload).eq("id", initial!.id)
 : await supabase.from("products").insert(payload);

 setSaving(false);
 if (error) return toast.error(error.message);
 toast.success(isEdit ? "Product updated" : "Product created");
 onSaved();
 }

 return (
 <div
 className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
 onClick={onClose}
 >
 <div
 className="surface-card w-full max-w-3xl my-8 p-6 md:p-8"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex justify-between items-start mb-6">
 <div>
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-1">
 {isEdit ? "Edit" : "New"} product
 </div>
 <h2 className="text-display text-2xl">{isEdit ? form.name : "Add a new product"}</h2>
 </div>
 <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Basic fields */}
 <div className="grid md:grid-cols-2 gap-4">
 <Field label="Name *">
 <input
 value={form.name}
 onChange={(e) => set("name", e.target.value)}
 className={inputCls}
 />
 </Field>
 <Field label="Slug">
 <input
 value={form.slug}
 onChange={(e) => set("slug", e.target.value)}
 placeholder={slugify(form.name)}
 className={inputCls}
 />
 </Field>
 <Field label="SKU *">
 <input
 value={form.sku}
 onChange={(e) => set("sku", e.target.value)}
 className={inputCls}
 />
 </Field>
 <Field label="Brand">
 <input
 value={form.brand}
 onChange={(e) => set("brand", e.target.value)}
 className={inputCls}
 />
 </Field>
 <Field label="Category">
 <select
 value={form.category_id}
 onChange={(e) => set("category_id", e.target.value)}
 className={inputCls}
 >
 <option value="">— none —</option>
 {categories.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name}
 </option>
 ))}
 </select>
 </Field>
 <Field label="Energy rating">
 <input
 value={form.energy_rating}
 onChange={(e) => set("energy_rating", e.target.value)}
 placeholder="A+"
 className={inputCls}
 />
 </Field>
 <Field label="Price (PKR) *">
 <input
 type="number"
 value={form.price_pkr}
 onChange={(e) => set("price_pkr", e.target.value as any)}
 className={inputCls}
 />
 </Field>
 <Field label="Discounted price (PKR)">
 <input
 type="number"
 value={form.discount_price_pkr}
 onChange={(e) => set("discount_price_pkr", e.target.value as any)}
 className={inputCls}
 />
 </Field>
 <Field label="Stock">
 <input
 type="number"
 value={form.stock}
 onChange={(e) => set("stock", e.target.value as any)}
 className={inputCls}
 />
 </Field>
 <Field label="Low-stock threshold">
 <input
 type="number"
 value={form.low_stock_threshold}
 onChange={(e) => set("low_stock_threshold", e.target.value as any)}
 className={inputCls}
 />
 </Field>
 <Field label="Capacity (L)">
 <input
 type="number"
 value={form.capacity_liters}
 onChange={(e) => set("capacity_liters", e.target.value as any)}
 className={inputCls}
 />
 </Field>
 <Field label="Warranty (months)">
 <input
 type="number"
 value={form.warranty_months}
 onChange={(e) => set("warranty_months", e.target.value as any)}
 className={inputCls}
 />
 </Field>
 </div>

 <Field label="Short description" className="mt-4">
 <input
 value={form.short_description}
 onChange={(e) => set("short_description", e.target.value)}
 className={inputCls}
 />
 </Field>
 <Field label="Full description" className="mt-4">
 <textarea
 value={form.description}
 onChange={(e) => set("description", e.target.value)}
 rows={4}
 className={inputCls}
 />
 </Field>

 {/* Image upload */}
 <Field label="Cover image" className="mt-4">
 <div className="flex items-center gap-4">
 {form.cover_image_url ? (
 <img
 src={form.cover_image_url}
 alt=""
 className="h-20 w-20 rounded object-cover bg-steel/30"
 />
 ) : (
 <div className="h-20 w-20 rounded bg-steel/30 grid place-items-center text-muted-foreground text-xs">
 No image
 </div>
 )}
 <label className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-secondary">
 <Upload className="h-4 w-4" />
 {uploading ? "Uploading…" : "Upload image"}
 <input
 type="file"
 accept="image/*"
 onChange={onFile}
 className="hidden"
 disabled={uploading}
 />
 </label>
 {form.cover_image_url && (
 <button
 onClick={() => set("cover_image_url", "")}
 className="text-xs text-muted-foreground hover:text-destructive"
 >
 Remove
 </button>
 )}
 </div>
 </Field>

 {/* Dynamic specifications */}
 <div className="mt-6">
 <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
 Specifications
 </div>
 <div className="space-y-2">
 {specs.map((s, i) => (
 <div key={i} className="flex gap-2">
 <input
 placeholder="Key (e.g. material)"
 value={s.k}
 onChange={(e) =>
 setSpecs((arr) =>
 arr.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)),
 )
 }
 className={inputCls + " flex-1"}
 />
 <input
 placeholder="Value"
 value={s.v}
 onChange={(e) =>
 setSpecs((arr) =>
 arr.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)),
 )
 }
 className={inputCls + " flex-1"}
 />
 <button
 onClick={() => setSpecs((arr) => arr.filter((_, j) => j !== i))}
 className="text-muted-foreground hover:text-destructive"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 ))}
 <button
 onClick={() => setSpecs((arr) => [...arr, { k: "", v: "" }])}
 className="text-xs text-copper hover:underline"
 >
 + Add specification
 </button>
 </div>
 </div>

 {/* Toggles */}
 <div className="mt-6 flex flex-wrap items-center gap-6">
 <label className="inline-flex items-center gap-2 text-sm">
 <input
 type="checkbox"
 checked={form.is_active}
 onChange={(e) => set("is_active", e.target.checked)}
 />
 Active
 </label>
 <label className="inline-flex items-center gap-2 text-sm">
 <input
 type="checkbox"
 checked={form.is_featured}
 onChange={(e) => set("is_featured", e.target.checked)}
 />
 Featured
 </label>
 </div>

 {/* Actions */}
 <div className="mt-8 flex justify-end gap-3">
 <button onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm">
 Cancel
 </button>
 <button
 onClick={save}
 disabled={saving}
 className="rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-5 py-2 text-sm font-medium disabled:opacity-50"
 >
 {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
 </button>
 </div>
 </div>
 </div>
 );
}

/** Reusable labelled field wrapper used throughout the editor */
export function Field({
 label,
 children,
 className = "",
}: {
 label: string;
 children: React.ReactNode;
 className?: string;
}) {
 return (
 <label className={`block ${className}`}>
 <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
 {children}
 </label>
 );
}
