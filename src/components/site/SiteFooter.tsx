import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useSiteSettings } from "@/lib/settings";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SiteFooter() {
  const brand = useSiteSettings();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Please enter a valid email");
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim().toLowerCase() });
    setLoading(false);
    if (error && !error.message.includes("duplicate")) return toast.error("Could not subscribe");
    setEmail("");
    toast.success("You're on the list. Welcome!");
  }

  return (
    <footer className="mt-24 border-t border-border bg-sidebar text-sidebar-foreground">
      <div className="container-page py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2 space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="thermal-gradient grid h-9 w-9 place-items-center rounded-md text-primary-foreground font-display text-lg font-semibold">A</span>
            <span className="text-display text-xl">{brand.company_name}</span>
          </div>
          <p className="text-sm text-sidebar-foreground/70 max-w-md">
            {brand.tagline}. Reliable electric, gas, instant and solar geysers built for Pakistani homes — backed by warranty and nationwide service.
          </p>
          <form onSubmit={subscribe} className="flex max-w-md gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="flex-1 rounded-md bg-sidebar-accent px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-copper"
            />
            <button disabled={loading} className="rounded-md bg-copper px-4 py-2 text-sm font-medium text-copper-foreground hover:opacity-90 disabled:opacity-60">
              {loading ? "..." : "Subscribe"}
            </button>
          </form>
        </div>

        <div>
          <h4 className="font-display text-base mb-4">Shop</h4>
          <ul className="space-y-2.5 text-sm text-sidebar-foreground/70">
            <li><Link to="/shop" className="hover:text-copper">All Products</Link></li>
            <li><Link to="/categories" className="hover:text-copper">Categories</Link></li>
            <li><Link to="/warranty" className="hover:text-copper">Warranty</Link></li>
            <li><Link to="/shipping" className="hover:text-copper">Shipping</Link></li>
            <li><Link to="/returns" className="hover:text-copper">Returns</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm text-sidebar-foreground/70">
            <li><Link to="/about" className="hover:text-copper">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-copper">Contact</Link></li>
            <li><Link to="/faq" className="hover:text-copper">FAQ</Link></li>
            <li><Link to="/privacy" className="hover:text-copper">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-copper">Terms</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sidebar-border">
        <div className="container-page py-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between text-xs text-sidebar-foreground/60">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{brand.address}</span>
            <a href={`tel:${brand.phone}`} className="inline-flex items-center gap-1.5 hover:text-copper"><Phone className="h-3.5 w-3.5" />{brand.phone}</a>
            <a href={`mailto:${brand.email}`} className="inline-flex items-center gap-1.5 hover:text-copper"><Mail className="h-3.5 w-3.5" />{brand.email}</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Facebook" className="hover:text-copper"><Facebook className="h-4 w-4" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-copper"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="Youtube" className="hover:text-copper"><Youtube className="h-4 w-4" /></a>
            <span>© {new Date().getFullYear()} {brand.company_name}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
