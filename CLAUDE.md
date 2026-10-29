# Ofada Manchester — Online Ordering Website

## Project Overview
Website for **Ofada Manchester**, a Nigerian food business in Manchester, UK
("A Taste of Home, Delivered Fresh"). Customers browse the full menu, build a cart,
choose **pickup or delivery**, pay online with Stripe, and get a confirmation email.
The owner gets an **email + WhatsApp** alert for every paid order and manages
orders in a private admin area.

- Reference design: https://ofada.framer.website/ (Framer template, currently "GRIDDLE")
- Contact: WhatsApp +44 7932 541874 · Instagram @ofadamanchester
- Tagline: "Authentic. Fresh. Delicious."
- Images and logo: **not supplied yet** — use clearly-marked placeholders
  (`/public/placeholders/*`) sized to the same aspect ratios as the Framer images.

---

## Design Rules — CRITICAL
- Replicate the Framer design's **layout, spacing, typography, components and
  animations** exactly. Only **content, images, business name and colours** change.
- Reference screenshots live in `/design`. When unsure, match the screenshot — do not
  invent new UI. Screenshots show the Framer template's red/yellow colours and burger
  content: copy **layout only**, and take colours from the tokens below.
- **Multi-part sections:** a section too tall for one screenshot is split into files
  with `-top-view`, `-bottom-view` (and `-middle-view` etc. if needed) in the name.
  These are **one continuous section** — stitch them top→bottom and build a single
  component; never treat them as separate sections or duplicate overlapping content.
- **Ignore Framer UI in screenshots**: the round grey pencil (edit) icon on the right
  edge and the "Made in Framer" badge at the bottom are Framer preview overlays,
  not part of the design. Never build them.
- File naming: `<page>-<section>[-<part>-view]-<desktop|mobile>.png`. Part names appear
  as both `-top-view` and `-topview` (same meaning). `part1`/`part2` are separate sections.
- **Only desktop + mobile were captured — no tablet.** Derive tablet (768–1024px) from
  the two: keep the desktop structure, scale type/spacing between the two, and use
  in-between column counts (e.g. 4 cols → 2, 2 cols → 2, 1 col stays 1).
- **Shared on every page:** navbar (`navbar-desktop`, `Navbar-mobile`) and footer
  (`home-footer-desktop`, `footer-mobile`) — build once in the root layout.
  Each page has its **own hero** (different layout per page) — see below.
- Screenshots are static. For animations (marquees, scroll-reveal text, polaroid
  click-through, receipt printing, sticker hovers, scroll-spy) inspect the live
  reference site and replicate the motion; respect `prefers-reduced-motion`.

**Screenshot inventory (top → bottom per page)**
- **Home `/`**
  1. Hero — `home-hero-desktop`, `hero-desktop-mobile` (= home hero, mobile)
  2. Marquee — `home-marquee-desktop`, `hero-marquee-mobile` (= home marquee, mobile)
  3. Manifest/stickers — `home-manifeststicker-*`: giant scrolling words + quote with scroll
     reveal (grey → dark) + sticker badges + "READ OUR STORY"
  4. Receipt — `home-receipt-top-view-*` + `home-receipt-bottom-view-*`: polaroid stack +
     "MADE TO BE SHARED" receipt (one section)
  5. Bestsellers — `home-bestsellers-top-view-*` + `-bottom-view-*` (one section)
  6. Story & Menu cards — `home-story-and-menu-*`
- **Menu `/menu`** — `menu-hero-*` (eyebrow "OUR MENU" + big headline + wide image),
  `menu-filter-*`, category blocks `menu-burger/chicken/fries-*` (see Menu page rules)
- **Our Story `/our-story`** — `ourstory-hero-*` (wide image with title overlay),
  `ourstory-part1-*` (mobile: topview + bottomview), `ourstory-part2-*` (mobile: topview + bottomview)
