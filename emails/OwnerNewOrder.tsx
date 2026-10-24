import { Button, Link, Text } from "@react-email/components";
import { addressLine, whenLine } from "@/lib/notifications/format";
import type { OrderRecord } from "@/lib/notifications/order-types";
import { formatPence } from "@/lib/pricing";
import { EmailShell, Heading, InfoBox, Kicker, OrderTable, bodyText } from "./parts";
import { email } from "./theme";

export function OwnerNewOrder({ order, adminUrl, warning }: { order: OrderRecord; adminUrl: string; warning?: string }) {
  const address = addressLine(order);
  return (
    <EmailShell preview={`#${order.number} · ${formatPence(order.totalPence)} · ${whenLine(order)}`}>
      <Kicker>NEW ORDER · PAID</Kicker>
      <Heading>
        #{order.number} · {formatPence(order.totalPence)}
      </Heading>
      <Text style={{ ...bodyText, fontSize: 20, fontWeight: 700 }}>{whenLine(order)}</Text>

      {warning && (
        <InfoBox title="⚠ CHECK THIS ORDER">
          <Text style={{ ...bodyText, margin: 0, color: email.highlight, fontWeight: 600 }}>{warning}</Text>
        </InfoBox>
      )}

      <InfoBox title="CUSTOMER">
        <Text style={{ ...bodyText, fontWeight: 600 }}>{order.customerName}</Text>
        <Text style={bodyText}>
          <Link href={`tel:${order.phone}`} style={{ color: email.ink }}>
            {order.phone}
          </Link>{" "}
          ·{" "}
          <Link href={`mailto:${order.email}`} style={{ color: email.ink }}>
            {order.email}
          </Link>
        </Text>
        {address && (
          <Text style={{ ...bodyText, margin: 0 }}>
            <Link href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} style={{ color: email.ink }}>
              {address}
            </Link>
            {order.distanceKm !== null && ` (≈${order.distanceKm.toFixed(1)} km)`}
          </Text>
        )}
      </InfoBox>

      {order.notes && (
        <InfoBox title="NOTES FROM CUSTOMER">
          <Text style={{ ...bodyText, margin: 0, fontWeight: 600 }}>{order.notes}</Text>
        </InfoBox>
      )}

      <OrderTable order={order} />

      <Button
        href={adminUrl}
        style={{
          display: "inline-block",
          backgroundColor: email.primary,
          color: email.onPrimary,
          borderRadius: 999,
          padding: "14px 26px",
          fontSize: 16,
          fontWeight: 600,
          textDecoration: "none",
          marginTop: 18,
        }}
      >
        OPEN IN ADMIN →
      </Button>
    </EmailShell>
  );
}
