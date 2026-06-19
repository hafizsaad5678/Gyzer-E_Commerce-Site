import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";

export const Route = createFileRoute("/warranty")({
  head: () => ({ meta: [{ title: "Warranty — Asif Brothers" }, { name: "description", content: "Asif Brothers product warranty terms, coverage, and claim process." }] }),
  component: () => (
    <PolicyPage title="Warranty Information" subtitle="What's covered, for how long, and how to claim.">
      <h2>Coverage period</h2>
      <p>Warranty periods vary by model: electric geysers (5 years), gas geysers (3–4 years), instant geysers (2 years), and solar systems (7 years). The exact period is printed on every product page and on your invoice.</p>
      <h2>What's covered</h2>
      <ul>
        <li>Inner tank against leaks</li>
        <li>Heating element and thermostat (electric/instant)</li>
        <li>Burner assembly and ignition (gas)</li>
        <li>Electronic control board</li>
        <li>Evacuated tubes (solar)</li>
      </ul>
      <h2>What's not covered</h2>
      <ul>
        <li>Damage from voltage surges or improper installation</li>
        <li>Wear items: anode rod, gaskets, decorative panels</li>
        <li>Damage from hard water deposits if descaling was skipped</li>
        <li>Cosmetic damage from transport (report within 48 hours)</li>
      </ul>
      <h2>How to claim</h2>
      <p>Call our support line or open a ticket from your account dashboard. Have your order number ready. Most claims are resolved within 48 hours; in-warranty service is free.</p>
    </PolicyPage>
  ),
});
