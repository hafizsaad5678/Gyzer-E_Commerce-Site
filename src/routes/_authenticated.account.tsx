import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { User, Package, MapPin, Heart, Lock, LogOut, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
 component: AccountLayout,
});

const nav = [
 { to: "/account", label: "Profile", icon: User, exact: true },
 { to: "/account/orders", label: "Orders", icon: Package },
 { to: "/account/addresses", label: "Addresses", icon: MapPin },
 { to: "/account/wishlist", label: "Wishlist", icon: Heart },
 { to: "/account/password", label: "Password", icon: Lock },
];

function AccountLayout() {
 const navigate = useNavigate();
 const qc = useQueryClient();
 const [isAdmin, setIsAdmin] = useState(false);

 useEffect(() => {
 (async () => {
 const { data: u } = await supabase.auth.getUser();
 if (!u.user) return;
 const { data } = await supabase
 .from("user_roles")
 .select("role")
 .eq("user_id", u.user.id)
 .eq("role", "admin")
 .maybeSingle();
 setIsAdmin(!!data);
 })();
 }, []);

 async function signOut() {
 await supabase.auth.signOut();
 qc.clear();
 toast.success("Signed out");
 navigate({ to: "/" });
 }

 return (
 <SiteLayout>
 <section className="container-page py-12 md:py-16">
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 My account
 </div>
 <h1 className="text-display text-4xl mb-10">Welcome back</h1>
 <div className="grid lg:grid-cols-[240px_1fr] gap-8">
 <aside className="surface-card p-3 h-fit lg:sticky lg:top-20">
 <nav className="space-y-0.5">
 {nav.map((n) => (
 <Link
 key={n.to}
 to={n.to as any}
 activeOptions={{ exact: n.exact }}
 className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
 activeProps={{ className: "bg-secondary text-foreground font-medium" }}
 >
 <n.icon className="h-4 w-4" /> {n.label}
 </Link>
 ))}

 {isAdmin && (
 <div className="pt-2 mt-2 border-t border-border">
 <Link
 to="/admin"
 className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-md text-copper hover:bg-copper/10 font-medium"
 >
 <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
 </Link>
 </div>
 )}

 <button
 onClick={signOut}
 className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
 >
 <LogOut className="h-4 w-4" /> Sign out
 </button>
 </nav>
 </aside>
 <div>
 <Outlet />
 </div>
 </div>
 </section>
 </SiteLayout>
 );
}
