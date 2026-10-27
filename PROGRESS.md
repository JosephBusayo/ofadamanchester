# Ofada Manchester — Progress & Handoff

_Last reviewed: 27 Oct 2026, against commit `e5362d4`._

Build order lives in `CLAUDE.md`. Phases **1–8 are done**. Phase **9** (security pass + go live with payments) is what's left.

## Health check (27 Oct)
- `npm test` — 78/78 passing (pricing, delivery, schedule, order status, notification formatting)
- `npm run lint` — clean
- `npx tsc --noEmit` — clean (run `npx next typegen` first on a fresh clone, or just `npm run build`)
- `npm audit` — 0 vulnerabilities

## Done
**Site & design**
- Next.js 16 + Tailwind 4, all fonts and brown/tan colour tokens
- Home (hero, marquee, manifesto + stickers, polaroids + receipt, bestsellers, story/menu cards)
- Menu page: filter pills with scroll-spy, one repeating category block, item detail pages
- Our Story, Contact, Allergens, Privacy, Terms, Cookies
- Real client photos, logo, founder story, Ofada-on-a-plate banner, turkey/snail/fish photos
- Favicon / Apple touch icon / favicon.ico (leaf mark)
- Mobile checkout + hero fixes

**Ordering**
- Cart drawer (localStorage), options, extras, egg 4-for-£3.50 bundle, MoiMoi Saturday-only rule
- Pickup / delivery, ASAP or scheduled slots inside opening hours, pause-orders block
- Delivery fee by distance (postcodes.io, haversine × 1.3, tiered), min order, max radius
- Guest checkout with Zod validation, all prices recalculated server-side

**Payments (Stripe Checkout, hosted)**
- `createCheckoutAction` saves order as `pending`, builds line items (+ delivery line), 30-min session expiry, idempotency key
- Webhook `/api/stripe/webhook`: signature verified, idempotent pending→paid, handles `completed`, `async_payment_succeeded`, `async_payment_failed`, `expired`
- Amount check: owner email gets a ⚠ warning if Stripe's charge ≠ order total
- Confirmation page `/order/[id]` only shown with matching `session_id`; falls back to asking Stripe if webhook hasn't landed; clears cart once paid

**Notifications**
- Resend customer confirmation + owner new-order email (React Email), idempotent
- Twilio WhatsApp to owner (template SID or free-text sandbox); each channel fails independently
- Dev previews at `/dev/emails/customer|owner|owner-warning|whatsapp` (blocked in production)

**Security headers** (27 Oct)
- CSP, HSTS (prod), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP, no `X-Powered-By` — in `next.config.ts`
- After deploying, check the browser console on home, menu, checkout and /admin for CSP errors

**Removed** (client decision, 27 Oct): footer newsletter form; food hygiene badge (never built, dropped from spec)

**Delivery by postcode area** (27 Oct, branch `delivery-by-postcode`)
- Delivery only to postcode districts listed in /admin/settings; others → WhatsApp +44 7932 541874
- Auto price £4.50 (minimum) for first 3 km + £1/km, rounded up to 50p; or a fixed price per area
- 5% long-distance discount beyond 8 km only (never below £4.50)
- Evening (+£1 from 19:00) and rain (+£1, Open-Meteo forecast) surcharges; pause-delivery-only switch
- **Before merging: run `supabase/migrations/0002_delivery_areas.sql` then `0003_delivery_discount.sql` in the Supabase SQL editor**

**Admin**
- Supabase Auth + TOTP 2FA + `ADMIN_EMAIL` allow-list + RLS `is_admin()`
- Orders by day/status (30s refresh), status flow, order detail, resend confirmation, Stripe link
- Menu sold-out/hidden toggles, settings (pause, hours, prep time, delivery bands, pickup address), test notifications

**Infra (per Joseph)**: Supabase connected, Vercel connected, domain connected.

## Left to do

### Payments — go live
1. **Register the live webhook** in Stripe → Developers → Webhooks: `https://<domain>/api/stripe/webhook`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`. Put its signing secret in Vercel as `STRIPE_WEBHOOK_SECRET`.
2. **Test-mode end-to-end on the real domain first**: pickup order + delivery order with card `4242 4242 4242 4242`; confirm order flips to `paid` in admin, both emails + WhatsApp arrive. Then a declined card (`4000 0000 0000 0002`) and an abandoned session.
3. **Activate the Stripe account** (business details, bank account for payouts, statement descriptor e.g. `OFADA MCR`).
4. **Swap to live keys** in Vercel (Production only): `STRIPE_SECRET_KEY=sk_live_…`, new live `STRIPE_WEBHOOK_SECRET`. Redeploy. Do one real £1-ish order and refund it.
5. Check `NEXT_PUBLIC_SITE_URL` is the real https domain in Production — checkout refuses to start without it.
6. Apple Pay / Google Pay / Link: turn on in Stripe → Payment methods (hosted Checkout needs no domain file).
7. Refunds are manual in the Stripe dashboard (admin "Cancel" reminds you). Optional v2: refund button in admin.
8. Note: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` isn't used by the code (hosted Checkout) — harmless to set.

### Phase 9 — security / QA
- Set `UPSTASH_REDIS_REST_URL/TOKEN` in Vercel — without them rate limits are per-instance memory only.
- Mobile QA at 360px, Lighthouse pass.

### Services to confirm in Vercel env
- Resend: domain verified, `RESEND_API_KEY`, `EMAIL_FROM="Ofada Manchester <orders@domain>"`, `OWNER_EMAIL`
- Twilio: approved WhatsApp template → `TWILIO_WHATSAPP_TEMPLATE_SID` (sandbox only reaches numbers that joined it)
- `KITCHEN_POSTCODE`, `ADMIN_EMAIL`, `VAT_REGISTERED`
- Supabase: sign-ups disabled, owner user + MFA, `insert into admins`, `npm run db:seed` run against prod

### Waiting on the client (`TODO(client)` in code)
- Kitchen/pickup address & postcode, legal trading name (`content/site.ts`)
- Opening hours, lead time, delivery tiers/radius (defaults in `lib/settings.ts`; editable in /admin/settings)
- **Allergens for every item** — all `null` in `lib/menu/seed-data.ts`; legally needed before launch
- Approve home copy, terms/privacy text, catering line on Contact

## Running locally on a new device
```bash
git clone https://github.com/JosephBusayo/ofadamanchester && cd ofadamanchester
npm ci
npx vercel link && npx vercel env pull .env.local   # pulls the env vars you already set in Vercel
npm run dev
# Webhooks locally:
stripe listen --forward-to localhost:3000/api/stripe/webhook   # use the whsec_ it prints as STRIPE_WEBHOOK_SECRET in .env.local
```
