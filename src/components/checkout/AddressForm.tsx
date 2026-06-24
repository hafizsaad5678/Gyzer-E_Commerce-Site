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
const inputErrCls = "w-full rounded-md border border-destructive bg-background px-3 py-2 text-sm";
const errMsg = "text-xs text-destructive mt-1";

type Props = {
 value: AddressFields;
 onChange: (updated: AddressFields) => void;
};

function phoneError(phone: string): string | null {
 if (!phone) return null;
 const digits = phone.replace(/\D/g, "");
 if (digits.length < 9 || digits.length > 11) return "Phone must be 9–11 digits";
 return null;
}

function postalError(postal: string): string | null {
 if (!postal) return null;
 const digits = postal.replace(/\D/g, "");
 if (digits.length < 4 || digits.length > 6) return "Postal code must be 4–6 digits";
 return null;
}

export function AddressForm({ value, onChange }: Props) {
 function set(key: keyof AddressFields, val: string) {
 onChange({ ...value, [key]: val });
 }

 const phoneErr = phoneError(value.phone);
 const postalErr = postalError(value.postal_code);

 return (
 <div className="grid sm:grid-cols-2 gap-3">
 <input
 placeholder="Full name *"
 value={value.full_name}
 onChange={(e) => set("full_name", e.target.value)}
 className={inputCls}
 />

 {/* Phone */}
 <div>
 <input
 placeholder="Phone * (9–11 digits)"
 value={value.phone}
 onChange={(e) => set("phone", e.target.value)}
 className={phoneErr ? inputErrCls : inputCls}
 inputMode="tel"
 />
 {phoneErr && <p className={errMsg}>{phoneErr}</p>}
 </div>

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

 {/* Postal code */}
 <div>
 <input
 placeholder="Postal code (4–6 digits)"
 value={value.postal_code}
 onChange={(e) => set("postal_code", e.target.value)}
 className={postalErr ? inputErrCls : inputCls}
 inputMode="numeric"
 />
 {postalErr && <p className={errMsg}>{postalErr}</p>}
 </div>

 <input
 placeholder="Country"
 value={value.country}
 onChange={(e) => set("country", e.target.value)}
 className={inputCls}
 />
 </div>
 );
}
