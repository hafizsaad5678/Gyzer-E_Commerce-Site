import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { catImg } from "@/lib/cat-images";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductEditor, type Category } from "@/components/admin/ProductEditor";
import { AdminToggle } from "@/components/admin/AdminToggle";
import { StockInput } from "@/components/admin/StockInput";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";

// ─── Queries ──────────────────────────────────────────────────────────────────

const adminProductsOpts = queryOptions({
 queryKey: ["admin-products"],
 queryFn: async () => {
 const { data, error } = await supabase
 .from("products")
 .select("*, categories(id,name,slug)")
 .order("created_at", { ascending: false });
 if (error) throw error;
 return data ?? [];
 },
});

const adminCategoryListOpts = queryOptions({
 queryKey: ["admin-category-list"],
 queryFn: async () => {
 const { data, error } = await supabase.from("categories").select("id,name,slug").order("name");
 if (error) throw error;
 return (data ?? []) as Category[];
 },
});

// ─── Route ────────────────────────────────────────────────────────────────────

type ProductSearch = { category?: string };

export const Route = createFileRoute("/_authenticated/admin/products")({
 component: AdminProducts,
 validateSearch: (search: Record<string, unknown>): ProductSearch => ({
 category: search.category as string | undefined,
 }),
 loader: async ({ context }) => {
 await Promise.all([
 context.queryClient.ensureQueryData(adminProductsOpts),
 context.queryClient.ensureQueryData(adminCategoryListOpts),
 ]);
 },
});

// ─── Component ────────────────────────────────────────────────────────────────

function AdminProducts() {
 const qc = useQueryClient();
 const search = Route.useSearch();

 const { data: products } = useSuspenseQuery(adminProductsOpts);
 const { data: categories } = useSuspenseQuery(adminCategoryListOpts);

 const [q, setQ] = useState("");
 const [categoryFilter, setCategoryFilter] = useState(search.category ?? "");
 const [editing, setEditing] = useState<any | null>(null);
 const [showNew, setShowNew] = useState(false);
 const [confirmId, setConfirmId] = useState<string | null>(null);

 const toggleMutation = useMutation({
 mutationFn: async ({
 id,
 field,
 value,
 }: {
 id: string;
 field: "is_active" | "is_featured";
 value: boolean;
 }) => {
 const { error } = await supabase
 .from("products")
 .update({ [field]: value } as any)
 .eq("id", id);
 if (error) throw error;
 },
 onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
 onError: () => toast.error("Could not update product"),
 });

 const stockMutation = useMutation({
 mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
 if (Number.isNaN(stock) || stock < 0) throw new Error("Invalid stock value");
 const { error } = await supabase.from("products").update({ stock }).eq("id", id);
 if (error) throw error;
 },
 onSuccess: () => {
 toast.success("Stock updated");
 qc.invalidateQueries({ queryKey: ["admin-products"] });
 },
 onError: (err: any) => toast.error(err.message),
 });

 const removeMutation = useMutation({
 mutationFn: async (id: string) => {
 const { error } = await supabase.from("products").delete().eq("id", id);
 if (error) throw error;
 },
 onSuccess: () => {
 toast.success("Product deleted");
 qc.invalidateQueries({ queryKey: ["admin-products"] });
 qc.invalidateQueries({ queryKey: ["products"] }); // bust public shop cache
 },
 onError: (err: any) => toast.error(err.message),
 });

 function handleRemove(id: string) {
 setConfirmId(id);
 }

 const filtered = products.filter(
 (p) =>
 (!q ||
 p.name.toLowerCase().includes(q.toLowerCase()) ||
 p.sku.toLowerCase().includes(q.toLowerCase())) &&
 (!categoryFilter || (p as any).categories?.slug === categoryFilter),
 );

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex justify-between items-end gap-4 flex-wrap">
 <div>
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Catalog
 </div>
 <h1 className="text-display text-4xl">Products</h1>
 </div>
 <div className="flex items-center gap-3">
 <div className="relative">
 <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
 <input
 value={q}
 onChange={(e) => setQ(e.target.value)}
 placeholder="Search…"
 className="rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm w-64"
 />
 </div>
 <select
 value={categoryFilter}
 onChange={(e) => setCategoryFilter(e.target.value)}
 className="rounded-md border border-input bg-background px-3 py-2 text-sm w-48"
 >
 <option value="">All Categories</option>
 {categories.map((c) => (
 <option key={c.id} value={c.slug}>
 {c.name}
 </option>
 ))}
 </select>
 <button
 onClick={() => setShowNew(true)}
 className="inline-flex items-center gap-1.5 rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-4 py-2 text-sm font-medium "
 >
 <Plus className="h-4 w-4" /> New product
 </button>
 </div>
 </div>

 {/* Products table */}
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
 const imgUrl = p.cover_image_url || catImg[(p as any).categories?.slug ?? ""];
 return (
 <tr key={p.id}>
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 {imgUrl ? (
 <img
 src={imgUrl}
 alt=""
 className="h-10 w-10 rounded object-cover bg-steel/30 shrink-0"
 />
 ) : (
 <div className="h-10 w-10 rounded bg-steel/30 shrink-0" />
 )}
 <div>
 <div className="font-medium">{p.name}</div>
 <div className="text-xs text-muted-foreground">
 {p.sku} · {p.brand}
 </div>
 </div>
 </div>
 </td>
 <td className="px-4 py-3 text-muted-foreground">
 {(p as any).categories?.name ?? "—"}
 </td>
 <td className="px-4 py-3 text-right">
 {formatPKR(p.discount_price_pkr ?? p.price_pkr)}
 </td>
 <td className="px-4 py-3 text-right">
 <StockInput
 product={p as any}
 onSave={(id, stock) => stockMutation.mutate({ id, stock })}
 />
 </td>
 <td className="px-4 py-3 text-center">
 <AdminToggle
 checked={p.is_active}
 onChange={(v) =>
 toggleMutation.mutate({ id: p.id, field: "is_active", value: v })
 }
 />
 </td>
 <td className="px-4 py-3 text-center">
 <AdminToggle
 checked={p.is_featured}
 onChange={(v) =>
 toggleMutation.mutate({ id: p.id, field: "is_featured", value: v })
 }
 />
 </td>
 <td className="px-4 py-3 text-right whitespace-nowrap">
 <button
 onClick={() => setEditing(p)}
 className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-3"
 >
 <Pencil className="h-3.5 w-3.5" /> Edit
 </button>
 <button
 onClick={() => handleRemove(p.id)}
 disabled={removeMutation.isPending}
 className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
 >
 <Trash2 className="h-3.5 w-3.5" /> Delete
 </button>
 </td>
 </tr>
 );
 })}
 {filtered.length === 0 && (
 <tr>
 <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
 No products found.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Create / Edit modal */}
 {(showNew || editing) && (
 <ProductEditor
 initial={editing}
 categories={categories}
 onClose={() => {
 setShowNew(false);
 setEditing(null);
 }}
 onSaved={() => {
 setShowNew(false);
 setEditing(null);
 qc.invalidateQueries({ queryKey: ["admin-products"] });
 qc.invalidateQueries({ queryKey: ["products"] }); // bust public shop cache
 }}
 />
 )}

 {/* Delete confirmation */}
 <ConfirmDialog
 open={!!confirmId}
 title="Delete product?"
 description="This cannot be undone. The product will be permanently removed from the catalog."
 confirmLabel="Delete"
 variant="destructive"
 onConfirm={() => {
 if (confirmId) removeMutation.mutate(confirmId);
 setConfirmId(null);
 }}
 onCancel={() => setConfirmId(null)}
 />
 </div>
 );
}
