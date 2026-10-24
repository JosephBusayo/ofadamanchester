import type { Metadata } from "next";
import { site } from "@/content/site";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
