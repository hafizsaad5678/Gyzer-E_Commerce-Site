import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";

export const Route = createFileRoute("/shipping")({
  head: () => ({ meta: [{ title: "Shipping Policy — Asif Brothers" }] }),
  component: () => (
    <PolicyPage title="Shipping Policy" subtitle="Nationwide delivery from our Lahore warehouse.">
      <h2>Delivery timelines</h2>
      <ul>
        <li>Lahore, Karachi, Islamabad, Rawalpindi: 1–3 business days</li>
        <li>Other major cities: 3–5 business days</li>
        <li>Smaller towns: 5–7 business days</li>
      </ul>
      <h2>Shipping fees</h2>
      <ul>
        <li>Orders under Rs 20,000: Rs 1,200 flat fee</li>
        <li>Orders Rs 20,000–50,000: Rs 800</li>
        <li>Orders over Rs 50,000: FREE</li>
      </ul>
      <h2>Installation</h2>
      <p>
        Installation is a separate service quoted after delivery (or pre-booked at checkout in
        select cities). Standard installation Rs 5,000–15,000 depending on plumbing complexity.
      </p>
      <h2>Order tracking</h2>
      <p>
        You'll receive an SMS/email with a tracking link once your order ships. You can also view
        tracking from your account dashboard.
      </p>
    </PolicyPage>
  ),
});
