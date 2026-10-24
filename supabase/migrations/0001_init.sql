-- Ofada Manchester — initial schema.
-- Run in the Supabase SQL editor (or `supabase db push`). Then seed the menu with
-- `npm run db:seed`. Money is stored in pence (integers), never floats.

create extension if not exists "pgcrypto";

-- ───────────────────────── Menu ─────────────────────────

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_pence int not null check (price_pence >= 0),
  image_url text,
  badge text,                                   -- e.g. '#1', 'HOT', 'SAT ONLY'
  allergens text[],                             -- null = not yet confirmed
  available_days int[],                         -- 0 = Sun … 6 = Sat; null = every day
  is_active boolean not null default true,      -- hidden from the menu when false
  sold_out boolean not null default false,      -- shown, but can't be ordered
  is_extra boolean not null default false,      -- can be added to meals as an extra
  accepts_extras boolean not null default false,-- shows the extras picker
  bundle_qty int check (bundle_qty is null or bundle_qty > 1),
  bundle_price_pence int check (bundle_price_pence is null or bundle_price_pence >= 0),
  sort int not null default 0,
  check ((bundle_qty is null) = (bundle_price_pence is null))
);
create index products_category_idx on public.products (category_id, sort);

create table public.option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  slug text not null,
  name text not null,
  required boolean not null default true,
  min_select int not null default 1,
  max_select int not null default 1,
  sort int not null default 0,
  unique (product_id, slug)
);

create table public.options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.option_groups (id) on delete cascade,
  slug text not null,
  name text not null,
  price_delta_pence int not null default 0,
  sort int not null default 0,
  unique (group_id, slug)
);

-- ───────────────────────── Orders ─────────────────────────

create type public.order_status as enum (
  'pending', 'paid', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'
);
create type public.fulfilment as enum ('pickup', 'delivery');

create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number int not null unique default nextval('public.order_number_seq'),
  status public.order_status not null default 'pending',
  fulfilment public.fulfilment not null,
  scheduled_for timestamptz,                    -- null = ASAP
  customer_name text not null,
  email text not null,
  phone text not null,
  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  distance_km numeric(6, 2),
  subtotal_pence int not null,
  delivery_fee_pence int not null default 0,
  total_pence int not null,
  vat_pence int,
  notes text,
  stripe_session_id text unique,
  stripe_payment_intent text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

-- Snapshot of what was bought, so later menu edits never change old orders.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_slug text not null,
  product_name text not null,
  unit_price_pence int not null,
  qty int not null check (qty between 1 and 20),
  options jsonb not null default '[]',          -- [{group, name, price_delta_pence}]
  extras jsonb not null default '[]',           -- [{slug, name, qty, price_pence}]
  line_total_pence int not null
);

-- ───────────────────────── Settings & admins ─────────────────────────

create table public.settings (
  id boolean primary key default true check (id), -- single row
  orders_paused boolean not null default false,
  opening_hours jsonb not null default '{}',       -- { "1": [{"open":"12:00","close":"21:00"}], … }
  lead_time_minutes int not null default 45,
  delivery_tiers jsonb not null default '[]',      -- [{ "max_km": 3, "fee_pence": 350 }, …]
  max_delivery_km numeric(5, 2) not null default 10,
  min_order_delivery_pence int not null default 0,
  pickup_address text not null default ''
);
insert into public.settings (id) values (true);

-- Who may use /admin. Add the owner's login email here.
create table public.admins (
  email text primary key
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where email = auth.jwt() ->> 'email');
$$;

-- ───────────────────────── Row Level Security ─────────────────────────
-- Public (anon) can read the active menu and settings. Orders are only written by
-- the server with the service-role key (which bypasses RLS). Admins can read/update.

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.option_groups enable row level security;
alter table public.options enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;
alter table public.admins enable row level security;

create policy "menu: public read" on public.categories for select using (true);
create policy "menu: public read" on public.products for select using (is_active or public.is_admin());
create policy "menu: public read" on public.option_groups for select using (true);
create policy "menu: public read" on public.options for select using (true);
create policy "settings: public read" on public.settings for select using (true);

create policy "menu: admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "menu: admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "menu: admin write" on public.option_groups for all using (public.is_admin()) with check (public.is_admin());
create policy "menu: admin write" on public.options for all using (public.is_admin()) with check (public.is_admin());
create policy "settings: admin update" on public.settings for update using (public.is_admin()) with check (public.is_admin());

create policy "orders: admin read" on public.orders for select using (public.is_admin());
create policy "orders: admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "order items: admin read" on public.order_items for select using (public.is_admin());

create policy "admins: self read" on public.admins for select using (email = auth.jwt() ->> 'email');
