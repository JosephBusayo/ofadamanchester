import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWs = supabaseUrl.replace(/^https:/, "wss:");

// Content Security Policy.
// - Fonts are self-hosted by next/font and images are local, so almost everything is 'self'.
// - Payment happens on Stripe's hosted Checkout page (a full redirect), so no Stripe
//   scripts or frames are loaded here; checkout.stripe.com is only a navigation/form target.
// - 'unsafe-inline' for scripts is needed by Next's inline bootstrap scripts unless every
//   page uses per-request nonces (which would disable static rendering). There is no
//   user-generated HTML anywhere on the site, so the XSS surface this leaves is small.
// - 'unsafe-eval' only in dev (React's dev tooling needs it).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:" + (supabaseUrl ? ` ${supabaseUrl}` : ""),
  "font-src 'self' data:",
  `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl} ${supabaseWs}` : ""}${isDev ? " ws: http://localhost:*" : ""}`,
  "form-action 'self' https://checkout.stripe.com",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // 2 years, subdomains, eligible for the browser preload list.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      // Only the Tailwind entry file — a "*.css" rule would turn *.module.css into global CSS.
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
