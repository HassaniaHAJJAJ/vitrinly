ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS review_requests_cancelled boolean NOT NULL DEFAULT false;
