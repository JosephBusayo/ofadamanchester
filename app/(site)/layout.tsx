import { Suspense } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header, HeaderWithPathname } from "@/components/Header";
import { CartProvider } from "@/lib/cart";
import { getMenu } from "@/lib/menu/get-menu";

// Public shop chrome: header, footer and cart. The admin area has its own layout.
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  // The drawer re-prices the cart from the menu (never from stored prices).
  const menu = await getMenu();
  return (
    <CartProvider>
      <Suspense fallback={<Header pathname="" />}>
        <HeaderWithPathname />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer menu={menu} />
    </CartProvider>
  );
}
