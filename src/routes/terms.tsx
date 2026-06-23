import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";

export const Route = createFileRoute("/terms")({
 head: () => ({ meta: [{ title: "Terms & Conditions — Asif Brothers" }] }),
 component: () => (
 <PolicyPage
 title="Terms & Conditions"
 subtitle="By using this site you agree to the terms below."
 >
 <h2>1. Orders & pricing</h2>
 <p>
 All prices are in Pakistani Rupees (PKR) and include applicable taxes unless stated
 otherwise. We reserve the right to refuse or cancel any order at any time for reasons
 including pricing errors, suspected fraud, or stock unavailability.
 </p>
 <h2>2. Payment</h2>
 <p>
 Payments are processed securely by Stripe. Your order is confirmed only after payment is
 successful.
 </p>
 <h2>3. Shipping & delivery</h2>
 <p>
 See our Shipping Policy for delivery timelines and fees. Risk of loss transfers to the
 customer on delivery.
 </p>
 <h2>4. Warranty</h2>
 <p>
 Each product carries the warranty stated on its page. See the Warranty page for details.
 </p>
 <h2>5. Limitation of liability</h2>
 <p>
 Asif Brothers is not liable for indirect, incidental, or consequential damages arising from
 the use of our products beyond the purchase price of the affected unit.
 </p>
 <h2>6. Governing law</h2>
 <p>These terms are governed by the laws of the Islamic Republic of Pakistan.</p>
 </PolicyPage>
 ),
});
