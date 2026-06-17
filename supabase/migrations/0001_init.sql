-- Vitrinly initial schema: multi-tenant catalog + orders, with RLS isolation per shop.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  primary_color text not null default '#000000',
  paypal_email text,
  whatsapp_number text,
  created_at timestamptz not null default now()
);

-- One row per auth.users entry. role 'admin' manages every shop;
-- role 'seller' is scoped to a single shop via shop_id.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  shop_id uuid references shops (id) on delete cascade,
  role text not null check (role in ('admin', 'seller')),
  created_at timestamptz not null default now(),
  constraint seller_has_shop check (role = 'admin' or shop_id is not null)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  created_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  position int not null default 0
);

create table variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  size text not null,
  color text not null,
  stock int not null default 0 check (stock >= 0)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  buyer_name text not null,
  buyer_firstname text not null,
  buyer_email text not null,
  buyer_phone text not null,
  buyer_address text not null,
  buyer_zip text not null,
  buyer_city text not null,
  total_price numeric(10, 2) not null check (total_price >= 0),
  status text not null default 'pending' check (status in ('pending', 'processed')),
  tracking_number text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  paypal_order_id text
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  variant_id uuid references variants (id) on delete set null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  product_name text not null,
  size text not null,
  color text not null
);

create index products_shop_id_idx on products (shop_id);
create index variants_product_id_idx on variants (product_id);
create index product_images_product_id_idx on product_images (product_id);
create index orders_shop_id_idx on orders (shop_id);
create index order_items_order_id_idx on order_items (order_id);
create index profiles_shop_id_idx on profiles (shop_id);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so they can read profiles under RLS)
-- ---------------------------------------------------------------------------

create function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function my_shop_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select shop_id from profiles where id = auth.uid() and role = 'seller';
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table shops enable row level security;
alter table profiles enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- shops: catalog metadata is public (storefront needs it); only admin writes.
create policy "shops are publicly readable" on shops
  for select using (true);

create policy "admin manages shops" on shops
  for all using (is_admin()) with check (is_admin());

-- profiles: a user can read their own profile; admin reads/writes everything.
create policy "users read own profile" on profiles
  for select using (id = auth.uid() or is_admin());

create policy "admin manages profiles" on profiles
  for insert with check (is_admin());

create policy "admin updates profiles" on profiles
  for update using (is_admin()) with check (is_admin());

create policy "admin deletes profiles" on profiles
  for delete using (is_admin());

-- products / product_images / variants: public read for storefront, admin-only writes.
create policy "products are publicly readable" on products
  for select using (true);

create policy "admin manages products" on products
  for all using (is_admin()) with check (is_admin());

create policy "product images are publicly readable" on product_images
  for select using (true);

create policy "admin manages product images" on product_images
  for all using (is_admin()) with check (is_admin());

create policy "variants are publicly readable" on variants
  for select using (true);

create policy "admin manages variants" on variants
  for all using (is_admin()) with check (is_admin());

-- orders: only admin and the owning seller can see/update. Buyers never get
-- direct table access — order creation happens server-side with the service
-- role key (see /api/checkout), bypassing RLS entirely.
create policy "admin reads all orders" on orders
  for select using (is_admin());

create policy "seller reads own shop orders" on orders
  for select using (shop_id = my_shop_id());

create policy "admin manages orders" on orders
  for all using (is_admin()) with check (is_admin());

create policy "seller updates own shop orders" on orders
  for update using (shop_id = my_shop_id()) with check (shop_id = my_shop_id());

-- order_items: same visibility as their parent order.
create policy "admin reads all order items" on order_items
  for select using (is_admin());

create policy "seller reads own shop order items" on order_items
  for select using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.shop_id = my_shop_id()
    )
  );

create policy "admin manages order items" on order_items
  for all using (is_admin()) with check (is_admin());
