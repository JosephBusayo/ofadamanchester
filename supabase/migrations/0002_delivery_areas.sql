-- Delivery by postcode district (replaces distance bands).
-- Run once in the Supabase SQL editor after 0001.
--   • delivery_areas: the districts we deliver to. fee_pence null = price from distance.
--   • Distance price = delivery_base_pence for the first delivery_base_km,
--     then delivery_per_km_pence per extra km, rounded up to 50p.
--   • Surcharges: evening (from night_from) and rain (forecast). 0 = off.
--   • delivery_paused: turn off delivery only (pickup still works).

alter table public.settings
  add column delivery_areas jsonb not null default '[]',          -- [{ "district": "M14", "fee_pence": null }, …]
  add column delivery_base_pence int not null default 400 check (delivery_base_pence >= 0),
  add column delivery_base_km numeric(5, 2) not null default 3 check (delivery_base_km >= 0),
  add column delivery_per_km_pence int not null default 100 check (delivery_per_km_pence >= 0),
  add column night_surcharge_pence int not null default 100 check (night_surcharge_pence >= 0),
  add column night_from text not null default '19:00' check (night_from ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  add column rain_surcharge_pence int not null default 100 check (rain_surcharge_pence >= 0),
  add column delivery_paused boolean not null default false,
  add column delivery_paused_message text not null default '';

-- Starter list: central Manchester. Edit in /admin/settings.
update public.settings
set delivery_areas = (
  select jsonb_agg(jsonb_build_object('district', d, 'fee_pence', null))
  from unnest(array['M1','M2','M3','M4','M5','M6','M7','M8','M9','M11','M12','M13','M14','M15','M16','M18','M19','M20','M21','M22','M23']) as d
)
where id;

-- The old delivery_tiers / max_delivery_km columns are no longer read. They're left in
-- place so the live site keeps working until this code is deployed; drop them later with:
--   alter table public.settings drop column delivery_tiers, drop column max_delivery_km;
