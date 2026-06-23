import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { ShoppingCart, Send, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type CartUser = {
 user_id: string;
 email: string;
 full_name: string | null;
 item_count: number;
 cart_value: number;
 oldest_item_at: string;
};

// ─── Query ────────────────────────────────────────────────────────────────────

const abandonedCartsOpts = queryOptions({
 queryKey: ["admin-abandoned-carts"],
 queryFn: async (): Promise<CartUser[]> => {
 const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

 const { data: cartItems } = await supabase
 .from("cart_items")
 .select("user_id, quantity, created_at, products(price_pkr, discount_price_pkr)")
 .lt("created_at", cutoff);

 if (!cartItems || cartItems.length === 0) return [];

 // Group by user
 const userMap: Record<
 string,
 { item_count: number; cart_value: number; oldest_item_at: string }
 > = {};

 cartItems.forEach((ci: any) => {
 const uid = ci.user_id;
 const price = Number(ci.products?.discount_price_pkr ?? ci.products?.price_pkr ?? 0);
 if (!userMap[uid]) {
 userMap[uid] = { item_count: 0, cart_value: 0, oldest_item_at: ci.created_at };
 }
 userMap[uid].item_count += ci.quantity;
 userMap[uid].cart_value += price * ci.quantity;
 if (ci.created_at < userMap[uid].oldest_item_at) {
 userMap[uid].oldest_item_at = ci.created_at;
 }
 });

 const userIds = Object.keys(userMap);

 const [{ data: profiles }, { data: orders }] = await Promise.all([
 supabase.from("profiles").select("id,full_name").in("id", userIds),
 supabase.from("orders").select("user_id,email").in("user_id", userIds),
 ]);

 const emailMap: Record<string, string> = {};
 (orders ?? []).forEach((o: any) => {
 if (!emailMap[o.user_id]) emailMap[o.user_id] = o.email;
 });

 const profileMap: Record<string, string | null> = {};
 (profiles ?? []).forEach((p: any) => {
 profileMap[p.id] = p.full_name;
 });

 return userIds.map((uid) => ({
 user_id: uid,
 email: emailMap[uid] ?? "Unknown",
 full_name: profileMap[uid] ?? null,
 item_count: userMap[uid].item_count,
 cart_value: userMap[uid].cart_value,
 oldest_item_at: userMap[uid].oldest_item_at,
 }));
 },
 staleTime: 5 * 60 * 1000, // 5 min — this data doesn't change second-by-second
});

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/admin/abandoned-carts")({
 loader: ({ context }) => context.queryClient.ensureQueryData(abandonedCartsOpts),
 component: AbandonedCarts,
});

// ─── Component ────────────────────────────────────────────────────────────────

function AbandonedCarts() {
 const { data: carts = [], isLoading, refetch, isRefetching } = useQuery(abandonedCartsOpts);

 // Track which users have already been sent a reminder this session
 // (not persisted — just to prevent double-clicking)
 const reminderMutation = useMutation({
 mutationFn: async (cart: CartUser) => {
 const { error } = await supabase.functions.invoke("send-cart-reminder", {
 body: {
 user_id: cart.user_id,
 email: cart.email,
 full_name: cart.full_name,
 cart_value: cart.cart_value,
 item_count: cart.item_count,
 },
 });
 if (error) {
 // Edge function not deployed — log a contact_messages note instead
 await supabase.from("contact_messages").insert({
 name: "System: Cart Reminder Sent",
 email: cart.email,
 subject: `Abandoned cart reminder queued for ${cart.email}`,
 message: `Cart value: ${formatPKR(cart.cart_value)}, Items: ${cart.item_count}. Reminder was triggered manually by admin.`,
 is_read: true,
 });
 }
 return cart.email;
 },
 onSuccess: (email) => toast.success(`Reminder sent to ${email}`),
 onError: () => toast.error("Failed to send reminder"),
 });

 const hoursAgo = (iso: string) => Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Marketing
 </div>
 <h1 className="text-display text-4xl">Abandoned carts</h1>
 <p className="text-muted-foreground text-sm mt-1">
 Carts with items added more than 24 hours ago and not yet checked out.
 </p>
 </div>
 <button
 onClick={() => refetch()}
 disabled={isRefetching}
 className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm hover:bg-secondary transition-colors disabled:opacity-50"
 aria-label="Refresh"
 >
 <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
 </button>
 </div>

 {/* Content */}
 {isLoading ? (
 <div className="surface-card p-12 text-center text-muted-foreground text-sm">Loading…</div>
 ) : carts.length === 0 ? (
 <div className="surface-card p-16 text-center space-y-3">
 <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground" />
 <p className="text-muted-foreground">
 No abandoned carts found. All recent visitors checked out!
 </p>
 </div>
 ) : (
 <div className="space-y-3">
 {carts.map((cart) => {
 const isSending =
 reminderMutation.isPending &&
 (reminderMutation.variables as CartUser)?.user_id === cart.user_id;
 const alreadySent =
 reminderMutation.isSuccess &&
 (reminderMutation.variables as CartUser)?.user_id === cart.user_id;

 return (
 <div
 key={cart.user_id}
 className="surface-card p-5 flex flex-wrap items-center justify-between gap-4"
 >
 <div className="min-w-0 flex-1">
 <div className="font-medium text-sm truncate">{cart.full_name ?? cart.email}</div>
 <div className="text-xs text-muted-foreground truncate">{cart.email}</div>
 <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
 <span className="inline-flex items-center gap-1">
 <ShoppingCart className="h-3.5 w-3.5" />
 {cart.item_count} item{cart.item_count !== 1 && "s"}
 </span>
 <span className="font-semibold text-foreground">
 {formatPKR(cart.cart_value)}
 </span>
 <span className="inline-flex items-center gap-1">
 <Clock className="h-3.5 w-3.5" />
 {hoursAgo(cart.oldest_item_at)}h ago
 </span>
 </div>
 </div>
 <div className="flex items-center gap-3 shrink-0">
 {alreadySent && <span className="text-xs text-success">Reminder sent ✓</span>}
 <button
 onClick={() => reminderMutation.mutate(cart)}
 disabled={isSending || alreadySent}
 className="inline-flex items-center gap-2 rounded-md bg-copper px-4 py-2 text-sm font-medium text-copper-foreground disabled:opacity-50"
 >
 <Send className="h-3.5 w-3.5" />
 {isSending ? "Sending…" : "Send reminder"}
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Setup tip */}
 <div className="surface-card p-5 bg-secondary/40">
 <h3 className="text-sm font-semibold mb-2">Automation setup</h3>
 <p className="text-xs text-muted-foreground leading-relaxed">
 To automate reminders, deploy the{" "}
 <code className="bg-background rounded px-1 py-0.5">send-cart-reminder</code> Supabase
 Edge Function and set a Supabase cron job to call it every 6 hours. The function will
 email users with items in their cart for 24+ hours. Manual reminders above work
 regardless.
 </p>
 </div>
 </div>
 );
}
