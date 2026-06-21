-- Human-readable, auto-incrementing order number (e.g. "#1024"), shown to
-- buyers and sellers instead of the internal UUID.

alter table orders add column order_number bigserial unique;
