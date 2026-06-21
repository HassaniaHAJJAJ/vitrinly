-- Adds the additional brand colors a shop can customize, alongside primary_color
-- (used for buttons/accents).

alter table shops
  add column text_color text not null default '#1f1f1f',
  add column title_color text not null default '#000000',
  add column background_color text not null default '#ffffff';
