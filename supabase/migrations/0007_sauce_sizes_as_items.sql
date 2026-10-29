-- Client update (29 Oct 2026): each sauce size is its own menu item (own card, price, photo)
-- instead of one item with a size dropdown. Safe to re-run.

-- 750ml keeps the existing slug; its size dropdown goes (options cascade).
delete from public.option_groups
where product_id = (select id from public.products where slug = 'classic-sauce');

update public.products
set name = 'Classic Ofada Sauce 750ml',
    price_pence = 1700,
    description = '750ml of our classic Ofada sauce with diced assorted. Rice and extra protein not included.',
    image_url = '/images/product-sauce.jpg',
    badge = 'HOT',
    sort = 0
where slug = 'classic-sauce';

insert into public.products (category_id, slug, name, description, price_pence, image_url, badge, sort)
select c.id, v.slug, v.name, v.description, v.price_pence, '/images/product-sauce.jpg', 'HOT', v.sort
from public.categories c
cross join (values
  ('sauce-1l', 'Classic Ofada Sauce 1 Litre',  '1 Litre of our classic Ofada sauce with diced assorted. Rice and extra protein not included.', 2000, 1),
  ('sauce-2l', 'Classic Ofada Sauce 2 Litres', '2 Litres of our classic Ofada sauce with diced assorted. Rice and extra protein not included.', 3900, 2),
  ('sauce-5l', 'Classic Ofada Sauce 5 Litres', '5 Litres of our classic Ofada sauce with diced assorted. Rice and extra protein not included.', 9500, 3)
) as v(slug, name, description, price_pence, sort)
where c.slug = 'sauce'
on conflict (slug) do update
set name = excluded.name, description = excluded.description, price_pence = excluded.price_pence,
    image_url = excluded.image_url, badge = excluded.badge, sort = excluded.sort, is_active = true;
