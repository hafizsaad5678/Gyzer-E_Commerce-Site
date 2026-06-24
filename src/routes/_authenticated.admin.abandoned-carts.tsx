import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/format";
import { ShoppingCart, Send, RefreshCw, Clock, Filter } from "lucide-react";
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

type AgeFilter = "all" | "1h" | "24h" | "48h";

// ─── Query ────────────────────────────────────────────────────────────────────

const abandonedCartsOpts = queryOptions({
  queryKey: ["admin-abandoned-carts"],
  queryFn: async (): Promise<CartUser[]> => {
    // Fetch ALL cart items regardless of age
    const { data: cartItems, error } = await supabase
      .from("cart_items")
      .select("user_id, quantity, created_at, products(price_pkr, discount_price_pkr)");

    if (error) throw error;
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

    // profiles.email added via migration — covers all users from sign-up
    // orders.email is a fallback for users created before migration
    const [{ data: profiles }, { data: orders }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,phone,email").in("id", userIds),
      supabase
        .from("orders")
        .select("user_id,email")
        .in("user_id", userIds)
        .order("created_at", { ascending: false }),
    ]);

    const orderEmailMap: Record<string, string> = {};
    (orders ?? []).forEach((o: any) => {
      if (!orderEmailMap[o.user_id] && o.email) orderEmailMap[o.user_id] = o.email;
    });

    const profileMap: Record<
      string,
      { full_name: string | null; phone: string | null; email: string | null }
    > = {};
    (profiles ?? []).forEach((p: any) => {
      profileMap[p.id] = { full_name: p.full_name, phone: p.phone, email: p.email ?? null };
    });

    return userIds.map((uid) => {
      const email =
        profileMap[uid]?.email ||   // profiles.email (preferred — available for all users)
        orderEmailMap[uid] ||        // order email fallback for pre-migration users
        null;
      return {
        user_id: uid,
        email: email ?? `user-${uid.slice(0, 8)}…`,
        full_name: profileMap[uid]?.full_name ?? null,
        item_count: userMap[uid].item_count,
        cart_value: userMap[uid].cart_value,
        oldest_item_at: userMap[uid].oldest_item_at,
      };
    });
  },
  staleTime: 2 * 60 * 1000, // 2 min
});

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/admin/abandoned-carts")({
  loader: ({ context }) => context.queryClient.ensureQueryData(abandonedCartsOpts),
  component: AbandonedCarts,
});

// ─── Component ────────────────────────────────────────────────────────────────

const AGE_LABELS: Record<AgeFilter, string> = {
  all: "All",
  "1h": "1h+",
  "24h": "24h+",
  "48h": "48h+",
};

const AGE_MS: Record<AgeFilter, number> = {
  all: 0,
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "48h": 48 * 60 * 60 * 1000,
};

function AbandonedCarts() {
  const { data: allCarts = [], isLoading, refetch, isRefetching } = useQuery(abandonedCartsOpts);
  const [ageFilter, setAgeFilter] = useState<AgeFilter>("all");

  // Client-side age filter
  const carts = allCarts.filter((c) => {
    if (ageFilter === "all") return true;
    const ms = Date.now() - new Date(c.oldest_item_at).getTime();
    return ms >= AGE_MS[ageFilter];
  });

  const reminderMutation = useMutation({
    mutationFn: async (cart: CartUser) => {
      const { data, error } = await supabase.functions.invoke("send-cart-reminder", {
        body: {
          user_id: cart.user_id,
          email: cart.email,
          full_name: cart.full_name,
          cart_value: cart.cart_value,
          item_count: cart.item_count,
        },
      });
      if (error) throw new Error(error.message ?? "Edge function not reachable — deploy it first");
      if (data?.errors?.length) {
        throw new Error(`Email failed: ${data.errors[0]}`);
      }
      return cart.email;
    },
    onSuccess: (email) => toast.success(`Reminder sent to ${email}`),
    onError: (err: any) => toast.error(err.message ?? "Failed to send reminder"),
  });

  const hoursAgo = (iso: string) =>
    Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
            Marketing
          </div>
          <h1 className="text-display text-4xl">Abandoned carts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {allCarts.length} cart{allCarts.length !== 1 && "s"} with items · showing{" "}
            {carts.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Age filter */}
          <div className="flex items-center gap-1 rounded-md border border-input overflow-hidden">
            <span className="px-2 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
            </span>
            {(["all", "1h", "24h", "48h"] as AgeFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setAgeFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  ageFilter === f ? "bg-copper text-copper-foreground" : "hover:bg-secondary"
                }`}
              >
                {AGE_LABELS[f]}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="surface-card p-12 text-center text-muted-foreground text-sm">
          Loading…
        </div>
      ) : carts.length === 0 ? (
        <div className="surface-card p-16 text-center space-y-3">
          <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            {allCarts.length === 0
              ? "No carts with items found."
              : `No carts older than ${AGE_LABELS[ageFilter]}.`}
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
            const hasEmail = !cart.email.startsWith("user-");

            return (
              <div
                key={cart.user_id}
                className="surface-card p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">
                    {cart.full_name ?? cart.email}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {cart.email}
                    {!hasEmail && (
                      <span className="ml-1.5 text-amber-500">(no email — no orders placed yet)</span>
                    )}
                  </div>
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
                  {alreadySent && (
                    <span className="text-xs text-success">Reminder sent ✓</span>
                  )}
                  <button
                    onClick={() => reminderMutation.mutate(cart)}
                    disabled={isSending || alreadySent || !hasEmail}
                    title={!hasEmail ? "No email available — customer has not placed an order yet" : undefined}
                    className="inline-flex items-center gap-2 rounded-md bg-copper px-4 py-2 text-sm font-medium text-copper-foreground disabled:opacity-40"
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
    </div>
  );
}
