import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const [cats, setCats] = useState<any[]>([]);
  async function load() {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCats(data ?? []);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Catalog</div>
        <h1 className="text-display text-4xl">Categories</h1>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {cats.map((c) => (
          <div key={c.id} className="surface-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">/{c.slug}</div>
            <div className="text-display text-xl mt-1">{c.name}</div>
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{c.description}</p>
            <div className="mt-3 text-xs"><span className={c.is_active ? "text-success" : "text-destructive"}>{c.is_active ? "Active" : "Hidden"}</span></div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Category editing UI coming in the next phase.</p>
    </div>
  );
}
