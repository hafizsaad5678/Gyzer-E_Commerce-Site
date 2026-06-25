import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";

export const Route = createFileRoute("/privacy")({
 head: () => ({ meta: [{ title: "Privacy Policy Asif Brothers" }] }),
 component: () => (
 <PolicyPage title="Privacy Policy" subtitle="Last updated June 2026">
 <p>
 This page describes how Asif Brothers ("we", "us") collects and uses your personal data when
 you use our website or buy our products.
 </p>
 <h2>What we collect</h2>
 <ul>
 <li>Account details: name, email, phone number, shipping addresses</li>
 <li>
 Order history and payment confirmations (we never store full card numbers — payments are
 handled by Stripe)
 </li>
 <li>Support correspondence and warranty claim records</li>
 <li>Basic analytics about how you use the site</li>
 </ul>
 <h2>How we use it</h2>
 <ul>
 <li>To process orders, deliveries, and warranty service</li>
 <li>To send order updates and (with consent) marketing emails</li>
 <li>To improve our products and customer experience</li>
 </ul>
 <h2>Sharing</h2>
 <p>
 We share data with logistics providers, payment processors, and authorized service partners
 only to fulfil your orders. We never sell your data.
 </p>
 <h2>Your rights</h2>
 <p>
 You can request access, correction, or deletion of your data at any time by emailing
 hello@asifbrothers.pk.
 </p>
 </PolicyPage>
 ),
});
