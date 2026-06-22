import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { siteSettingsOpts } from "@/lib/settings";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(siteSettingsOpts);
  },
  component: AdminSettings,
});

function AdminSettings() {
  const { data: initialSettings } = useSuspenseQuery(siteSettingsOpts);
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialSettings);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("site_settings").update(form).eq("id", 1);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["site_settings"] });
    toast.success("Settings updated successfully");
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Configuration</div>
        <h1 className="text-display text-4xl">Site Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Company Name</span>
            <input 
              type="text" 
              required 
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.company_name} 
              onChange={e => setForm({ ...form, company_name: e.target.value })} 
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Phone Number</span>
            <input 
              type="text" 
              required 
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.phone} 
              onChange={e => setForm({ ...form, phone: e.target.value })} 
            />
          </label>
        </div>

        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Tagline</span>
          <input 
            type="text" 
            required 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.tagline} 
            onChange={e => setForm({ ...form, tagline: e.target.value })} 
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-5">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">WhatsApp Number</span>
            <input 
              type="text" 
              required 
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.whatsapp} 
              onChange={e => setForm({ ...form, whatsapp: e.target.value })} 
            />
            <span className="text-[10px] text-muted-foreground">Country code without + (e.g. 923001234567)</span>
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Email Address</span>
            <input 
              type="email" 
              required 
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.email} 
              onChange={e => setForm({ ...form, email: e.target.value })} 
            />
          </label>
        </div>

        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Address</span>
          <textarea 
            required 
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            value={form.address} 
            onChange={e => setForm({ ...form, address: e.target.value })} 
          />
        </label>

        <div className="pt-4 border-t border-border flex justify-end">
          <button 
            disabled={loading} 
            type="submit" 
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            {loading ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
