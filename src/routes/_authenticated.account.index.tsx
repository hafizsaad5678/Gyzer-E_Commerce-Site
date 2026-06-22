import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const profileOpts = queryOptions({
  queryKey: ["account-profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const email = u.user?.email ?? "";
    const { data } = await supabase.from("profiles").select("*").eq("id", u.user!.id).maybeSingle();
    return { email, profile: data ?? { full_name: "", phone: "" } };
  },
});

export const Route = createFileRoute("/_authenticated/account/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(profileOpts),
  component: Profile,
});

function Profile() {
  const { data } = useSuspenseQuery(profileOpts);
  const { email, profile } = data;
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").upsert({
      id: u.user!.id,
      full_name: String(f.get("full_name") ?? "").trim(),
      phone: String(f.get("phone") ?? "").trim(),
    });
    setLoading(false);
    if (error) return toast.error("Could not save");
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["account-profile"] });
  }

  return (
    <div className="surface-card p-6 md:p-8 max-w-xl">
      <h2 className="text-display text-2xl mb-1">Your profile</h2>
      <p className="text-sm text-muted-foreground mb-6">Keep this up to date so we can reach you about your orders.</p>
      <form onSubmit={save} className="space-y-4">
        <Field label="Full name" name="full_name" defaultValue={profile.full_name ?? ""} />
        <Field label="Phone" name="phone" defaultValue={profile.phone ?? ""} placeholder="+92 300 0000000" />
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</label>
          <input value={email} readOnly className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2.5 text-sm text-muted-foreground" />
        </div>
        <button disabled={loading} className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">{loading ? "Saving…" : "Save changes"}</button>
      </form>
    </div>
  );
}

function Field(props: { label: string; name: string; defaultValue?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">{props.label}</label>
      <input name={props.name} defaultValue={props.defaultValue} placeholder={props.placeholder} className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm" />
    </div>
  );
}
