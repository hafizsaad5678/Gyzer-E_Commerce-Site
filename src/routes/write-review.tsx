import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/write-review")({
 head: () => ({ meta: [{ title: "Write a Review — Asif Brothers" }] }),
 component: WriteReview,
});

function WriteReview() {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [hoverRating, setHoverRating] = useState(0);
 const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
 const [form, setForm] = useState({ customer_name: "", rating: 0, comment: "", product_id: "" });

 useEffect(() => {
 async function loadProducts() {
 const { data } = await supabase.from("products").select("id, name").eq("is_active", true);
 if (data) {
 setProducts(data);
 if (data.length > 0) setForm((f) => ({ ...f, product_id: data[0].id }));
 }
 }
 loadProducts();
 }, []);

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (form.rating === 0) {
 toast.error("Please select a rating");
 return;
 }
 if (!form.product_id) {
 toast.error("Please select a product");
 return;
 }
 setLoading(true);
 const {
 data: { session },
 } = await supabase.auth.getSession();

 const { error } = await supabase.from("reviews").insert({
 product_id: form.product_id,
 user_id: session?.user?.id ?? null,
 title: form.customer_name,
 rating: form.rating,
 body: form.comment,
 is_approved: false,
 });

 setLoading(false);
 if (error) {
 toast.error(error.message);
 return;
 }
 toast.success("Thank you! Your review has been submitted for approval.");
 navigate({ to: "/" });
 }

 return (
 <SiteLayout>
 <section className="container-page py-16 max-w-2xl">
 <div className="mb-10 text-center">
 <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
 Feedback
 </div>
 <h1 className="text-display text-4xl">Write a Review</h1>
 <p className="text-muted-foreground mt-2">
 Share your experience with our products and service.
 </p>
 </div>

 <form onSubmit={handleSubmit} className="surface-card p-6 md:p-8 space-y-6">
 <div className="flex flex-col items-center justify-center mb-4">
 <span className="text-sm font-medium mb-3">Overall Rating</span>
 <div className="flex gap-2">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 type="button"
 key={star}
 onClick={() => setForm({ ...form, rating: star })}
 onMouseEnter={() => setHoverRating(star)}
 onMouseLeave={() => setHoverRating(0)}
 className="p-1 focus:outline-none transition-transform hover:scale-110"
 >
 <Star
 className={`h-8 w-8 transition-colors ${star <= (hoverRating || form.rating)
 ? "fill-copper text-copper"
 : "text-muted-foreground/30"
 }`}
 />
 </button>
 ))}
 </div>
 </div>

 <label className="block">
 <span className="block text-sm font-medium mb-1.5">Product</span>
 <select
 required
 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
 value={form.product_id}
 onChange={(e) => setForm({ ...form, product_id: e.target.value })}
 >
 {products.map((p) => (
 <option key={p.id} value={p.id}>
 {p.name}
 </option>
 ))}
 </select>
 </label>

 <label className="block">
 <span className="block text-sm font-medium mb-1.5">Your Name</span>
 <input
 type="text"
 required
 placeholder="e.g. Bilal R."
 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
 value={form.customer_name}
 onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
 />
 </label>

 <label className="block">
 <span className="block text-sm font-medium mb-1.5">Your Review</span>
 <textarea
 required
 rows={4}
 placeholder="How was the product? How was the installation and service?"
 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
 value={form.comment}
 onChange={(e) => setForm({ ...form, comment: e.target.value })}
 />
 </label>

 <button
 disabled={loading}
 type="submit"
 className="w-full rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-5 py-3 text-sm font-medium transition"
 >
 {loading ? "Submitting..." : "Submit Review"}
 </button>
 <p className="text-center text-[10px] text-muted-foreground mt-4">
 By submitting, you agree to allow us to display this review on our website.
 </p>
 </form>
 </section>
 </SiteLayout>
 );
}
