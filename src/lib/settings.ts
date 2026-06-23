import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const siteSettingsOpts = queryOptions({
 queryKey: ["site_settings"],
 queryFn: async () => {
 const defaultSettings = {
 company_name: "Asif Brothers",
 tagline: "Engineering Hot Water for Pakistan",
 phone: "+92 309 8663850",
 whatsapp: "923098663850",
 email: "ghamzahmza123@gmail.com",
 address: "Industrial Area, Gujranwala, Pakistan",
 };
 try {
 const { data, error } = await supabase
 .from("site_settings")
 .select("*")
 .eq("id", 1)
 .maybeSingle();
 if (error && error.code !== "PGRST205") throw error;
 return data ?? defaultSettings;
 } catch (e) {
 return defaultSettings;
 }
 },
 staleTime: 1000 * 60 * 60, // 1 hour
});

export function useSiteSettings() {
 const { data } = useSuspenseQuery(siteSettingsOpts);
 return data;
}
