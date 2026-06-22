import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MailOpen, Reply, Send, ChevronDown, ChevronUp, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: AdminMessages,
});

function AdminMessages() {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMsgs(data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    load();
  }

  async function markUnread(id: string) {
    await supabase.from("contact_messages").update({ is_read: false }).eq("id", id);
    load();
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
    if (expandedId === id) {
      setReplyingId(null);
      setReplyText("");
    }
  }

  function startReply(id: string) {
    setReplyingId(id);
    setReplyText("");
  }

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function sendReply(msg: any) {
    if (!replyText.trim()) return toast.error("Please write a reply message");
    if (!msg.email || !isValidEmail(msg.email)) return toast.error("This message has no valid email address to reply to");

    setSending(true);

    let previousReplies: any[] = [];
    if (msg.admin_reply) {
      try {
        previousReplies = JSON.parse(msg.admin_reply);
      } catch(e) {
        previousReplies = [{ text: msg.admin_reply, date: msg.replied_at }];
      }
    }
    const newReplies = [...previousReplies, { text: replyText, date: new Date().toISOString() }];

    try {
      // Try sending via Supabase Edge Function
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-reply-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({
            to: msg.email,
            customerName: msg.name,
            subject: msg.subject ? `Re: ${msg.subject}` : "Reply from Asif Brothers",
            replyBody: replyText,
            originalMessage: msg.message,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to send reply");
      }

      // Mark as read + store reply note
      await supabase.from("contact_messages").update({
        is_read: true,
        admin_reply: JSON.stringify(newReplies),
        replied_at: new Date().toISOString(),
      } as any).eq("id", msg.id);

      toast.success(`Reply sent to ${msg.email}`);
      setReplyingId(null);
      setReplyText("");
      load();
    } catch (err: any) {
      // If edge function failed, still save the reply
      await supabase.from("contact_messages").update({
        is_read: true,
        admin_reply: JSON.stringify(newReplies),
        replied_at: new Date().toISOString(),
      } as any).eq("id", msg.id);

      toast.error(`Reply saved, but email failed: ${err.message || "Edge Function error."}`);
      setReplyingId(null);
      setReplyText("");
      load();
    } finally {
      setSending(false);
    }
  }

  const filtered = msgs.filter((m) => {
    if (filter === "unread") return !m.is_read;
    if (filter === "read") return m.is_read;
    return true;
  });

  const unreadCount = msgs.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Inbox</div>
          <h1 className="text-display text-4xl">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {msgs.length} total · {unreadCount} unread
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-input overflow-hidden">
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              {f} {f === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground">
          {filter === "unread" ? "All messages have been read." : filter === "read" ? "No read messages." : "No messages yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const isExpanded = expandedId === m.id;
            const isReplying = replyingId === m.id;

            return (
              <div key={m.id} className={`surface-card overflow-hidden transition ${!m.is_read ? "ring-1 ring-copper/40" : ""}`}>
                {/* Message Header */}
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
                      <span className={`text-sm ${!m.is_read ? "font-semibold" : "font-medium"}`}>{m.name}</span>
                      {m.replied_at && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-success">
                          <CheckCircle2 className="h-3 w-3" /> Replied
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.email} {m.phone ? `· ${m.phone}` : ""} · {new Date(m.created_at).toLocaleString("en-PK")}
                    </div>
                    {m.subject && <div className="text-sm font-medium mt-1">{m.subject}</div>}
                    {!isExpanded && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{m.message}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-muted-foreground">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border bg-muted/10">
                    
                    {/* Chat History Thread */}
                    <div className="mt-6 flex flex-col gap-6">
                      
                      {/* Customer Original Message */}
                      <div className="flex flex-col gap-1.5 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{m.name}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString("en-PK")}</span>
                        </div>
                        <div className="bg-background border border-border rounded-xl rounded-tl-sm px-4 py-3 text-sm whitespace-pre-wrap shadow-sm">
                          {m.message}
                        </div>
                      </div>

                      {/* Admin Replies */}
                      {(() => {
                        let replies: { text: string; date: string }[] = [];
                        if (m.admin_reply) {
                          try {
                            replies = JSON.parse(m.admin_reply);
                          } catch(e) {
                            replies = [{ text: m.admin_reply, date: m.replied_at }];
                          }
                        }

                        return replies.map((reply, i) => (
                          <div key={i} className="flex flex-col gap-1.5 self-end max-w-[85%]">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[10px] text-muted-foreground">{new Date(reply.date).toLocaleString("en-PK")}</span>
                              <span className="font-semibold text-sm text-copper">You (Admin)</span>
                            </div>
                            <div className="bg-copper text-copper-foreground rounded-xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap shadow-sm text-left">
                              {reply.text}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      {!m.is_read ? (
                        <button onClick={() => markRead(m.id)} className="inline-flex items-center gap-1.5 text-xs rounded-md border border-input px-3 py-1.5 hover:bg-secondary transition">
                          <MailOpen className="h-3.5 w-3.5" /> Mark read
                        </button>
                      ) : (
                        <button onClick={() => markUnread(m.id)} className="inline-flex items-center gap-1.5 text-xs rounded-md border border-input px-3 py-1.5 hover:bg-secondary transition">
                          <Mail className="h-3.5 w-3.5" /> Mark unread
                        </button>
                      )}
                      <button
                        onClick={() => startReply(m.id)}
                        className="inline-flex items-center gap-1.5 text-xs rounded-md bg-copper text-white px-3 py-1.5 hover:opacity-90 transition"
                      >
                        <Reply className="h-3.5 w-3.5" /> {m.admin_reply ? "Reply again" : "Reply"}
                      </button>
                    </div>

                    {/* Reply Form */}
                    {isReplying && (
                      <div className="mt-4 rounded-md border border-border bg-secondary/30 p-4 space-y-3">
                        <div className="text-xs font-medium text-muted-foreground">
                          Replying to <span className="text-foreground">{m.email}</span>
                        </div>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={4}
                          placeholder="Write your reply..."
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          autoFocus
                        />
                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => { setReplyingId(null); setReplyText(""); }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => sendReply(m)}
                            disabled={sending || !replyText.trim()}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {sending ? "Sending…" : "Send reply"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
