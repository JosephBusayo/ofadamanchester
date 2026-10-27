-- New photos (27 Oct 2026): the Ofada Box card uses the open-box cut-out that used to be
-- the home hero. Data-only; safe to re-run.
update public.products
set image_url = '/images/product-ofada-box-cutout.webp'
where slug = 'ofada-box';
