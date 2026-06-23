import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { WhatsAppButton } from "./WhatsAppButton";
import { OrderStatusNotifier } from "./OrderStatusNotifier";
import { Toaster } from "sonner";

export function SiteLayout({ children }: { children: ReactNode }) {
 return (
 <div className="flex min-h-screen flex-col">
 <SiteHeader />
 <main className="flex-1">{children}</main>
 <SiteFooter />
 <WhatsAppButton />
 <OrderStatusNotifier />
 <Toaster position="top-center" richColors />
 </div>
 );
}
