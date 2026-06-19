export function formatPKR(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(n)) return "Rs 0";
  return "Rs " + new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n);
}

export const BRAND = {
  name: "Asif Brothers",
  tagline: "Engineering Hot Water for Pakistan",
  phone: "+92 300 0000000",
  whatsapp: "923000000000",
  email: "[EMAIL_ADDRESS]",
  address: "Industrial Area, Lahore, Pakistan",
};
