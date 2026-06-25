/**
 * SalesMetrics — reusable sales summary cards for the admin dashboard.
 * Shows gross sales, shipping collected, discounts, net sales, and profit.
 */
import { TrendingUp, TrendingDown, DollarSign, Truck, Tag, BarChart2 } from "lucide-react";
import { formatPKR } from "@/lib/format";

export type SalesData = {
  grossSales: number;       // sum of order subtotals before discounts
  shippingCollected: number;
  discountsGiven: number;
  netSales: number;         // grossSales - discountsGiven
  totalRevenue: number;     // netSales + shippingCollected (what actually came in)
  estimatedCost: number;    // rough cost basis (if cost_price available, else 0)
  profit: number;           // totalRevenue - estimatedCost
};

type Props = {
  data: SalesData;
};

export function SalesMetrics({ data }: Props) {
  const profitMargin =
    data.totalRevenue > 0 ? ((data.profit / data.totalRevenue) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        icon={BarChart2}
        label="Gross Sales"
        value={formatPKR(data.grossSales)}
        hint="Order subtotals before discounts"
        color="copper"
      />
      <MetricCard
        icon={Tag}
        label="Discounts Given"
        value={formatPKR(data.discountsGiven)}
        hint="Total coupon / discount deductions"
        color="amber"
        negative
      />
      <MetricCard
        icon={DollarSign}
        label="Net Sales"
        value={formatPKR(data.netSales)}
        hint="Gross sales minus discounts"
        color="blue"
      />
      <MetricCard
        icon={Truck}
        label="Shipping Collected"
        value={formatPKR(data.shippingCollected)}
        hint="Delivery fees charged to customers"
        color="green"
      />
      <MetricCard
        icon={TrendingUp}
        label="Total Revenue"
        value={formatPKR(data.totalRevenue)}
        hint="Net sales + shipping"
        color="green"
        highlight
      />
      <MetricCard
        icon={data.profit >= 0 ? TrendingUp : TrendingDown}
        label="Est. Profit"
        value={formatPKR(data.profit)}
        hint={`${profitMargin}% margin${data.estimatedCost === 0 ? " · no cost data" : ""}`}
        color={data.profit >= 0 ? "green" : "red"}
        highlight
      />
    </div>
  );
}

const COLOR_MAP = {
  copper: "text-copper",
  amber:  "text-amber-500",
  blue:   "text-blue-500",
  green:  "text-emerald-500",
  red:    "text-destructive",
};

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  color,
  negative = false,
  highlight = false,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
  color: keyof typeof COLOR_MAP;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`surface-card p-5 flex flex-col gap-1 ${highlight ? "ring-1 ring-copper/20" : ""}`}
    >
      <Icon className={`h-5 w-5 mb-1 ${COLOR_MAP[color]}`} />
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-display text-2xl ${negative ? "text-amber-500" : ""}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
