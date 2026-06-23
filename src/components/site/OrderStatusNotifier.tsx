/**
 * OrderStatusNotifier
 * Subscribes to real-time order status changes for the signed-in user
 * and shows a toast notification when their order status updates.
 *
 * Mount this once inside SiteLayout (or the authenticated layout).
 */
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Package, Truck, CheckCircle2, XCircle } from "lucide-react";

const STATUS_MESSAGES: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
 paid: {
 title: "Payment confirmed",
 desc: "Your payment has been received. We're preparing your order.",
 icon: <CheckCircle2 className="h-4 w-4 text-success" />,
 },
 processing: {
 title: "Order in progress",
 desc: "Your geyser is being prepared for dispatch.",
 icon: <Package className="h-4 w-4 text-copper" />,
 },
 shipped: {
 title: "Your order is on the way!",
 desc: "Your geyser has been shipped. Expect delivery in 1-3 days.",
 icon: <Truck className="h-4 w-4 text-primary" />,
 },
 delivered: {
 title: "Order delivered",
 desc: "Your order has been delivered. Enjoy your new geyser!",
 icon: <CheckCircle2 className="h-4 w-4 text-success" />,
 },
 cancelled: {
 title: "Order cancelled",
 desc: "Your order has been cancelled. Contact us if this is a mistake.",
 icon: <XCircle className="h-4 w-4 text-destructive" />,
 },
 refunded: {
 title: "Refund processed",
 desc: "Your refund has been processed.",
 icon: <XCircle className="h-4 w-4 text-destructive" />,
 },
};

export function OrderStatusNotifier() {
 useEffect(() => {
 let isMounted = true;
 let channel: ReturnType<typeof supabase.channel> | null = null;

 supabase.auth.getSession().then(({ data }) => {
 if (!isMounted || !data.session) return;
 const userId = data.session.user.id;

 channel = supabase
 .channel(`order-updates-${userId}`)
 .on(
 "postgres_changes",
 {
 event: "UPDATE",
 schema: "public",
 table: "orders",
 filter: `user_id=eq.${userId}`,
 },
 (payload) => {
 const newStatus = payload.new?.status as string;
 const orderNum = payload.new?.order_number as string;
 const msg = STATUS_MESSAGES[newStatus];
 if (!msg) return;

 toast(msg.title, {
 description: `Order ${orderNum} — ${msg.desc}`,
 icon: msg.icon,
 duration: 8000,
 action: {
 label: "View order",
 onClick: () => {
 window.location.href = "/account/orders";
 },
 },
 });
 },
 )
 .subscribe();
 });

 return () => {
 isMounted = false;
 if (channel) supabase.removeChannel(channel);
 };
 }, []);

 return null; // renders nothing — side-effects only
}
