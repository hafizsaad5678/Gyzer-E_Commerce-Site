import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ShieldCheck, Truck, Wrench, Award, Users, Factory } from "lucide-react";

export const Route = createFileRoute("/about")({
    head: () => ({
        meta: [
            { title: "About Asif Brothers 25+ Years of Heating Pakistan" },
            {
                name: "description",
                content:
                    "Asif Brothers has been engineering reliable geysers for Pakistani homes since 1998. Learn our story, mission, and values.",
            },
            { property: "og:title", content: "About Asif Brothers" },
        ],
    }),
    component: About,
});

function About() {
    return (
        <SiteLayout>
            <section className="container-page py-16 md:py-24">
                <div className="max-w-3xl">
                    <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-3">
                        About us
                    </div>
                    <h1 className="text-display text-4xl md:text-6xl mb-6">
                        25+ years of warm water  and warmer service.
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Asif Brothers was founded in Lahore in 1998 by two brothers who believed every Pakistani
                        home deserved reliable hot water without paying import-brand prices. Today we
                        engineer, manufacture, and service over a dozen geyser models trusted by 50,000+
                        families across the country.
                    </p>
                </div>
            </section>

            <section className="bg-steel/30 border-y border-border">
                <div className="container-page py-16 grid md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: Factory,
                            title: "Built in Pakistan",
                            body: "Our Lahore facility manufactures every Asif Brothers geyser end-to-end from tank welding to final QC.",
                        },
                        {
                            icon: ShieldCheck,
                            title: "Tested for our climate",
                            body: "Hard water, voltage fluctuations, load shedding we test for the conditions Pakistani homes actually face.",
                        },
                        {
                            icon: Users,
                            title: "Service that shows up",
                            body: "Authorized service centers in 14 cities. Most warranty calls resolved within 48 hours.",
                        },
                    ].map((c) => (
                        <div key={c.title} className="surface-card p-7">
                            <c.icon className="h-7 w-7 text-copper mb-4" />
                            <h3 className="text-display text-xl mb-2">{c.title}</h3>
                            <p className="text-sm text-muted-foreground">{c.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="container-page py-16 md:py-24 grid md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-display text-3xl mb-4">Our mission</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        To be the most trusted name in Pakistani water heating by combining honest pricing,
                        engineering quality, and a service network that actually answers the phone.
                    </p>
                </div>
                <div>
                    <h2 className="text-display text-3xl mb-4">By the numbers</h2>
                    <dl className="grid grid-cols-2 gap-6">
                        {[
                            { n: "25+", l: "Years in business" },
                            { n: "50K+", l: "Geysers installed" },
                            { n: "14", l: "Service cities" },
                            { n: "98%", l: "Warranty satisfaction" },
                        ].map((s) => (
                            <div key={s.l}>
                                <dt className="text-display text-3xl text-copper">{s.n}</dt>
                                <dd className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                                    {s.l}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* PAYMENT PROCESS */}
            <section className="bg-steel/30 border-y border-border">
                <div className="container-page py-16 md:py-24 max-w-4xl text-center mx-auto">
                    <div className="text-xs uppercase tracking-wider text-copper font-semibold mb-3">
                        How Payment Works
                    </div>
                    <h2 className="text-display text-3xl md:text-4xl mb-6">
                        Simple, secure offline payments.
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-10">
                        To save you from hidden credit card fees, we've designed a manual payment workflow
                        tailored for Pakistani homes. When you place an order, you can choose from Cash on
                        Delivery, Bank Transfer, Easypaisa, or JazzCash.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-6 text-left">
                        <div className="surface-card p-6">
                            <div className="inline-grid h-10 w-10 place-items-center rounded-full bg-copper/15 text-copper mb-4 text-lg font-bold">
                                1
                            </div>
                            <h3 className="font-semibold mb-2">Place Order</h3>
                            <p className="text-sm text-muted-foreground">
                                Select your preferred offline payment method at checkout and place the order.
                            </p>
                        </div>
                        <div className="surface-card p-6">
                            <div className="inline-grid h-10 w-10 place-items-center rounded-full bg-copper/15 text-copper mb-4 text-lg font-bold">
                                2
                            </div>
                            <h3 className="font-semibold mb-2">Send Payment</h3>
                            <p className="text-sm text-muted-foreground">
                                Transfer the funds via your banking app, Easypaisa, or JazzCash (skip this for COD).
                            </p>
                        </div>
                        <div className="surface-card p-6">
                            <div className="inline-grid h-10 w-10 place-items-center rounded-full bg-copper/15 text-copper mb-4 text-lg font-bold">
                                3
                            </div>
                            <h3 className="font-semibold mb-2">Verify via WhatsApp</h3>
                            <p className="text-sm text-muted-foreground">
                                WhatsApp us your transaction receipt. We'll verify the funds and ship your geyser!
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
