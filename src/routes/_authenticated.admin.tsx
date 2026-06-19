import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, ShoppingCart, Users, FolderTree, MessageSquare, ArrowLeft, Bell, X } from "lucide-react";
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
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="thermal-gradient grid h-8 w-8 place-items-center rounded-md text-primary-foreground font-display text-base font-semibold">A</span>
            <span className="text-display text-base">Admin</span>
          </Link>
          <NotificationBell />
        </div>
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

function NotificationBell() {
  const [unread, setUnread] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const { data: msgs } = await supabase
      .from("contact_messages")
      .select("id,name,email,subject,message,created_at")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(8);
      
    const { data: stock } = await supabase
      .from("products")
      .select("id,name,stock")
      .eq("is_active", true)
      .lt("stock", 5)
      .order("stock", { ascending: true })
      .limit(8);

    setUnread(msgs ?? []);
    setLowStock(stock ?? []);
  }

  useEffect(() => {
    load();
    // Poll every 30s for new messages
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const count = unread.length + lowStock.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative grid h-9 w-9 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-copper text-[10px] font-bold text-white px-1 animate-pulse">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 lg:left-auto lg:right-0 top-full mt-2 w-80 sm:w-96 rounded-lg border border-border bg-card shadow-2xl z-50 overflow-hidden text-foreground">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
            <span className="text-sm font-semibold">Notifications ({count})</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {count === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No new notifications</div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {lowStock.map((p) => (
                <Link
                  key={`stock-${p.id}`}
                  to="/admin/products"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-secondary/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium truncate text-destructive">Low Stock Alert</span>
                  </div>
                  <div className="text-xs font-medium truncate">{p.name}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">Only {p.stock} remaining in stock</p>
                </Link>
              ))}
              {unread.map((m) => (
                <Link
                  key={`msg-${m.id}`}
                  to="/admin/messages"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-secondary/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium truncate">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString("en-PK", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  {m.subject && <div className="text-xs font-medium text-copper truncate">{m.subject}</div>}
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{m.message}</p>
                </Link>
              ))}
            </div>
          )}

          <Link
            to="/admin/messages"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-xs font-medium text-copper hover:bg-secondary/60 border-t border-border"
          >
            View all messages →
          </Link>
        </div>
      )}
    </div>
  );
}
