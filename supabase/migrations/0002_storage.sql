-- Public bucket for shop logos and product photos, uploaded by admin only.

insert into storage.buckets (id, name, public)
values ('shop-assets', 'shop-assets', true)
on conflict (id) do nothing;

create policy "shop assets are publicly readable" on storage.objects
  for select using (bucket_id = 'shop-assets');

create policy "admin manages shop assets" on storage.objects
  for all using (bucket_id = 'shop-assets' and is_admin())
  with check (bucket_id = 'shop-assets' and is_admin());
