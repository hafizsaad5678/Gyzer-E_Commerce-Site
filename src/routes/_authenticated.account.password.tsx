import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/password")({
  component: Password,
});

function Password() {
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pwd = String(f.get("password") ?? "");
    if (pwd.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    (e.target as HTMLFormElement).reset();
  }
  return (
    <form onSubmit={submit} className="surface-card p-6 md:p-8 max-w-md space-y-4">
      <h2 className="text-display text-2xl">Change password</h2>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">New password</label>
        <input name="password" type="password" minLength={8} required className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm" />
      </div>
      <button disabled={loading} className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">{loading ? "…" : "Update password"}</button>
    </form>
  );
}
