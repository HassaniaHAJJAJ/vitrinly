-- Per-shop shipping fees (Mondial Relay / Chronopost), set by the merchant
-- and chosen by the buyer at checkout. A null price means that carrier is
-- not offered by the shop.

alter table shops add column mondial_relay_price numeric(10, 2);
alter table shops add column chronopost_price numeric(10, 2);

alter table orders add column shipping_method text;
alter table orders add column shipping_price numeric(10, 2) not null default 0;
