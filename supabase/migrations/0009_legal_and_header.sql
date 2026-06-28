-- Bannière header et documents légaux par boutique
alter table shops
  add column if not exists header_image_url text,
  add column if not exists header_color     text not null default '#f3f4f6',
  add column if not exists legal_mentions   text,
  add column if not exists cgv              text,
  add column if not exists privacy_policy   text;
