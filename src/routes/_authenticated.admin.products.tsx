import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { uploadProductImage } from "@/lib/upload";
import { Search, Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import imgElectric from "@/assets/product-electric.jpg";
import imgGas from "@/assets/product-gas.jpg";
import imgInstant from "@/assets/product-instant.jpg";
import imgSolar from "@/assets/product-solar.jpg";

const catImg: Record<string, string> = { electric: imgElectric, gas: imgGas, instant: imgInstant, solar: imgSolar };

type ProductSearch = {
  category?: string;
};

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
  validateSearch: (search: Record<string, unknown>): ProductSearch => {
    return {
      category: search.category as string | undefined,
    };
  },
});

type Category = { id: string; name: string; slug: string };
type Product = any;

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function AdminProducts() {
  const search = Route.useSearch();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(search.category ?? "");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    setCategoryFilter(search.category ?? "");
  }, [search.category]);

  async function load() {
    const [{ data: ps }, { data: cs }] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(id,name,slug)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name,slug").order("name"),
    ]);
    setProducts(ps ?? []);
    setCategories((cs as Category[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function toggle(id: string, field: "is_active" | "is_featured", value: boolean) {
    await supabase.from("products").update({ [field]: value } as any).eq("id", id);
    load();
  }
  async function updateStock(id: string, stock: number) {
    if (Number.isNaN(stock) || stock < 0) return;
    const { error } = await supabase.from("products").update({ stock }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Stock updated");
    load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    load();
  }

  const filtered = products.filter(
    (p) => (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())) &&
           (!categoryFilter || p.categories?.slug === categoryFilter)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Catalog</div>
          <h1 className="text-display text-4xl">Products</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm w-64" />
          </div>
          <div className="relative">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm w-48 appearance-none">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> New product
          </button>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="text-center px-4 py-3">Active</th>
                <th className="text-center px-4 py-3">Featured</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const imgUrl = p.cover_image_url || catImg[p.categories?.slug ?? ""];
                return (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {imgUrl ? (
                        <img src={imgUrl} alt="" className="h-10 w-10 rounded object-cover bg-steel/30 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-steel/30 shrink-0" />
                      )}
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.sku} · {p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.categories?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{formatPKR(p.discount_price_pkr ?? p.price_pkr)}</td>
                  <td className="px-4 py-3 text-right">
                    <StockInput product={p} onSave={updateStock} />
                  </td>
                  <td className="px-4 py-3 text-center"><Toggle checked={p.is_active} onChange={(v) => toggle(p.id, "is_active", v)} /></td>
                  <td className="px-4 py-3 text-center"><Toggle checked={p.is_featured} onChange={(v) => toggle(p.id, "is_featured", v)} /></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(p)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-3">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => remove(p.id)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showNew || editing) && (
        <ProductEditor
          initial={editing}
          categories={categories}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onSaved={() => { setShowNew(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked ? "bg-copper" : "bg-muted"}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  );
}

function StockInput({ product, onSave }: { product: Product; onSave: (id: string, val: number) => void }) {
  const [val, setVal] = useState(String(product.stock));
  
  // Sync if external data changes (like from a purchase or edit modal)
  useEffect(() => { setVal(String(product.stock)); }, [product.stock]);

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
      className={`w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-right ${product.stock <= 5 ? "text-destructive font-semibold" : ""}`}
    />
  );
}

function ProductEditor({
  initial, categories, onClose, onSaved,
}: { initial: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    sku: initial?.sku ?? "",
    brand: initial?.brand ?? "",
    category_id: initial?.category_id ?? (categories[0]?.id ?? ""),
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
    const entries = Object.entries(s).map(([k, v]) => ({ k, v: Array.isArray(v) ? v.join(", ") : String(v) }));
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
    if (!form.name || !form.sku || !form.price_pkr) return toast.error("Name, SKU, and price are required");
    setSaving(true);
    const specsObj: Record<string, string> = {};
    specs.forEach(({ k, v }) => { if (k.trim()) specsObj[k.trim()] = v; });
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="surface-card w-full max-w-3xl my-8 p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-1">{isEdit ? "Edit" : "New"} product</div>
            <h2 className="text-display text-2xl">{isEdit ? form.name : "Add a new product"}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name *"><input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></Field>
          <Field label="Slug"><input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(form.name)} className={inputCls} /></Field>
          <Field label="SKU *"><input value={form.sku} onChange={(e) => set("sku", e.target.value)} className={inputCls} /></Field>
          <Field label="Brand"><input value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls} /></Field>
          <Field label="Category">
            <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={inputCls}>
              <option value="">— none —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Energy rating"><input value={form.energy_rating} onChange={(e) => set("energy_rating", e.target.value)} placeholder="A+" className={inputCls} /></Field>
          <Field label="Price (PKR) *"><input type="number" value={form.price_pkr} onChange={(e) => set("price_pkr", e.target.value as any)} className={inputCls} /></Field>
          <Field label="Discounted price (PKR)"><input type="number" value={form.discount_price_pkr} onChange={(e) => set("discount_price_pkr", e.target.value as any)} className={inputCls} /></Field>
          <Field label="Stock"><input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value as any)} className={inputCls} /></Field>
          <Field label="Low-stock threshold"><input type="number" value={form.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value as any)} className={inputCls} /></Field>
          <Field label="Capacity (L)"><input type="number" value={form.capacity_liters} onChange={(e) => set("capacity_liters", e.target.value as any)} className={inputCls} /></Field>
          <Field label="Warranty (months)"><input type="number" value={form.warranty_months} onChange={(e) => set("warranty_months", e.target.value as any)} className={inputCls} /></Field>
        </div>

        <Field label="Short description" className="mt-4">
          <input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Full description" className="mt-4">
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className={inputCls} />
        </Field>

        <Field label="Cover image" className="mt-4">
          <div className="flex items-center gap-4">
            {form.cover_image_url ? (
              <img src={form.cover_image_url} alt="" className="h-20 w-20 rounded object-cover bg-steel/30" />
            ) : (
              <div className="h-20 w-20 rounded bg-steel/30 grid place-items-center text-muted-foreground text-xs">No image</div>
            )}
            <label className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-secondary">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload image"}
              <input type="file" accept="image/*" onChange={onFile} className="hidden" disabled={uploading} />
            </label>
            {form.cover_image_url && (
              <button onClick={() => set("cover_image_url", "")} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
            )}
          </div>
        </Field>

        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Specifications</div>
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Key (e.g. material)" value={s.k} onChange={(e) => setSpecs((arr) => arr.map((x, j) => j === i ? { ...x, k: e.target.value } : x))} className={inputCls + " flex-1"} />
                <input placeholder="Value" value={s.v} onChange={(e) => setSpecs((arr) => arr.map((x, j) => j === i ? { ...x, v: e.target.value } : x))} className={inputCls + " flex-1"} />
                <button onClick={() => setSpecs((arr) => arr.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
              </div>
            ))}
            <button onClick={() => setSpecs((arr) => [...arr, { k: "", v: "" }])} className="text-xs text-copper hover:underline">+ Add specification</button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured</label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}