- **Contact `/contact`** — `contact-hero-*` (mobile: topview + bottomview),
  `contact-cta-*`. (`contact-imagesection-*` removed — client decision, 29 Oct.)
- **No Framer design** for: item detail, cart drawer, checkout, order confirmation,
  allergen/legal pages, admin. Build these from the existing components, tokens and
  type scale so they look native to the site — no new visual language.
- Menu page (`/menu`) screenshots: `menu-hero`, `menu-filter`, `menu-burger`,
  `menu-chicken`, `menu-fries` (desktop) + `menu-hero-mobile`, `menu-filter-mobile`.
  - The burger/chicken/fries screenshots are **examples of one repeating category
    block** — the template has more categories, none were screenshotted because they
    are identical. Build **one `MenuCategory` component** and render it once per
    Ofada category from the data; never hard-code per-category markup.
  - Category block: big heading (category name) + grid of product cards. Card = rounded
    tile in `--bg-alt` with the product image centred, optional round badge top-left
    (`#1`, `HOT`, … in `--primary`), product name (Oswald), price in `--primary`.
    Card click opens the item detail (options, add-ons, allergens, Add to cart).
  - Grid: **4 cards per row on desktop**, **3 on tablet** (measured on the live Framer site),
    stacked **1 per row (vertical) on mobile**. (Home bestsellers use 2 per row on tablet.)
  - **Filter pills** (sticky under the nav): one pill per category, active pill filled
    `--primary` with `--on-primary` text, others outlined. Clicking a pill smooth-scrolls
    to that category. **Scroll-spy:** as the user scrolls, the active pill updates
    automatically to the category currently in view (IntersectionObserver), and the
    active pill scrolls into view in the row. On mobile the pill row scrolls
    horizontally (no wrap, no visible scrollbar).
  - Ofada categories, in order: The Ofada Box · Ofada Meals · Take the Sauce Home ·
    Protein Add-ons · Sides. Badges: Ofada Box `#1`, Sauce `HOT`; MoiMoi shows a
    "Saturdays only" badge.
- The menu image the colours come from is `/design/reference/ofada-menu.jpg`.
- Mobile responsive at all widths; no horizontal scroll at 360px.
- All text comes from `/content/*.ts` (or the database), never hard-coded in components.

### Fonts (keep exactly — load with `next/font/google`)
| Role | Font | Used for |
|---|---|---|
| Display headlines | **League Gothic** 400 | Hero ("SMASHED. SEARED. SERVED."), section titles (124–136px desktop) |
| Primary UI / body | **Oswald** 300–700 | Nav, buttons, body copy, product names, prices |
| Wordmark | **Bowlby One SC** 400 | Logo text until the real logo arrives |
| Receipt / labels | **Space Mono** 400/700 | Receipt card, small labels, order numbers |
| Sticker accents | **Knewave**, **Permanent Marker** | "#1", "NEW", "HOT" stickers, handwritten photo captions |
| Fallback | Inter | — |

### Colours
The Framer template is red/yellow/cream. **Brown replaces red as the main colour**,
tan replaces yellow. All values were sampled from Ofada's printed menu
(`/design/reference/ofada-menu.jpg`). Define them as CSS variables + Tailwind theme
tokens and use only tokens in components — no raw hex, no leftover red/yellow.

