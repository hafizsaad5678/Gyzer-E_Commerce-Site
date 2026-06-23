/**
 * AddressForm — new shipping address form used inside checkout.
 * Extracted from checkout.tsx.
 */

export type AddressFields = {
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
};

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

type Props = {
  value: AddressFields;
  onChange: (updated: AddressFields) => void;
};

export function AddressForm({ value, onChange }: Props) {
  function set(key: keyof AddressFields, val: string) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <input
        placeholder="Full name *"
        value={value.full_name}
        onChange={(e) => set("full_name", e.target.value)}
        className={inputCls}
      />
      <input
        placeholder="Phone *"
        value={value.phone}
        onChange={(e) => set("phone", e.target.value)}
        className={inputCls}
      />
      <input
        placeholder="Address line 1 *"
        value={value.line1}
        onChange={(e) => set("line1", e.target.value)}
        className={inputCls + " sm:col-span-2"}
      />
      <input
        placeholder="Address line 2 (optional)"
        value={value.line2}
        onChange={(e) => set("line2", e.target.value)}
        className={inputCls + " sm:col-span-2"}
      />
      <input
        placeholder="City *"
        value={value.city}
        onChange={(e) => set("city", e.target.value)}
        className={inputCls}
      />
      <input
        placeholder="Province *"
        value={value.province}
        onChange={(e) => set("province", e.target.value)}
        className={inputCls}
      />
      <input
        placeholder="Postal code"
        value={value.postal_code}
        onChange={(e) => set("postal_code", e.target.value)}
        className={inputCls}
      />
      <input
        placeholder="Country"
        value={value.country}
        onChange={(e) => set("country", e.target.value)}
        className={inputCls}
      />
    </div>
  );
}
