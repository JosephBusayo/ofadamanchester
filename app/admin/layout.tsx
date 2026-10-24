import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Ofada admin" },
  robots: { index: false, follow: false },
};

// Admin has no shop header/footer/cart. The signed-in chrome lives in AdminShell.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
