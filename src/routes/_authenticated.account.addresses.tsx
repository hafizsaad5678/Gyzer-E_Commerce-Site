import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/addresses")({
  component: Addresses,
});

function Addresses() {
  const [list, setList] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await supabase.from("addresses").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("addresses").insert({
      user_id: u.user!.id,
      label: String(f.get("label") ?? ""),
      full_name: String(f.get("full_name") ?? ""),
      phone: String(f.get("phone") ?? ""),
      line1: String(f.get("line1") ?? ""),
      line2: String(f.get("line2") ?? "") || null,
      city: String(f.get("city") ?? ""),
      province: String(f.get("province") ?? ""),
      postal_code: String(f.get("postal_code") ?? "") || null,
      country: "Pakistan",
    });
    setLoading(false);
    if (error) return toast.error("Could not save address");
    toast.success("Address added");
    (e.target as HTMLFormElement).reset();
    setAdding(false);
    load();
  }

  async function remove(id: string) {
    await supabase.from("addresses").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-display text-2xl">Saved addresses</h2>
        <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Add</button>
      </div>

      {adding && (
        <form onSubmit={add} className="surface-card p-6 grid sm:grid-cols-2 gap-3">
          <F label="Label" name="label" placeholder="Home / Office" />
          <F label="Full name" name="full_name" required />
          <F label="Phone" name="phone" required />
          <F label="City" name="city" required />
          <F label="Address line 1" name="line1" required className="sm:col-span-2" />
          <F label="Address line 2" name="line2" className="sm:col-span-2" />
          <F label="Province" name="province" required />
          <F label="Postal code" name="postal_code" />
          <div className="sm:col-span-2 flex gap-2 pt-2">
            <button disabled={loading} className="rounded-md bg-copper px-4 py-2 text-sm font-medium text-copper-foreground">{loading ? "Saving…" : "Save address"}</button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-md border border-input px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {list.length === 0 && !adding ? (
        <div className="surface-card p-12 text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-3" />No addresses saved yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((a) => (
            <div key={a.id} className="surface-card p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs uppercase tracking-wider text-copper font-semibold">{a.label ?? "Address"}</div>
                <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="font-medium">{a.full_name}</div>
              <div className="text-sm text-muted-foreground mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</div>
              <div className="text-sm text-muted-foreground">{a.city}, {a.province}{a.postal_code ? ` ${a.postal_code}` : ""}</div>
              <div className="text-sm text-muted-foreground mt-1">{a.phone}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function F({ label, name, required, placeholder, className = "" }: { label: string; name: string; required?: boolean; placeholder?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}{required && <span className="text-copper"> *</span>}</label>
      <input name={name} required={required} placeholder={placeholder} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
    </div>
  );
}
