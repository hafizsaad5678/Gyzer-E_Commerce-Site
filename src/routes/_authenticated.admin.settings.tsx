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

 // Phone: strip formatting chars, must be 9–11 digits
 const phoneDigits = form.phone.replace(/[\s\+\-\(\)]/g, "");
 if (!/^\d{9,11}$/.test(phoneDigits)) {
 toast.error("Phone number must be 9–11 digits");
 return;
 }

 // WhatsApp: digits only, 10–13 chars (country code included)
 if (!/^\d{10,13}$/.test(form.whatsapp)) {
 toast.error("WhatsApp number must be digits only with country code (e.g. 923001234567)");
 return;
 }

 // Email: must contain @
 if (!form.email.includes("@")) {
 toast.error("Please enter a valid email address");
 return;
 }

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
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Configuration
 </div>
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
 onChange={(e) => setForm({ ...form, company_name: e.target.value })}
 />
 </label>
 <label className="block">
 <span className="block text-sm font-medium mb-1.5">Phone Number</span>
 <input
 type="text"
 required
 inputMode="numeric"
 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
 value={form.phone}
 onChange={(e) => {
 const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
 setForm({ ...form, phone: digits });
 }}
 placeholder="03001234567"
 />
 <span className="text-[10px] text-muted-foreground">
 Digits only, 9–11 digits (e.g. 03001234567)
 </span>
 </label>
 </div>

 <label className="block">
 <span className="block text-sm font-medium mb-1.5">Tagline</span>
 <input
 type="text"
 required
 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
 value={form.tagline}
 onChange={(e) => setForm({ ...form, tagline: e.target.value })}
 />
 </label>

 <div className="grid sm:grid-cols-2 gap-5">
 <label className="block">
 <span className="block text-sm font-medium mb-1.5">WhatsApp Number</span>
 <input
 type="text"
 required
 inputMode="numeric"
 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
 value={form.whatsapp}
 onChange={(e) => {
 const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
 setForm({ ...form, whatsapp: digits });
 }}
 />
 <span className="text-[10px] text-muted-foreground">
 Country code without + (e.g. 923001234567)
 </span>
 </label>
 <label className="block">
 <span className="block text-sm font-medium mb-1.5">Email Address</span>
 <input
 type="email"
 required
 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
 value={form.email}
 onChange={(e) => setForm({ ...form, email: e.target.value })}
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
 onChange={(e) => setForm({ ...form, address: e.target.value })}
 />
 </label>

 <div className="pt-4 border-t border-border flex justify-end">
 <button
 disabled={loading}
 type="submit"
 className="rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-5 py-2.5 text-sm font-medium transition"
 >
 {loading ? "Saving..." : "Save settings"}
 </button>
 </div>
 </form>

 {/* Shipping zones instructions */}
 <div className="mt-8 surface-card p-6 space-y-4">
 <div className="text-xs uppercase tracking-wider text-copper font-semibold">How it works</div>
 <h2 className="text-display text-xl">Shipping Zone Pricing</h2>
 <p className="text-sm text-muted-foreground leading-relaxed">
 Shipping fees are calculated per product based on the customer's delivery address. Each product
 can have up to 4 zone tiers. The <strong>highest fee</strong> across all cart items applies.
 </p>

 <div className="overflow-x-auto">
 <table className="w-full text-sm border-collapse">
 <thead>
 <tr className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
 <th className="text-left px-4 py-2.5 border border-border">Zone</th>
 <th className="text-left px-4 py-2.5 border border-border">Condition</th>
 <th className="text-left px-4 py-2.5 border border-border">Example</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 <tr>
 <td className="px-4 py-2.5 border border-border font-medium text-copper">city</td>
 <td className="px-4 py-2.5 border border-border">Customer city = <code className="bg-secondary rounded px-1">Gujranwala</code></td>
 <td className="px-4 py-2.5 border border-border text-muted-foreground">Set to 0 for free local delivery</td>
 </tr>
 <tr>
 <td className="px-4 py-2.5 border border-border font-medium text-copper">province</td>
 <td className="px-4 py-2.5 border border-border">Customer province = <code className="bg-secondary rounded px-1">Punjab</code></td>
 <td className="px-4 py-2.5 border border-border text-muted-foreground">e.g. Rs 500 within Punjab</td>
 </tr>
 <tr>
 <td className="px-4 py-2.5 border border-border font-medium text-copper">country</td>
 <td className="px-4 py-2.5 border border-border">Customer country = <code className="bg-secondary rounded px-1">Pakistan</code></td>
 <td className="px-4 py-2.5 border border-border text-muted-foreground">e.g. Rs 1,200 nationwide</td>
 </tr>
 <tr>
 <td className="px-4 py-2.5 border border-border font-medium text-copper">international</td>
 <td className="px-4 py-2.5 border border-border">Any other country</td>
 <td className="px-4 py-2.5 border border-border text-muted-foreground">e.g. Rs 5,000 international</td>
 </tr>
 </tbody>
 </table>
 </div>

 <div className="bg-secondary/50 rounded-md p-4 space-y-2">
 <p className="text-xs font-semibold text-foreground">Fallback (if no zones set on any product)</p>
 <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
 <li>Order subtotal &gt; Rs 20,000 → <strong>Rs 800</strong></li>
 <li>Order subtotal ≤ Rs 20,000 → <strong>Rs 1,200</strong></li>
 <li>Same city (Gujranwala) → <strong>Free</strong></li>
 </ul>
 </div>

 <p className="text-xs text-muted-foreground">
 To set per-product shipping rates, go to{" "}
 <a href="/admin/products" className="text-copper underline">Products</a> and edit a product's
 Shipping Zones section. Leave a zone blank to use the fallback rate for that zone.
 </p>
 </div>
 </div>
 );
}
