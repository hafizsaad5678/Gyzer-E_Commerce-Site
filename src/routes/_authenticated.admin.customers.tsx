import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const [profiles, setProfiles] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("id,full_name,phone,created_at").order("created_at", { ascending: false });
      setProfiles(data ?? []);
    })();
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">People</div>
        <h1 className="text-display text-4xl">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">{profiles.length} registered customers</p>
      </div>
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Phone</th><th className="text-left px-4 py-3">Joined</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("en-PK")}</td>
                </tr>
              ))}
              {profiles.length === 0 && <tr><td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">No customers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
