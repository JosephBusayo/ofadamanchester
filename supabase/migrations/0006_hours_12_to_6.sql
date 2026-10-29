-- Client update (29 Oct 2026): open 12:00–18:00 every day. Editable later in /admin/settings.
update public.settings
set opening_hours = (
  select jsonb_object_agg(d::text, jsonb_build_array(jsonb_build_object('open', '12:00', 'close', '18:00')))
  from generate_series(0, 6) as d
)
where id;
