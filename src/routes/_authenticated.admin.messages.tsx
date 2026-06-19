import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: AdminMessages,
});

function AdminMessages() {
  const [msgs, setMsgs] = useState<any[]>([]);
  async function load() {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setMsgs(data ?? []);
  }
  useEffect(() => { load(); }, []);
  async function markRead(id: string) {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    load();
  }
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Inbox</div>
        <h1 className="text-display text-4xl">Messages</h1>
      </div>
      {msgs.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground">No messages yet.</div>
      ) : (
        <div className="space-y-3">
          {msgs.map((m) => (
            <div key={m.id} className={`surface-card p-5 ${!m.is_read ? "ring-1 ring-copper/40" : ""}`}>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.email} · {m.phone ?? ""} · {new Date(m.created_at).toLocaleString("en-PK")}</div>
                  {m.subject && <div className="text-sm mt-2 font-medium">{m.subject}</div>}
                </div>
                {!m.is_read && <button onClick={() => markRead(m.id)} className="text-xs rounded-md border border-input px-2.5 py-1 hover:bg-secondary">Mark read</button>}
              </div>
              <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
