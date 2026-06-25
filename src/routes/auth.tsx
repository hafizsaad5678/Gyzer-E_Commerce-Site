import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

const searchSchema = z.object({
 redirect: z.string().optional(),
 mode: z.enum(["signin", "signup", "forgot"]).optional(),
});

export const Route = createFileRoute("/auth")({
 validateSearch: searchSchema,
 head: () => ({
 meta: [{ title: "Sign in Asif Brothers" }, { name: "robots", content: "noindex" }],
 }),
 component: AuthPage,
});

function AuthPage() {
 const search = useSearch({ from: "/auth" });
 const navigate = useNavigate();
 const qc = useQueryClient();
 const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signin");
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 supabase.auth.getSession().then(({ data }) => {
 if (data.session) navigate({ to: search.redirect ?? "/account" });
 });
 }, [navigate, search.redirect]);

 async function handle(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();
 const f = new FormData(e.currentTarget);
 const email = String(f.get("email") ?? "").trim();
 const password = String(f.get("password") ?? "");
 const fullName = String(f.get("full_name") ?? "").trim();
 setLoading(true);
 try {
 if (mode === "signin") {
 const { error } = await supabase.auth.signInWithPassword({ email, password });
 if (error) throw error;
 qc.clear(); // Clear cache to prevent showing previous user's data
 toast.success("Welcome back!");
 navigate({ to: search.redirect ?? "/account" });
 } else if (mode === "signup") {
 if (password.length < 8) throw new Error("Password must be at least 8 characters");
 const { data, error } = await supabase.auth.signUp({
 email,
 password,
 options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
 });
 if (error) throw error;

 if (!data.session) {
 toast.success("Account created! Please check your email to verify before signing in.");
 setMode("signin");
 } else {
 toast.success("Account created you're signed in!");
 navigate({ to: search.redirect ?? "/account" });
 }
 } else {
 const { error } = await supabase.auth.resetPasswordForEmail(email, {
 redirectTo: window.location.origin + "/reset-password",
 });
 if (error) throw error;
 toast.success("Check your email for a reset link.");
 setMode("signin");
 }
 } catch (err: any) {
 toast.error(err.message ?? "Authentication failed");
 } finally {
 setLoading(false);
 }
 }

 return (
 <SiteLayout>
 <section className="container-page py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center max-w-5xl">
 <div className="hidden lg:block">
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Account
 </div>
 <h1 className="text-display text-4xl mb-4">
 {mode === "signup"
 ? "Create your account"
 : mode === "forgot"
 ? "Reset your password"
 : "Welcome back"}
 </h1>
 <p className="text-muted-foreground max-w-md">
 Track orders, save addresses, and manage warranty claims from one place.
 </p>
 </div>

 <div className="surface-card p-7 md:p-9">
 <div className="flex gap-1 p-1 bg-secondary rounded-md mb-6">
 <button
 onClick={() => setMode("signin")}
 className={`flex-1 py-2 text-sm font-medium rounded ${mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
 >
 Sign in
 </button>
 <button
 onClick={() => setMode("signup")}
 className={`flex-1 py-2 text-sm font-medium rounded ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
 >
 Create account
 </button>
 </div>

 <form onSubmit={handle} className="space-y-4">
 {mode === "signup" && (
 <div>
 <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
 Full name
 </label>
 <input
 name="full_name"
 required
 className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
 />
 </div>
 )}
 <div>
 <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
 Email
 </label>
 <input
 name="email"
 type="email"
 required
 className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
 />
 </div>
 {mode !== "forgot" && (
 <div>
 <div className="flex justify-between mb-1.5">
 <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
 Password
 </label>
 {mode === "signin" && (
 <button
 type="button"
 onClick={() => setMode("forgot")}
 className="text-xs text-copper hover:underline"
 >
 Forgot?
 </button>
 )}
 </div>
 <input
 name="password"
 type="password"
 required
 minLength={8}
 className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
 />
 {mode === "signup" && (
 <p className="text-xs text-muted-foreground mt-1.5">At least 8 characters.</p>
 )}
 </div>
 )}
 <button
 disabled={loading}
 className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-5 py-3 text-sm font-medium disabled:opacity-60"
 >
 {loading
 ? "..."
 : mode === "signin"
 ? "Sign in"
 : mode === "signup"
 ? "Create account"
 : "Send reset link"}
 {!loading && <ArrowRight className="h-4 w-4" />}
 </button>
 </form>

 <p className="mt-6 text-xs text-center text-muted-foreground">
 By continuing you agree to our{" "}
 <Link to="/terms" className="underline">
 Terms
 </Link>{" "}
 and{" "}
 <Link to="/privacy" className="underline">
 Privacy Policy
 </Link>
 .
 </p>
 </div>
 </section>
 </SiteLayout>
 );
}
