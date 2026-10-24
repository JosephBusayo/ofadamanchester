import { render } from "@react-email/render";
import { CustomerOrderConfirmation } from "@/emails/CustomerOrderConfirmation";
import { OwnerNewOrder } from "@/emails/OwnerNewOrder";
import { whatsappBody } from "@/lib/notifications/format";
import { sampleOrder } from "@/lib/notifications/sample-order";
import { DEFAULT_SETTINGS } from "@/lib/settings";

// Development-only previews of the notification emails, with a sample order:
//   /dev/emails/customer   /dev/emails/owner   /dev/emails/owner-warning   /dev/emails/whatsapp
export async function GET(_request: Request, { params }: RouteContext<"/dev/emails/[template]">) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const { template } = await params;

  const adminUrl = `/admin/orders/${sampleOrder.id}`;
  const element =
    template === "customer" ? (
      <CustomerOrderConfirmation order={sampleOrder} pickupAddress={DEFAULT_SETTINGS.pickupAddress} />
    ) : template === "owner" ? (
      <OwnerNewOrder order={sampleOrder} adminUrl={adminUrl} />
    ) : template === "owner-warning" ? (
      <OwnerNewOrder order={sampleOrder} adminUrl={adminUrl} warning="Stripe charged £84.00 GBP but the order total is £89.00. Check Stripe before preparing." />
    ) : null;

  if (template === "whatsapp") {
    return new Response(whatsappBody(sampleOrder), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  if (!element) return new Response("Unknown template. Try customer, owner, owner-warning or whatsapp.", { status: 404 });

  return new Response(await render(element), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
