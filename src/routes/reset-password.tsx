import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
 head: () => ({
 meta: [{ title: "Reset password — Asif Brothers" }, { name: "robots", content: "noindex" }],
 }),
 component: ResetPassword,
});

function ResetPassword() {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [ready, setReady] = useState(false);

 useEffect(() => {
 // Supabase auto-handles recovery token in URL hash
 const { data: sub } = supabase.auth.onAuthStateChange((event) => {
 if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
 });
 supabase.auth.getSession().then(({ data }) => {
 if (data.session) setReady(true);
 });
 return () => sub.subscription.unsubscribe();
 }, []);

 async function submit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();
 const f = new FormData(e.currentTarget);
 const pwd = String(f.get("password") ?? "");
 if (pwd.length < 8) return toast.error("Password must be at least 8 characters");
 setLoading(true);
 const { error } = await supabase.auth.updateUser({ password: pwd });
 setLoading(false);
 if (error) return toast.error(error.message);
 toast.success("Password updated.");
 navigate({ to: "/account" });
 }

 return (
 <SiteLayout>
 <section className="container-page py-20 max-w-md">
 <h1 className="text-display text-3xl mb-2">Set a new password</h1>
 <p className="text-muted-foreground text-sm mb-8">
 {ready ? "Choose a new password for your account." : "Verifying reset link..."}
 </p>
 {ready && (
 <form onSubmit={submit} className="surface-card p-6 space-y-4">
 <div>
 <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
 New password
 </label>
 <input
 name="password"
 type="password"
 minLength={8}
 required
 className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
 />
 </div>
 <button
 disabled={loading}
 className="w-full rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-5 py-3 text-sm font-medium disabled:opacity-60"
 >
 {loading ? "..." : "Update password"}
 </button>
 </form>
 )}
 </section>
 </SiteLayout>
 );
}
