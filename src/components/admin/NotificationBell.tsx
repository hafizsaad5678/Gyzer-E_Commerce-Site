/**
 * NotificationBell — admin sidebar notification dropdown.
 * Shows unread contact messages and low-stock product alerts.
 * Polls every 30 seconds.
 * Extracted from _authenticated.admin.tsx.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function NotificationBell() {
 const [unread, setUnread] = useState<any[]>([]);
 const [lowStock, setLowStock] = useState<any[]>([]);
 const [open, setOpen] = useState(false);
 const ref = useRef<HTMLDivElement>(null);

 async function load() {
 const [{ data: msgs }, { data: stock }] = await Promise.all([
 supabase
 .from("contact_messages")
 .select("id,name,email,subject,message,created_at")
 .eq("is_read", false)
 .order("created_at", { ascending: false })
 .limit(8),
 supabase
 .from("products")
 .select("id,name,stock")
 .eq("is_active", true)
 .lt("stock", 5)
 .order("stock", { ascending: true })
 .limit(8),
 ]);
 setUnread(msgs ?? []);
 setLowStock(stock ?? []);
 }

 useEffect(() => {
 load();
 const interval = setInterval(load, 30_000);
 return () => clearInterval(interval);
 }, []);

 // Close on outside click
 useEffect(() => {
 function handleClick(e: MouseEvent) {
 if (ref.current && !ref.current.contains(e.target as Node)) {
 setOpen(false);
 }
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
 <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-lg border border-border bg-card shadow-2xl z-50 overflow-hidden text-foreground">
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
 <span className="text-sm font-semibold">Notifications ({count})</span>
 <button
 onClick={() => setOpen(false)}
 className="text-muted-foreground hover:text-foreground"
 >
 <X className="h-4 w-4" />
 </button>
 </div>

 {count === 0 ? (
 <div className="p-6 text-center text-sm text-muted-foreground">
 No new notifications
 </div>
 ) : (
 <div className="max-h-80 overflow-y-auto divide-y divide-border">
 {lowStock.map((p) => (
 <Link
 key={`stock-${p.id}`}
 to="/admin/products"
 onClick={() => setOpen(false)}
 className="block px-4 py-3 hover:bg-secondary/60 transition-colors"
 >
 <div className="text-sm font-medium text-destructive mb-0.5">Low Stock Alert</div>
 <div className="text-xs font-medium truncate">{p.name}</div>
 <p className="text-xs text-muted-foreground mt-0.5">
 Only {p.stock} remaining in stock
 </p>
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
 {new Date(m.created_at).toLocaleDateString("en-PK", {
 day: "2-digit",
 month: "short",
 })}
 </span>
 </div>
 {m.subject && (
 <div className="text-xs font-medium text-copper truncate">{m.subject}</div>
 )}
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
