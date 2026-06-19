import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, ShoppingCart, Users, FolderTree, MessageSquare, ArrowLeft } from "lucide-react";
import { Toaster } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
];

function AdminLayout() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return navigate({ to: "/auth" });
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      setAllowed(!!data);
    })();
  }, []);

  if (allowed === null) return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">Checking access…</div>;
  if (!allowed) {
    return (
      <div className="min-h-screen grid place-items-center px-4 text-center">
        <div>
          <h1 className="text-display text-3xl mb-3">Admin access required</h1>
          <p className="text-muted-foreground mb-6 max-w-md">Your account doesn't have admin permissions. Contact a site owner to grant access.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"><ArrowLeft className="h-4 w-4" /> Back to site</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[240px_1fr] bg-background">
      <aside className="bg-sidebar text-sidebar-foreground lg:min-h-screen p-5 lg:sticky lg:top-0 lg:self-start">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <span className="thermal-gradient grid h-8 w-8 place-items-center rounded-md text-primary-foreground font-display text-base font-semibold">A</span>
          <span className="text-display text-base">Admin</span>
        </Link>
        <nav className="space-y-0.5">
          {nav.map((n) => (
            <Link key={n.to} to={n.to as any} activeOptions={{ exact: n.exact }} className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground font-medium" }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <Link to="/" className="mt-8 flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-copper"><ArrowLeft className="h-3.5 w-3.5" /> Back to site</Link>
      </aside>
      <main className="p-6 md:p-10"><Outlet /></main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
