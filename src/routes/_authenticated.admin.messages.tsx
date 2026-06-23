import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MailOpen, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { MessageThread } from "@/components/admin/MessageThread";

// ─── Query ────────────────────────────────────────────────────────────────────

const messagesOpts = queryOptions({
  queryKey: ["admin-messages"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  // Refetch every 60s so new messages appear without a page reload
  refetchInterval: 60_000,
});

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/admin/messages")({
  loader: ({ context }) => context.queryClient.ensureQueryData(messagesOpts),
  component: AdminMessages,
});

// ─── Component ────────────────────────────────────────────────────────────────

type Filter = "all" | "unread" | "read";

function AdminMessages() {
  const { data: msgs } = useSuspenseQuery(messagesOpts);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  const filtered = msgs.filter((m) => {
    if (filter === "unread") return !m.is_read;
    if (filter === "read") return m.is_read;
    return true;
  });

  const unreadCount = msgs.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">
            Inbox
          </div>
          <h1 className="text-display text-4xl">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {msgs.length} total · {unreadCount} unread
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-input overflow-hidden">
          {(["all", "unread", "read"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === f ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              {f}
              {f === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Message list */}
      {filtered.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground">
          {filter === "unread"
            ? "All messages have been read."
            : filter === "read"
              ? "No read messages."
              : "No messages yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const isExpanded = expandedId === m.id;
            return (
              <div
                key={m.id}
                className={`surface-card overflow-hidden transition ${
                  !m.is_read ? "ring-1 ring-copper/40" : ""
                }`}
              >
                {/* Collapsed header */}
                <button
                  onClick={() => toggleExpand(m.id)}
                  className="w-full text-left p-5 flex items-start gap-3 hover:bg-secondary/30 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {m.is_read ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mail className="h-4 w-4 text-copper" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm ${!m.is_read ? "font-semibold" : "font-medium"}`}>
                        {m.name}
                      </span>
                      {m.replied_at && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-success">
                          <CheckCircle2 className="h-3 w-3" /> Replied
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.email}
                      {m.phone ? ` · ${m.phone}` : ""} ·{" "}
                      {new Date(m.created_at).toLocaleString("en-PK")}
                    </div>
                    {m.subject && <div className="text-sm font-medium mt-1">{m.subject}</div>}
                    {!isExpanded && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{m.message}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-muted-foreground">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* Expanded thread — MessageThread handles mark-read/reply mutations internally */}
                {isExpanded && (
                  <MessageThread
                    message={m}
                    onUpdated={() => {
                      // MessageThread calls onUpdated after any mutation — we just
                      // need to re-fetch. Using the query key ensures consistency.
                      // Note: MessageThread calls supabase directly then triggers this;
                      // switching it to useMutation + queryKey invalidation is a future step.
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
