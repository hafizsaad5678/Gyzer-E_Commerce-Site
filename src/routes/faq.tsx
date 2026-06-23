import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

const faqs = [
  {
    q: "Which geyser is right for my home?",
    a: "For 1–2 bathrooms with gas supply, a 30–50L gas geyser is most economical. Electric geysers suit homes with stable power; for instant hot water in tight spaces, choose tankless. Solar pays back in 3–5 years if you have a south-facing roof.",
  },
  {
    q: "Do you offer installation?",
    a: "Yes — installation is available in 14 cities. We quote based on plumbing complexity. Standard installation is typically Rs 5,000–15,000.",
  },
  {
    q: "What's covered under warranty?",
    a: "Tank, heating element, and electronics for the period stated per model (2–7 years). Wear items like anode rods and gaskets are excluded. Full terms on the Warranty page.",
  },
  {
    q: "How long does delivery take?",
    a: "3–7 business days nationwide. Major cities (Lahore, Karachi, Islamabad, Rawalpindi) usually ship within 48 hours.",
  },
  {
    q: "Can I return a geyser?",
    a: "Unused, undamaged units in original packaging may be returned within 14 days for a full refund minus return shipping. See the Returns policy for details.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently we only ship within Pakistan. For overseas orders please email us directly.",
  },
  {
    q: "How can I pay?",
    a: "We accept all major credit/debit cards through Stripe, plus bank transfer for orders over Rs 100,000.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Asif Brothers" },
      {
        name: "description",
        content:
          "Frequently asked questions about Asif Brothers geysers, warranty, installation, and shipping.",
      },
    ],
  }),
  component: FAQ,
});

function FAQ() {
  return (
    <SiteLayout>
      <section className="container-page py-12 md:py-20 max-w-3xl">
        <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-2">FAQ</div>
        <h1 className="text-display text-4xl md:text-5xl mb-10">Common questions</h1>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="surface-card p-5 group">
              <summary className="cursor-pointer list-none flex justify-between items-center gap-4 text-base font-medium">
                {f.q}
                <span className="text-copper text-xl transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
