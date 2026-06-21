-- Fixes up products.slug for projects that already ran the earlier version of
-- migration 0004 (which appended a random 8-char suffix to every slug).
-- Recomputes clean, SEO-friendly slugs, only adding a numeric suffix when two
-- products in the same shop genuinely share a name.

alter table products drop constraint if exists products_shop_slug_unique;

with base as (
  select
    id,
    shop_id,
    created_at,
    trim(both '-' from regexp_replace(lower(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g')), '\s+', '-', 'g')) as base_slug
  from products
),
numbered as (
  select
    id,
    shop_id,
    base_slug,
    row_number() over (partition by shop_id, base_slug order by created_at) as rn
  from base
)
update products p
set slug = case when n.rn = 1 then n.base_slug else n.base_slug || '-' || n.rn end
from numbered n
where p.id = n.id;

alter table products add constraint products_shop_slug_unique unique (shop_id, slug);
