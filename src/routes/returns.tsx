import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";

export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "Returns & Refunds — Asif Brothers" }] }),
  component: () => (
    <PolicyPage title="Returns & Refund Policy" subtitle="14-day window for unused units.">
      <h2>Eligibility</h2>
      <p>You may return an unused, undamaged geyser in original packaging within 14 days of delivery for a full refund minus return shipping.</p>
      <h2>What's not returnable</h2>
      <ul>
        <li>Installed or used units (warranty applies instead)</li>
        <li>Custom orders and bulk-discounted purchases</li>
        <li>Damaged units (report transport damage within 48 hours)</li>
      </ul>
      <h2>Refund timeline</h2>
      <p>Once we receive and inspect the unit, your refund is processed within 5 business days. Cards typically post within 3–10 days depending on the bank.</p>
      <h2>How to start a return</h2>
      <p>Open a return request from your order in the account dashboard, or email hello@asifbrothers.pk with your order number.</p>
    </PolicyPage>
  ),
});
