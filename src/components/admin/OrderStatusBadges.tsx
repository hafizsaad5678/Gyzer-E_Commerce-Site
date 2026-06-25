/**
 * OrderStatusBadges — reusable row of status count pills for the orders page.
 * Pass in all orders and it computes counts per status.
 */

export type OrderStatusCount = {
  total: number;
  pending: number;
  payment_verified: number;
  paid: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
};

export function computeStatusCounts(orders: { status: string }[]): OrderStatusCount {
  const counts: OrderStatusCount = {
    total: orders.length,
    pending: 0,
    payment_verified: 0,
    paid: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  };
  for (const o of orders) {
    const s = o.status as keyof Omit<OrderStatusCount, "total">;
    if (s in counts) (counts as any)[s]++;
  }
  return counts;
}

type BadgeConfig = {
  key: keyof OrderStatusCount;
  label: string;
  cls: string;
};

const BADGES: BadgeConfig[] = [
  { key: "total",            label: "Total",      cls: "bg-secondary text-foreground border border-border" },
  { key: "pending",          label: "Pending",    cls: "bg-slate-400/15 text-slate-500" },
  { key: "payment_verified", label: "Verified",   cls: "bg-green-500/15 text-green-600" },
  { key: "processing",       label: "Processing", cls: "bg-amber-500/15 text-amber-600" },
  { key: "shipped",          label: "Shipped",    cls: "bg-blue-500/15 text-blue-600" },
  { key: "delivered",        label: "Delivered",  cls: "bg-emerald-500/15 text-emerald-600" },
  { key: "refunded",         label: "Refunded",   cls: "bg-rose-500/15 text-rose-600" },
  { key: "cancelled",        label: "Cancelled",  cls: "bg-destructive/15 text-destructive" },
];

type Props = {
  counts: OrderStatusCount;
  activeFilter: string;
  onFilter: (status: string) => void;
};

export function OrderStatusBadges({ counts, activeFilter, onFilter }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {BADGES.map(({ key, label, cls }) => {
        const isActive = key === "total" ? activeFilter === "" : activeFilter === key;
        return (
          <button
            key={key}
            onClick={() => onFilter(key === "total" ? "" : key)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all",
              cls,
              isActive ? "ring-2 ring-offset-1 ring-current opacity-100" : "opacity-70 hover:opacity-100",
            ].join(" ")}
          >
            {label}
            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold leading-none">
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
