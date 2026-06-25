/**
 * ReviewsSection — shows approved customer reviews for a product
 * and includes an inline write-review form.
 *
 * Extracted from product.$slug.tsx to keep that route file focused.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Review = {
 rating: number;
 title: string | null;
 body: string;
 created_at: string;
};

type Props = {
 productId: string;
 productSlug: string;
 reviews: Review[];
 signedIn: boolean;
};

export function ReviewsSection({ productId, productSlug, reviews, signedIn }: Props) {
 const qc = useQueryClient();
 const [rating, setRating] = useState(5);
 const [hover, setHover] = useState(0);
 const [title, setTitle] = useState("");
 const [body, setBody] = useState("");
 const [submitting, setSubmitting] = useState(false);

 async function submit() {
 if (!signedIn) {
 toast.info("Please sign in to leave a review");
 return;
 }
 if (!body.trim()) {
 toast.error("Please write a short review");
 return;
 }
 setSubmitting(true);
 const { data: u } = await supabase.auth.getUser();
 if (!u.user) {
 setSubmitting(false);
 return toast.error("Session expired. Please sign in again.");
 }
 const { error } = await supabase.from("reviews").insert({
 product_id: productId,
 user_id: u.user.id,
 rating,
 title: title || null,
 body,
 });
 setSubmitting(false);
 if (error) {
 if (error.message.includes("duplicate")) {
 toast.info("You've already reviewed this product");
 } else {
 toast.error(error.message);
 }
 return;
 }
 toast.success("Thanks for your review!");
 setTitle("");
 setBody("");
 setRating(5);
 // Invalidate only this specific product's cache, not all product pages
 qc.invalidateQueries({ queryKey: ["product", productSlug] });
 }

 return (
 <div className="surface-card p-6 space-y-5">
 <h3 className="text-display text-xl">Customer reviews</h3>

 {/* Review list */}
 {reviews.length === 0 ? (
 <p className="text-sm text-muted-foreground">No reviews yet be the first.</p>
 ) : (
 <ul className="space-y-4">
 {reviews.slice(0, 6).map((r, i) => (
 <li key={i} className="border-b border-border last:border-0 pb-4 last:pb-0">
 <div className="flex items-center gap-2 mb-1">
 <StarRow rating={r.rating} size="sm" />
 <span className="text-xs text-muted-foreground">
 {new Date(r.created_at).toLocaleDateString()}
 </span>
 </div>
 {r.title && <div className="font-medium text-sm mb-1">{r.title}</div>}
 <p className="text-sm text-muted-foreground">{r.body}</p>
 </li>
 ))}
 </ul>
 )}

 {/* Write review form */}
 <div className="border-t border-border pt-5">
 <div className="text-sm font-medium mb-3">Write a review</div>

 {/* Star picker */}
 <div className="flex items-center gap-1 mb-3">
 {Array.from({ length: 5 }).map((_, i) => (
 <button
 key={i}
 onMouseEnter={() => setHover(i + 1)}
 onMouseLeave={() => setHover(0)}
 onClick={() => setRating(i + 1)}
 className="text-copper"
 aria-label={`${i + 1} stars`}
 >
 <Star className={`h-5 w-5 ${i < (hover || rating) ? "fill-current" : ""}`} />
 </button>
 ))}
 </div>

 <input
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="Title (optional)"
 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-2"
 />
 <textarea
 value={body}
 onChange={(e) => setBody(e.target.value)}
 placeholder="Share your experience with this product…"
 rows={3}
 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-3"
 />
 <button
 onClick={submit}
 disabled={submitting}
 className="rounded-md bg-secondary hover:bg-copper text-foreground hover:text-copper-foreground transition-colors px-4 py-2 text-sm font-medium disabled:opacity-50"
 >
 {submitting ? "Submitting…" : "Submit review"}
 </button>
 </div>
 </div>
 );
}

/** Small reusable star row */
export function StarRow({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
 const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
 return (
 <div className="flex text-copper">
 {Array.from({ length: 5 }).map((_, i) => (
 <Star key={i} className={`${cls} ${i < rating ? "fill-current" : "opacity-30"}`} />
 ))}
 </div>
 );
}
