import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";

type Hit = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price_pkr: number;
  discount_price_pkr: number | null;
  cover_image_url: string | null;
};

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setQ("");
      setResults([]);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id,slug,name,brand,price_pkr,discount_price_pkr,cover_image_url")
        .eq("is_active", true)
        .ilike("name", `%${q.trim()}%`)
        .limit(8);
      setResults(data ?? []);
      setLoading(false);
    }, 280);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search geysers, brands, models…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
          ) : q ? (
            <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground" aria-label="Clear">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="divide-y divide-border max-h-[52vh] overflow-y-auto">
            {results.map((p) => {
              const price = p.discount_price_pkr ?? p.price_pkr;
              return (
                <li key={p.id}>
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors"
                  >
                    <div className="h-11 w-11 rounded-md bg-steel/40 overflow-hidden shrink-0">
                      {p.cover_image_url ? (
                        <img src={p.cover_image_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-[9px] text-muted-foreground">No img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      {p.brand && <div className="text-xs text-muted-foreground">{p.brand}</div>}
                    </div>
                    <div className="text-sm font-semibold text-foreground shrink-0">{formatPKR(price)}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* No results */}
        {!loading && q.trim() && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No products found for &ldquo;{q}&rdquo;
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press <kbd className="mx-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to close</span>
          {q.trim() && (
            <Link
              to="/shop"
              search={{ q }}
              onClick={onClose}
              className="inline-flex items-center gap-1 text-copper hover:underline"
            >
              See all results <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
