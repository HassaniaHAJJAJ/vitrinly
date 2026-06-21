-- Stripe Connect support, alongside the existing PayPal integration.
-- Each shop can have a connected Stripe Express account; orders record
-- which provider was used to pay.

alter table shops add column stripe_account_id text;
alter table shops add column stripe_onboarding_complete boolean not null default false;

alter table orders add column payment_provider text;
alter table orders add column stripe_session_id text;
