import { Link } from "@tanstack/react-router";
import { ShoppingCart, Heart, User, Menu, X, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { SearchModal } from "./SearchModal";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setUserName(data.session?.user?.user_metadata?.full_name?.split(" ")[0] ?? "Account");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSignedIn(!!s);
      setUserName(s?.user?.user_metadata?.full_name?.split(" ")[0] ?? "Account");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Cmd/Ctrl+K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="thermal-gradient grid h-9 w-9 place-items-center rounded-md text-primary-foreground font-display text-lg font-semibold">A</span>
          <span className="text-display text-lg leading-none">{BRAND.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 ml-6">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:border-copper hover:text-foreground transition-colors"
            aria-label="Search products"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search…</span>
            <kbd className="hidden lg:inline rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <Link to="/account/wishlist" className="hidden md:grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Wishlist">
            <Heart className="h-4 w-4" />
          </Link>
          <Link to="/cart" className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Cart">
            <ShoppingCart className="h-4 w-4" />
          </Link>
          <Link
            to={signedIn ? "/account" : "/auth"}
            className="hidden md:inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            <User className="h-4 w-4" />
            {signedIn ? (userName ?? "Account") : "Sign in"}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container-page py-3 flex flex-col gap-1">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="px-2 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-md">
                {n.label}
              </Link>
            ))}
            <Link to={signedIn ? "/account" : "/auth"} onClick={() => setOpen(false)} className="px-2 py-2.5 text-sm font-medium text-copper">
              {signedIn ? "My account" : "Sign in"}
            </Link>
          </nav>
        </div>
      )}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
