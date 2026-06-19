import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to the product-images bucket and return a long-lived signed URL.
 * Bucket is private; we sign for 10 years so URLs work in product listings.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signErr || !data) throw signErr ?? new Error("Sign failed");
  return data.signedUrl;
}
