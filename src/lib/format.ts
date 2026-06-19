export function formatPKR(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(n)) return "Rs 0";
  return "Rs " + new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n);
}

export const BRAND = {
  name: "Asif Brothers",
  tagline: "Engineering Hot Water for Pakistan",
  phone: "+92 309 8663850",
  whatsapp: "923098663850",
  email: "ghamzahmza123@gmail.com",
  address: "Industrial Area, Gujranwala, Pakistan",
};
