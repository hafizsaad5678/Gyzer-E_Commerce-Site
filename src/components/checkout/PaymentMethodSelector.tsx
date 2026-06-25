/**
 * PaymentMethodSelector + payment-method info panels.
 * Extracted from checkout.tsx to keep that route focused on form orchestration.
 */
import { Banknote, CreditCard, Smartphone, Building2 } from "lucide-react";
import { formatPKR } from "@/lib/format";
import { useSiteSettings } from "@/lib/settings";

export type PaymentMethod = "cod" | "easypaisa" | "jazzcash" | "bank" | "card";

type Option = {
 id: PaymentMethod;
 label: string;
 desc: string;
 icon: React.ReactNode;
 disabled?: boolean;
};

const OPTIONS: Option[] = [
 {
 id: "cod",
 label: "Cash on Delivery",
 desc: "Pay in cash when your geyser arrives.",
 icon: <Banknote className="h-5 w-5 text-copper mt-0.5" />,
 },
 {
 id: "easypaisa",
 label: "Easypaisa",
 desc: "Send payment to our Easypaisa account.",
 icon: <Smartphone className="h-5 w-5 text-green-500 mt-0.5" />,
 },
 {
 id: "jazzcash",
 label: "JazzCash",
 desc: "Send payment to our JazzCash account.",
 icon: <Smartphone className="h-5 w-5 text-red-500 mt-0.5" />,
 },
 {
 id: "bank",
 label: "Bank Transfer",
 desc: "Direct bank transfer (IBFT/online banking).",
 icon: <Building2 className="h-5 w-5 text-blue-500 mt-0.5" />,
 },
 {
 id: "card",
 label: "Card payment",
 desc: "Coming soon secure card checkout.",
 icon: <CreditCard className="h-5 w-5 mt-0.5" />,
 disabled: true,
 },
];

type SelectorProps = {
 selected: PaymentMethod;
 onChange: (m: PaymentMethod) => void;
};

export function PaymentMethodSelector({ selected, onChange }: SelectorProps) {
 return (
 <div className="space-y-2">
 {OPTIONS.map((opt) => (
 <label
 key={opt.id}
 className={[
 "flex items-start gap-3 p-4 rounded-md border cursor-pointer transition-colors",
 opt.disabled ? "opacity-50 cursor-not-allowed" : "",
 selected === opt.id && !opt.disabled
 ? "border-copper bg-copper/5"
 : "border-border hover:bg-secondary/40",
 ].join(" ")}
 >
 <input
 type="radio"
 name="payment"
 value={opt.id}
 checked={selected === opt.id}
 disabled={opt.disabled}
 onChange={() => !opt.disabled && onChange(opt.id)}
 className="mt-1"
 />
 {opt.icon}
 <div className="text-sm">
 <div className="font-medium">{opt.label}</div>
 <div className="text-muted-foreground text-xs mt-0.5">{opt.desc}</div>
 </div>
 </label>
 ))}
 </div>
 );
}

/** Bank transfer instructions shown when "bank" is selected */
export function BankTransferInfo() {
  const brand = useSiteSettings();
  return (
    <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-4 text-sm space-y-2">
      <div className="font-semibold text-foreground">Bank Transfer Details</div>
      <div className="space-y-1 text-muted-foreground">
        <div>
          <span className="text-foreground font-medium">Bank:</span> HBL (Habib Bank Limited)
        </div>
        <div>
          <span className="text-foreground font-medium">Account name:</span> {brand.company_name}
        </div>
        <div>
          <span className="text-foreground font-medium">Account #:</span> 0123-4567890-03
        </div>
        <div>
          <span className="text-foreground font-medium">IBAN:</span> PK36HABB0000123456789003
        </div>
        <div>
          <span className="text-foreground font-medium">Branch:</span> Gujranwala Main Branch
        </div>
      </div>
      <p className="text-xs text-muted-foreground border-t border-blue-500/20 pt-2">
        After transferring, WhatsApp your receipt to{" "}
        <span className="text-foreground font-medium">{brand.phone}</span> with your order number.
        Your order will be confirmed within 2 working hours.
      </p>
    </div>
  );
}

/** Easypaisa / JazzCash instructions shown when wallet method is selected */
export function MobileWalletInfo({
  method,
  total,
}: {
  method: "easypaisa" | "jazzcash";
  total: number;
}) {
  const brand = useSiteSettings();
  const isEp = method === "easypaisa";
  const name = isEp ? "Easypaisa" : "JazzCash";
  const colorClass = isEp
    ? "border-green-500/30 bg-green-500/5 border-green-500/20"
    : "border-red-500/30 bg-red-500/5 border-red-500/20";
  const number = "0309-8663850";

  return (
    <div className={`rounded-md border p-4 text-sm space-y-2 ${colorClass}`}>
      <div className="font-semibold text-foreground">{name} Payment Details</div>
      <div className="space-y-1 text-muted-foreground">
        <div>
          <span className="text-foreground font-medium">Account name:</span> {brand.company_name}
        </div>
        <div>
          <span className="text-foreground font-medium">Mobile number:</span> {number}
        </div>
        <div>
          <span className="text-foreground font-medium">Amount:</span> {formatPKR(total)}
        </div>
      </div>
      <p className="text-xs text-muted-foreground border-t border-border pt-2">
        Send <strong>{formatPKR(total)}</strong> to the above number via {name}, then WhatsApp the
        payment screenshot to <span className="text-foreground font-medium">{brand.phone}</span>{" "}
        with your order number.
      </p>
    </div>
  );
}
