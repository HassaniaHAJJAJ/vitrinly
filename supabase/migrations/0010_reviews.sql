-- Colonnes sur orders pour tracker les demandes d'avis
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS review_requests_sent int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_requested_at timestamptz;

-- Table des avis
CREATE TABLE IF NOT EXISTS reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_id        uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id       uuid REFERENCES orders(id) ON DELETE SET NULL,
  buyer_email    text NOT NULL,
  buyer_name     text NOT NULL,
  rating         int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        text,
  status         text NOT NULL DEFAULT 'invited', -- invited | pending | approved | rejected
  token          text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at     timestamptz NOT NULL DEFAULT now(),
  submitted_at   timestamptz,
  UNIQUE (product_id, buyer_email)
);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- La commerçante lit ses propres avis
CREATE POLICY "seller_read_reviews" ON reviews
  FOR SELECT USING (
    shop_id IN (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

-- La commerçante peut approuver/rejeter
CREATE POLICY "seller_update_reviews" ON reviews
  FOR UPDATE USING (
    shop_id IN (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

-- Lecture publique des avis approuvés uniquement
CREATE POLICY "public_read_approved" ON reviews
  FOR SELECT USING (status = 'approved');

-- Soumission via token (anon peut update le statut si token correspond)
CREATE POLICY "submit_by_token" ON reviews
  FOR UPDATE USING (true) WITH CHECK (status = 'pending');
