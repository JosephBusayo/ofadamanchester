-- Client update (27 Oct 2026): minimum delivery fee £4.50, and 5% off deliveries to
-- far-away areas only. Run after 0002 in the Supabase SQL editor.

alter table public.settings
  add column if not exists delivery_far_km numeric(5, 2) not null default 8 check (delivery_far_km >= 0),
  add column if not exists delivery_far_discount_percent int not null default 5
    check (delivery_far_discount_percent between 0 and 50);

alter table public.settings alter column delivery_base_pence set default 450;
update public.settings set delivery_base_pence = 450 where delivery_base_pence = 400;
