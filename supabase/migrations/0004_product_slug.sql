-- Adds a human-readable, SEO-friendly slug to products, used in public
-- storefront URLs instead of the raw UUID. Unique per shop; numeric suffix
-- (-2, -3, ...) only added when two products in the same shop share a name.

alter table products add column slug text;

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

alter table products alter column slug set not null;
alter table products add constraint products_shop_slug_unique unique (shop_id, slug);
create index products_shop_slug_idx on products (shop_id, slug);