| Token | Framer original | Ofada (from menu) | Usage |
|---|---|---|---|
| `--bg` | `#FAF3E6` cream | `#F9F1E3` cream | Page background |
| `--bg-alt` | `#EDE6D7` | `#F1E2C8` light tan | Alternate sections, cards |
| `--primary` | `#DA0711` red | `#3E1A0A` chocolate brown | Everything that is red in Framer: buttons, marquee band, stars, highlighted words ("SHARED", "SEARED"), "PAID" stamp, outlines |
| `--primary-light` | — | `#5A2E14` | Hover states, gradient highlights on brown panels |
| `--primary-dark` | — | `#2A1006` | Pressed states, footer |
| `--accent` | `#FFD21F` yellow | `#EBCFA8` tan | Everything that is yellow in Framer: stickers, badges, price pills, tape on polaroids |
| `--ink` | `#111111` | `#2A1006` near-black brown | Main text, dark stickers |
| `--on-primary` | `#FAF3E6` | `#F9F1E3` | Text on brown |
| `--on-accent` | `#111111` | `#3E1A0A` | Text on tan (as on the menu's label pills) |
| `--white` | `#FFFFFF` | `#FFFFFF` | Cards, polaroids |
| `--highlight` | `#DA0711` red (as text) | `#9C5A2B` caramel | Red **text** in Framer: highlighted words ("SAUCED.", "SHARED"), prices. `--primary` is too close to `--ink` to read as a highlight |
| `--paper` | `#FFFDF8` | `#FFFDF8` | Receipt paper |

Rule of thumb: red **fills/borders** → `--primary`; red **text** → `--highlight`.
Extra font: **Anton** 400 for the receipt "PAID" stamp (as in Framer).

### Page / section mapping (Framer → Ofada)
| Framer section | Ofada content |
|---|---|
| Nav: HOME · MENU · OUR STORY · CONTACT · ORDER NOW | Same, plus cart icon with item count. ORDER NOW → `/menu` |
| Hero "SMASHED. SEARED. SERVED." | e.g. "WRAPPED. SAUCED. SERVED." + Ofada Box photo |
| Scrolling marquee (★ separated) | OFADA BOX ★ OFADA RICE ★ CLASSIC SAUCE ★ FRIED PLANTAIN ★ MOIMOI |
| Quote block + "READ OUR STORY" | Owner's story (copy to be supplied) |
| Polaroid photo stack ("click for more ↻") | Customer / food photos with handwritten captions |
| Receipt animation ("GOOD FOOD ✓ … PAID") | Keep — swap to Ofada name, Manchester address, "A TASTE OF HOME" |
| OUR BESTSELLERS (4 cards, "#1", "HOT" badges) | Ofada Box (#1), Regular Pack, Large Pack, Sauce 1L (HOT) — all with **Add to cart** |
| Footer (address, quick links, social, newsletter) | Manchester details, WhatsApp, Instagram. **Newsletter removed** (client decision) |
| "ORDER GRIDDLE" modal (Uber Eats / DoorDash links) | **Replace** with our own cart drawer + checkout |

---

## Tech Stack
- **Next.js — latest stable** (App Router, Server Actions, TypeScript strict)
- **Tailwind CSS** (theme tokens above)
- **Stripe Checkout** (hosted page — card, Apple Pay, Google Pay, Link)
- **Supabase** — Postgres database + Auth (owner login only) + Row Level Security
- **Resend** + React Email — transactional emails
- **Twilio WhatsApp API** — owner notifications
- **Upstash Redis** (`@upstash/ratelimit`) — rate limiting
- **Zod** — validation on every server input
- **postcodes.io** (free, no key) — UK postcode → lat/lng for delivery fee
- Hosting: **Vercel**; all secrets in environment variables

---

## Menu & Data Model
Menu has ~15 orderable items with options, add-ons and availability rules — **not
3 products**. Seed the database with exactly this (prices in pence):

**The Ofada Box — £26.00** — 2 wraps Ofada rice + classic sauce + 1 boiled egg +
2 proteins + 6–8 pieces fried plantain.
Required choice: `1 Turkey + 1 Beef` | `2 Turkey` | `2 Beef`.

**Ofada Meals** (each with rice wrapped in leaf, classic sauce & boiled egg)
| Item | Contents | Price |
|---|---|---|
| Ofadà Mini Pack | 1 wrap + sauce + 1 egg | £10.00 |
| Ofadà Regular Pack | 2 wraps + sauce + 1 egg | £15.00 |
| Ofadà Large Pack | 4 wraps + large sauce + 2 eggs | £26.00 |

**Take the Sauce Home** (classic Ofada sauce with diced assorted; rice & extra protein not included)
750ml £17 · 1 Litre £20 · 2 Litres £39 · 5 Litres £95 → one product, required size option.

**Protein add-ons** — can be added to any meal *or* bought alone
Fried Turkey £2.50 · Fried Fish £2.50 · Snail £5.00 ·
Extra Boiled Egg £1.00 each, **4 for £3.50** (bundle price applied automatically per 4).

**Sides**
MoiMoi £3.00 (**Saturdays only**) · Fried Plantain (6–8 pcs) £2.00 · Extra Wrap of Ofada Rice £3.00

### Tables (Supabase) — schema in `supabase/migrations/0001_init.sql`
- Menu source of truth for seeding: `lib/menu/seed-data.ts` → `npm run db:seed`.
  `lib/menu/get-menu.ts` reads Supabase, or falls back to the seed data when Supabase env vars are missing.
- `categories` (id, slug, name, sort)
- `products` (id, category_id, slug, name, description, price_pence, image_url, badge,
  allergens text[] (null = unconfirmed), available_days int[] (null = every day), is_active,
  sold_out, is_extra, accepts_extras, bundle_qty, bundle_price_pence, sort)
- `option_groups` (id, product_id, slug, name, required, min_select, max_select) → `options` (id, group_id, slug, name, price_delta_pence)
- **Protein add-ons are products with `is_extra = true`** (no separate addons table): they're
  sold on their own in the "Protein Add-ons" category *and* offered as extras on any product
  with `accepts_extras = true` (Ofada Box, meal packs). Egg deal = `bundle_qty 4 / bundle_price_pence 350`.
- `admins` (email) — who can use /admin; RLS helper `is_admin()`
- `orders` (id, order_number, status, fulfilment `pickup|delivery`, scheduled_for,
  customer_name, email, phone, address_line1, address_line2, city, postcode,
  distance_km, subtotal_pence, delivery_fee_pence, total_pence, vat_pence,
  notes, stripe_session_id unique, stripe_payment_intent, created_at, paid_at)
- `order_items` (id, order_id, product_name, unit_price_pence, qty, options jsonb,
  addons jsonb, line_total_pence) — **snapshot names/prices** so old orders never change
- `settings` (single row: orders_paused, opening_hours jsonb, lead_time_minutes,
  min_order_delivery_pence, pickup_address, + delivery columns from `0002_delivery_areas.sql`:
  delivery_areas jsonb, delivery_base_pence, delivery_base_km, delivery_per_km_pence,
  night_surcharge_pence, night_from, rain_surcharge_pence, delivery_paused, delivery_paused_message,
  delivery_far_km, delivery_far_discount_percent from `0003`)

RLS: public can `select` active menu + settings only. Orders are written **only by
the server** using the service-role key. Only the owner's user can read/update orders.

---

## Features Required
1. **Menu page** — all categories/items from the DB, styled like Framer's menu/bestseller cards.
   Item detail page/modal for option choice + add-ons + allergens.
2. **Cart** — slide-out drawer (replaces the Framer "ORDER" modal); persists in
   localStorage; edit qty/options; shows subtotal.
3. **Pickup or delivery** choice, then **date & time slot** within opening hours.
   **Pre-order only (client decision):** at least 24 hours' notice (`lead_time_minutes` = 1440,
   "Minimum notice" in /admin/settings), no ASAP; customers can book up to a week ahead.
   Shown on the menu page and at checkout. MoiMoi only selectable when the chosen date is a Saturday.
4. **Delivery fee by postcode area** (see below). Pickup = £0.
5. **Checkout** — guest only: name, email, UK mobile, address (delivery only), notes.
   Server recalculates everything, creates the order (`pending`) and a Stripe Checkout Session.
6. **Stripe payment** — webhook `checkout.session.completed` marks order `paid`.
7. **Customer confirmation email** (order number, items, fulfilment time, pickup
   address or delivery address, total) + on-screen confirmation page.
8. **Owner notifications** — email + WhatsApp on every paid order.
9. **Admin** (`/admin`, owner only) — today's orders, filter by date/status,
   status flow `paid → preparing → ready/out for delivery → completed` (+ `cancelled`),
   order detail, toggle "pause orders" / "pause delivery", edit item availability / sold-out, edit hours, delivery areas & prices.
10. **Allergens** — show the 14 UK allergens per item before purchase; "allergen info" link on every page.
11. **Opening hours & cut-offs** — checkout blocked outside hours or when paused; clear message shown.

### Accounts — decision: Guest checkout only
- Customers do **not** create accounts. Stripe Checkout collects/validates email and
  card; Stripe Link + Apple/Google Pay remember payment details, so repeat orders are
  still fast. Best UX for a small takeaway and no customer passwords to store.
- Optional v2: "order again" link in the confirmation email.
- **Owner login**: Supabase Auth (email + password, MFA enabled), sign-up disabled.
  Middleware protects `/admin/**`; server checks `user.email === ADMIN_EMAIL` on every
  admin action as well as RLS.
  - Implemented: `proxy.ts` (Next 16's middleware) refreshes the session and redirects
    signed-out visitors; `requireAdmin()` (`lib/admin/auth.ts`) is called by **every** admin
    page and server action and requires: signed in + email in `ADMIN_EMAIL` (comma-separated)
    + authenticator-app 2FA (aal2). Admin queries use the user's session, so RLS
    (`is_admin()` → `admins` table) is a second lock.
  - One-time setup: in Supabase → Authentication, **disable sign-ups**, create the owner's
    user (email + password), enable TOTP MFA; then in the SQL editor
    `insert into admins (email) values ('owner@example.com');` and set `ADMIN_EMAIL`.
    First sign-in at `/admin/login` shows a QR code to scan with an authenticator app.
  - Admin pages: `/admin` (orders by day + status, auto-refresh 30s), `/admin/orders/[id]`
    (status flow, resend confirmation, Stripe link), `/admin/menu` (sold out / hidden),
    `/admin/settings` (pause orders, pause delivery, hours, minimum notice, delivery areas/prices/surcharges, pickup address).

### Delivery fee — by postcode area (client decision, 27 Oct 2026)
The owner isn't on Uber Eats/Direct, so no courier API. Instead:
- **Coverage = a list of postcode districts** (`settings.delivery_areas`, e.g. M14, SK4) edited in
  `/admin/settings`. Customer postcode → district (`M14 5RG` → `M14`). Not on the list →
  "message us on WhatsApp" with a link to the business WhatsApp **+44 7932 541874** (`site.whatsapp`, used site-wide).
- **Price per area**: a fixed price, or (if empty) automatic from distance — **£4.50 (the minimum)
  covers the first 3 km, then £1.00 per extra km**, rounded up to 50p (all editable). Distance = kitchen
  (`KITCHEN_POSTCODE`) → customer postcode via postcodes.io, haversine × 1.3.
- **Long-distance discount**: 5% off the delivery price only beyond `delivery_far_km` (default 8 km),
  never below £4.50, shown as its own line. No discount anywhere else (client decision).
- **Surcharges** (0 = off): evening from `night_from` (default 19:00, +£1) and rain (+£1) when the
  Open-Meteo forecast (free, no key) shows ≥ 0.5 mm/h at the delivery slot. Weather failure = no charge.
- **Pause delivery only** toggle + customer message (bad weather, no driver); pickup still works.
- Minimum order for delivery kept.
- Fee shown before payment with its breakdown, and as a separate Stripe line item.
- Pure logic + tests: `lib/delivery.ts`. Weather: `lib/weather.ts`. Schema: `supabase/migrations/0002_delivery_areas.sql` + `0003_delivery_discount.sql`.

### VAT
- Menu prices are **VAT-inclusive** — never add 20% on top.
- `VAT_REGISTERED=false` (default): no VAT shown.
- `VAT_REGISTERED=true`: show "Includes VAT £x.xx" (total ÷ 6) on receipt/email and store `vat_pence`.

---

## Security Requirements
- No secret keys in client code; only `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` may be public.
- **All prices, fees and totals calculated server-side from the DB.** Client sends only
  product IDs, option IDs, add-on IDs, quantities, fulfilment and address.
- Stripe webhook signature verified; webhook handler idempotent (unique `stripe_session_id`,
  only notify when status changes `pending → paid`).
- Zod validation on all inputs (UK postcode, UK phone `+44`, email, qty 1–20, notes ≤ 300 chars).
- Rate limit checkout + delivery-quote endpoints (e.g. 10 requests / 10 min per IP).
- Supabase RLS on every table; service-role key used only in server code.
- Security headers (CSP, HSTS, X-Frame-Options) via `next.config`. **Done** — `headers()` in `next.config.ts`.
  If you add a third-party script, image host or iframe, add its origin to the CSP there.
- Escape all user text in emails/admin; no `dangerouslySetInnerHTML`.

---

## Notifications
- **Resend**: from `orders@<domain>` (domain must be verified). Templates:
  `CustomerOrderConfirmation`, `OwnerNewOrder`.
- **Twilio WhatsApp** to `OWNER_WHATSAPP` (+447932541874). Business-initiated messages
  need an **approved WhatsApp template** (e.g. "New order {{1}} – {{2}} – £{{3}} – {{4}}").
  Use the Twilio sandbox during development. If WhatsApp fails, still send email and log the error.

---

## Environment Variables
```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
OWNER_EMAIL=
ADMIN_EMAIL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
TWILIO_WHATSAPP_TEMPLATE_SID=
OWNER_WHATSAPP=+447932541874
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
KITCHEN_POSTCODE=
VAT_REGISTERED=false
```
Commit a `.env.example` with these names and no values.

---

## Legal / UK pages
- Allergen information page (14 allergens per item) + "Ask us about allergens before ordering" note.
- Privacy policy (UK GDPR), Terms & refund/cancellation policy, cookie notice
  (only essential cookies in v1 → no consent banner needed).
- Business name and contact details in footer.
- No food hygiene rating badge (client decision).

---

## Build Order (for Claude Code — one phase at a time, verify before moving on)
1. Scaffold Next.js + Tailwind, fonts, colour tokens, layout shell (nav + footer).
2. Rebuild **home page** section by section against `/design` screenshots (static content).
3. Supabase schema + seed menu + menu page + item detail.
4. Cart drawer + pricing engine (shared `lib/pricing.ts`, unit-tested: options, add-ons,
   egg bundle, Saturday rule, delivery tiers).
5. Checkout form + delivery quote + Stripe Checkout (test mode).
6. Webhook → order paid → Resend emails → Twilio WhatsApp.
7. Admin login + orders dashboard + settings.
8. Our Story, Contact, allergen & legal pages.
9. Security pass, rate limiting, mobile QA, Lighthouse, deploy to Vercel, Stripe live keys.

---

## Open Questions for the Client
- Kitchen pickup address (postcode decided: M7 2BA, Salford); final delivery area list.
- Max orders per slot. (Decided: 24 hours' notice; open 12:00–18:00 every day.)
- VAT registered? (Yes/No)
- Allergens for every item (sauce, MoiMoi, fried fish, etc.).
- Sending email address (domain decided: ofadamanchester.com; contact email hello@ofadamanchester.com).
- Confirm brown/tan colour hex codes, final logo, photos, Our Story copy.
- Can protein add-ons be bought on their own, or only with a meal?
