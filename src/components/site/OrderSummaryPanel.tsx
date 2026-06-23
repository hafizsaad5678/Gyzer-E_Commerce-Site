/**
 * OrderSummaryPanel — shared order total summary used in cart and checkout.
 */
import { formatPKR } from "@/lib/format";

type Props = {
 subtotal: number;
 discount: number;
 shipping: number;
 total: number;
};

export function OrderSummaryPanel({ subtotal, discount, shipping, total }: Props) {
 return (
 <dl className="space-y-2 text-sm">
 <SummaryRow label="Subtotal" value={formatPKR(subtotal)} />
 {discount > 0 && <SummaryRow label="Discount" value={`-${formatPKR(discount)}`} accent />}
 <SummaryRow label="Shipping" value={shipping === 0 ? "Free" : formatPKR(shipping)} />
 <div className="flex justify-between pt-3 border-t border-border text-base font-semibold">
 <dt>Total</dt>
 <dd>{formatPKR(total)}</dd>
 </div>
 </dl>
 );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
 return (
 <div className="flex justify-between">
 <dt className="text-muted-foreground">{label}</dt>
 <dd className={accent ? "text-copper font-medium" : ""}>{value}</dd>
 </div>
 );
}
