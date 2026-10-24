import { Button, Link, Text } from "@react-email/components";
import { site } from "@/content/site";
import { addressLine, whenLine } from "@/lib/notifications/format";
import type { OrderRecord } from "@/lib/notifications/order-types";
import { formatPence } from "@/lib/pricing";
import { EmailShell, Heading, InfoBox, Kicker, OrderTable, bodyText } from "./parts";
import { email } from "./theme";

export function CustomerOrderConfirmation({ order, pickupAddress }: { order: OrderRecord; pickupAddress: string }) {
  const firstName = order.customerName.split(" ")[0];
  return (
    <EmailShell preview={`Order #${order.number} confirmed — ${whenLine(order)}`}>
      <Kicker>ORDER #{order.number}</Kicker>
      <Heading>THANK YOU, {firstName.toUpperCase()}!</Heading>
      <Text style={bodyText}>
        Your order is confirmed and paid ({formatPence(order.totalPence)}). We&apos;ll have it ready for your{" "}
        {order.fulfilment}.
      </Text>

      <InfoBox title="WHEN & WHERE">
        <Text style={{ ...bodyText, fontWeight: 700 }}>{whenLine(order)}</Text>
        <Text style={{ ...bodyText, margin: 0 }}>{order.fulfilment === "delivery" ? addressLine(order) : pickupAddress}</Text>
      </InfoBox>

      <OrderTable order={order} />

      {order.notes && (
        <InfoBox title="YOUR NOTES">
          <Text style={{ ...bodyText, margin: 0 }}>{order.notes}</Text>
        </InfoBox>
      )}

      <Text style={{ ...bodyText, marginTop: 18 }}>
        Need to change something, or have an allergy we should know about? Message us on WhatsApp and quote{" "}
        <strong>#{order.number}</strong>.
      </Text>
      <Button
        href={site.whatsapp.href}
        style={{
          display: "inline-block",
          backgroundColor: email.primary,
          color: email.onPrimary,
          borderRadius: 999,
          padding: "14px 26px",
          fontSize: 16,
          fontWeight: 600,
          textDecoration: "none",
          marginTop: 6,
        }}
      >
        WHATSAPP {site.whatsapp.display}
      </Button>
      <Text style={{ fontSize: 13, opacity: 0.6, margin: "18px 0 0" }}>
        Follow us on{" "}
        <Link href={site.instagram.href} style={{ color: email.ink }}>
          Instagram {site.instagram.handle}
        </Link>
      </Text>
    </EmailShell>
  );
}
