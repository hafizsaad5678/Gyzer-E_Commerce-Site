/**
 * MessageThread — thread/chat bubble view for a contact message,
 * including the admin reply form.
 *
 * Mark-read, mark-unread, and send-reply all use useMutation so the
 * admin-messages query cache is kept consistent without manual callbacks.
 */
import { useState } from "react";
import { Reply, Send, MailOpen, Mail } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type ReplyEntry = { text: string; date: string };

type Message = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  created_at: string;
  is_read: boolean;
  admin_reply?: string | null;
  replied_at?: string | null;
};

type Props = {
  message: Message;
  /** Legacy callback — kept for backward compat but no longer needed */
  onUpdated?: () => void;
};

function parseReplies(raw: string | null | undefined): ReplyEntry[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [{ text: raw, date: new Date().toISOString() }];
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function MessageThread({ message: m, onUpdated }: Props) {
  const qc = useQueryClient();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const replies = parseReplies(m.admin_reply);

  // Shared invalidation helper
  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-messages"] });
    onUpdated?.();
  }

  const markReadMutation = useMutation({
    mutationFn: async (isRead: boolean) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: isRead })
        .eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("Could not update message"),
  });

  const replyMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!text.trim()) throw new Error("Please write a reply");
      if (!m.email || !isValidEmail(m.email)) {
        throw new Error("This message has no valid email address to reply to");
      }

      const newReplies: ReplyEntry[] = [...replies, { text, date: new Date().toISOString() }];

      // Attempt to send email via edge function
      let emailSent = true;
      try {
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
              to: m.email,
              customerName: m.name,
              subject: m.subject ? `Re: ${m.subject}` : "Reply from Asif Brothers",
              replyBody: text,
              originalMessage: m.message,
            }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to send reply");
        }
      } catch {
        emailSent = false;
      }

      // Always persist the reply to the DB
      const { error } = await supabase
        .from("contact_messages")
        .update({
          is_read: true,
          admin_reply: JSON.stringify(newReplies),
          replied_at: new Date().toISOString(),
        } as any)
        .eq("id", m.id);
      if (error) throw error;

      return { emailSent, email: m.email };
    },
    onSuccess: ({ emailSent, email }) => {
      if (emailSent) {
        toast.success(`Reply sent to ${email}`);
      } else {
        toast.error("Reply saved, but email delivery failed");
      }
      setReplying(false);
      setReplyText("");
      invalidate();
    },
    onError: (err: any) => toast.error(err.message ?? "Could not send reply"),
  });

  return (
    <div className="px-5 pb-5 border-t border-border bg-muted/10">
      {/* Chat thread */}
      <div className="mt-6 flex flex-col gap-6">
        {/* Customer message bubble */}
        <div className="flex flex-col gap-1.5 max-w-[85%]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{m.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(m.created_at).toLocaleString("en-PK")}
            </span>
          </div>
          <div className="bg-background border border-border rounded-xl rounded-tl-sm px-4 py-3 text-sm whitespace-pre-wrap shadow-sm">
            {m.message}
          </div>
        </div>

        {/* Admin reply bubbles */}
        {replies.map((reply, i) => (
          <div key={i} className="flex flex-col gap-1.5 self-end max-w-[85%]">
            <div className="flex items-center justify-end gap-2">
              <span className="text-[10px] text-muted-foreground">
                {new Date(reply.date).toLocaleString("en-PK")}
              </span>
              <span className="font-semibold text-sm text-copper">You (Admin)</span>
            </div>
            <div className="bg-copper text-copper-foreground rounded-xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap shadow-sm text-left">
              {reply.text}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {!m.is_read ? (
          <button
            onClick={() => markReadMutation.mutate(true)}
            disabled={markReadMutation.isPending}
            className="inline-flex items-center gap-1.5 text-xs rounded-md border border-input px-3 py-1.5 hover:bg-secondary transition disabled:opacity-50"
          >
            <MailOpen className="h-3.5 w-3.5" /> Mark read
          </button>
        ) : (
          <button
            onClick={() => markReadMutation.mutate(false)}
            disabled={markReadMutation.isPending}
            className="inline-flex items-center gap-1.5 text-xs rounded-md border border-input px-3 py-1.5 hover:bg-secondary transition disabled:opacity-50"
          >
            <Mail className="h-3.5 w-3.5" /> Mark unread
          </button>
        )}
        <button
          onClick={() => {
            setReplying(true);
            setReplyText("");
          }}
          className="inline-flex items-center gap-1.5 text-xs rounded-md bg-copper text-white px-3 py-1.5 hover:opacity-90 transition"
        >
          <Reply className="h-3.5 w-3.5" />
          {m.admin_reply ? "Reply again" : "Reply"}
        </button>
      </div>

      {/* Reply compose box */}
      {replying && (
        <div className="mt-4 rounded-md border border-border bg-secondary/30 p-4 space-y-3">
          <div className="text-xs font-medium text-muted-foreground">
            Replying to <span className="text-foreground">{m.email}</span>
          </div>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            placeholder="Write your reply..."
            autoFocus
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setReplying(false);
                setReplyText("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => replyMutation.mutate(replyText)}
              disabled={replyMutation.isPending || !replyText.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
            >
              <Send className="h-3.5 w-3.5" />
              {replyMutation.isPending ? "Sending…" : "Send reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
