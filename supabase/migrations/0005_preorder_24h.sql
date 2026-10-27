-- Client decision (27 Oct 2026): every order is a pre-order with at least 24 hours' notice.
-- Run in the Supabase SQL editor. Editable later in /admin/settings ("Minimum notice").
alter table public.settings alter column lead_time_minutes set default 1440;
update public.settings set lead_time_minutes = 1440 where lead_time_minutes < 1440;
