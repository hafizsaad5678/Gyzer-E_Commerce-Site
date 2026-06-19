import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { BRAND } from "@/lib/format";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10, "Tell us a bit more").max(2000),
});

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Asif Brothers — Sales & Support" },
      { name: "description", content: "Get in touch with Asif Brothers for sales, installation quotes, or warranty service. Lahore, Karachi, Islamabad and more." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setLoading(false);
    if (error) return toast.error("Could not send message");
    toast.success("Message sent — we'll reply within one business day.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <SiteLayout>
      <section className="container-page py-12 md:py-16">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">Contact</div>
          <h1 className="text-display text-4xl md:text-5xl mb-3">Let's talk hot water.</h1>
          <p className="text-muted-foreground">Sales, installation quotes, warranty service — our team replies within one business day.</p>
        </div>

        <div className="mt-12 grid lg:grid-cols-[1fr_400px] gap-10">
          <form onSubmit={submit} className="surface-card p-6 md:p-8 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Your name" name="name" required />
              <Field label="Email" name="email" type="email" required />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Phone" name="phone" />
              <Field label="Subject" name="subject" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Message</label>
              <textarea name="message" rows={6} required className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
              <MessageSquare className="h-4 w-4" /> {loading ? "Sending..." : "Send message"}
            </button>
          </form>

          <aside className="space-y-4">
            <Info icon={Phone} title="Call us" body={<a href={`tel:${BRAND.phone}`} className="hover:text-copper">{BRAND.phone}</a>} />
            <Info icon={Mail} title="Email" body={<a href={`mailto:${BRAND.email}`} className="hover:text-copper">{BRAND.email}</a>} />
            <Info icon={MapPin} title="Head office" body={BRAND.address} />
            <div className="surface-card overflow-hidden">
              <iframe
                title="Asif Brothers location"
                src="https://www.google.com/maps?q=Gujranwala+Pakistan&output=embed"
                className="w-full h-64 border-0"
                loading="lazy"
              />
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">{label}{required && <span className="text-copper"> *</span>}</label>
      <input type={type} name={name} required={required} className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
function Info({ icon: Icon, title, body }: { icon: any; title: string; body: React.ReactNode }) {
  return (
    <div className="surface-card p-5 flex gap-4">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-accent text-copper shrink-0"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="text-sm mt-1">{body}</div>
      </div>
    </div>
  );
}
