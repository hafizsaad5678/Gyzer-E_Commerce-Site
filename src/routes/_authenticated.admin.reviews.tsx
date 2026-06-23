import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Star } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const reviewsOpts = queryOptions({
  queryKey: ["admin_reviews"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  loader: ({ context }) => context.queryClient.ensureQueryData(reviewsOpts),
  component: AdminReviews,
});

function AdminReviews() {
  const { data: reviews } = useSuspenseQuery(reviewsOpts);
  const qc = useQueryClient();

  async function toggleApproval(id: string, current: boolean) {
    const { error } = await supabase.from("reviews").update({ is_approved: !current }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin_reviews"] });
    toast.success(current ? "Review hidden" : "Review approved");
  }

  async function deleteReview(id: string) {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin_reviews"] });
    toast.success("Review deleted");
  }

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
          Testimonials
        </div>
        <h1 className="text-display text-4xl">Manage Reviews</h1>
      </div>

      <div className="surface-card overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No reviews yet.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Rating</th>
                <th className="p-4 font-medium">Review</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reviews.map((r) => (
                <tr key={r.id} className={r.is_approved ? "" : "bg-muted/10"}>
                  <td className="p-4">
                    <div className="font-medium">{r.title || "Customer"}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-0.5 text-copper">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-30"}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 max-w-[300px]">
                    <div className="text-muted-foreground line-clamp-2">{r.body}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleApproval(r.id, r.is_approved)}
                        className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          r.is_approved
                            ? "border-green-500/30 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                            : "border-border bg-secondary hover:bg-secondary/80 text-muted-foreground"
                        }`}
                      >
                        {r.is_approved ? (
                          <>
                            <Check className="h-3 w-3" /> Approved
                          </>
                        ) : (
                          "Approve"
                        )}
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="grid h-7 w-7 place-items-center rounded border border-border bg-secondary text-muted-foreground hover:border-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Review</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this review? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteReview(r.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
