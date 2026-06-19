import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, ExternalLink, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function AdminCategories() {
  const [cats, setCats] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("categories")
      .select("*, products(count)")
      .order("sort_order");
    
    if (error) {
      toast.error("Failed to load categories");
      return;
    }
    setCats(data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: string, is_active: boolean) {
    await supabase.from("categories").update({ is_active }).eq("id", id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this category? Any products assigned to it will lose their category.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Catalog</div>
          <h1 className="text-display text-4xl">Categories</h1>
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {cats.map((c) => {
          const productCount = c.products?.[0]?.count ?? 0;
          return (
            <div key={c.id} className="surface-card p-5 flex flex-col transition hover:shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">/{c.slug}</div>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${c.is_active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {c.is_active ? "Active" : "Hidden"}
                  </span>
                  <Link to="/admin/products" search={{ category: c.slug }} className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-secondary text-foreground border border-border hover:bg-copper hover:text-white transition">
                    {productCount} product{productCount !== 1 ? 's' : ''}
                  </Link>
                </div>
              </div>
              <div className="text-display text-2xl mt-1">{c.name}</div>
              <p className="text-sm text-muted-foreground mt-2 mb-6 line-clamp-2 flex-1">{c.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditing(c)} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => remove(c.id)} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
                <Link to="/categories/$slug" params={{ slug: c.slug }} target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-copper hover:underline">
                  View on site <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {(showNew || editing) && (
        <CategoryEditor
          initial={editing}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onSaved={() => { setShowNew(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function CategoryEditor({
  initial, onClose, onSaved,
}: { initial: any | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name) return toast.error("Category name is required");
    setSaving(true);
    
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    const { error } = isEdit
      ? await supabase.from("categories").update(payload).eq("id", initial!.id)
      : await supabase.from("categories").insert(payload);
    
    setSaving(false);
    
    if (error) {
      if (error.message.includes("unique")) return toast.error("A category with this slug already exists.");
      return toast.error(error.message);
    }
    
    toast.success(isEdit ? "Category updated" : "Category created");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="surface-card w-full max-w-xl p-6 md:p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-1">{isEdit ? "Edit" : "New"} category</div>
            <h2 className="text-display text-2xl">{isEdit ? form.name : "Add a category"}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <Field label="Name *">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="e.g. Solar Geysers" />
          </Field>
          
          <Field label="URL Slug">
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(form.name)} className={inputCls} />
          </Field>
          
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls} placeholder="Short description of this category..." />
          </Field>
          
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sort Order">
              <input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value as any)} className={inputCls} />
            </Field>
            <div className="flex items-center gap-2 mt-7">
              <input type="checkbox" id="active-cb" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4" />
              <label htmlFor="active-cb" className="text-sm font-medium">Active (Visible)</label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create category"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}
