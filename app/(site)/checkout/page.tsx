import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getMenu } from "@/lib/menu/get-menu";
import { getSettings, publicSettings } from "@/lib/settings";
import { isTestMode } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  return <CheckoutForm menu={menu} settings={publicSettings(settings)} testMode={isTestMode()} />;
}
