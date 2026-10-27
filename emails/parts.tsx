import { Body, Column, Container, Head, Hr, Html, Img, Preview, Row, Section, Text } from "@react-email/components";
import { itemDetails } from "@/lib/notifications/format";
import type { OrderRecord } from "@/lib/notifications/order-types";
import { formatPence } from "@/lib/pricing";
import { email } from "./theme";

// Email images need an absolute URL: the deployed site serves /brand/logo-cream.png.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ofadamanchester.com").replace(/\/$/, "");

export function EmailShell({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="en-GB">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Loads in Apple Mail / iOS; other clients fall back to Arial. (Email HTML, not a Next page.) */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Bowlby+One+SC&family=Oswald:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "24px 0", backgroundColor: email.bg, fontFamily: email.font, color: email.ink }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: email.primary, borderRadius: "24px 24px 0 0", padding: "22px 28px" }}>
            <Img
              src={`${SITE_URL}/brand/logo-cream.png`}
              width={150}
              height={49}
              alt="Ofada Manchester"
              style={{ display: "block", fontFamily: email.heading, fontSize: 24, color: email.onPrimary }}
            />
          </Section>
          <Section
            style={{
              backgroundColor: email.white,
              border: `2px solid ${email.ink}`,
              borderTop: 0,
              borderRadius: "0 0 24px 24px",
              padding: "28px",
            }}
          >
            {children}
          </Section>
          <Text style={{ textAlign: "center", fontSize: 13, lineHeight: "20px", color: email.ink, opacity: 0.6, margin: "18px 0 0" }}>
            Ofada Manchester · A Taste of Home, Delivered Fresh
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ margin: "0 0 6px", fontFamily: email.heading, fontSize: 32, lineHeight: "34px", letterSpacing: "-1px", color: email.ink }}>
      {children}
    </Text>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, letterSpacing: "1px", color: email.highlight }}>
      {children}
    </Text>
  );
}

export function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Section style={{ backgroundColor: email.bgAlt, borderRadius: 18, padding: "16px 20px", margin: "18px 0" }}>
      <Text style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, letterSpacing: "1px" }}>{title}</Text>
      {children}
    </Section>
  );
}

export const bodyText = { margin: "0 0 6px", fontSize: 16, lineHeight: "24px" } as const;

export function OrderTable({ order }: { order: OrderRecord }) {
  const row = (label: string, value: string, bold = false) => (
    <Row>
      <Column style={{ fontSize: bold ? 18 : 15, fontWeight: bold ? 700 : 400, padding: "4px 0" }}>{label}</Column>
      <Column align="right" style={{ fontSize: bold ? 18 : 15, fontWeight: bold ? 700 : 600, padding: "4px 0", whiteSpace: "nowrap" }}>
        {value}
      </Column>
    </Row>
  );
  return (
    <Section>
      {order.items.map((item, i) => {
        const details = itemDetails(item);
        return (
          <Row key={i} style={{ borderBottom: `1px solid ${email.bgAlt}` }}>
            <Column style={{ padding: "10px 0" }}>
              <Text style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                {item.qty} × {item.name}
              </Text>
              {details && <Text style={{ margin: "2px 0 0", fontSize: 14, opacity: 0.65 }}>{details}</Text>}
            </Column>
            <Column align="right" style={{ padding: "10px 0", fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", verticalAlign: "top" }}>
              {formatPence(item.lineTotalPence)}
            </Column>
          </Row>
        );
      })}
      <Hr style={{ borderColor: email.ink, margin: "8px 0" }} />
      {row("Subtotal", formatPence(order.subtotalPence))}
      {row("Delivery", order.deliveryFeePence ? formatPence(order.deliveryFeePence) : "Free")}
      {row("Total paid", formatPence(order.totalPence), true)}
      {order.vatPence !== null && (
        <Text style={{ margin: 0, textAlign: "right", fontSize: 13, opacity: 0.6 }}>Includes VAT of {formatPence(order.vatPence)}</Text>
      )}
    </Section>
  );
}
