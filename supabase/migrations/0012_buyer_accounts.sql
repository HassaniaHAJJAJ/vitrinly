-- Profil acheteur
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firstname  text NOT NULL,
  lastname   text NOT NULL,
  phone      text,
  address    text,
  zip        text,
  city       text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer_read_own"   ON buyer_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "buyer_update_own" ON buyer_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "buyer_insert_own" ON buyer_profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Points de fidélité (par boutique)
CREATE TABLE IF NOT EXISTS loyalty_points (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id   uuid NOT NULL REFERENCES shops(id)       ON DELETE CASCADE,
  points    int  NOT NULL DEFAULT 0,
  UNIQUE (buyer_id, shop_id)
);

ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buyer_read_own_points" ON loyalty_points FOR SELECT USING (buyer_id = auth.uid());

-- Lien entre une commande et un compte acheteur (pour éviter de créditer deux fois)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Incrémentation atomique des points
CREATE OR REPLACE FUNCTION increment_loyalty_points(
  p_buyer_id uuid,
  p_shop_id  uuid,
  p_points   int
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO loyalty_points (buyer_id, shop_id, points)
  VALUES (p_buyer_id, p_shop_id, p_points)
  ON CONFLICT (buyer_id, shop_id)
  DO UPDATE SET points = loyalty_points.points + p_points;
END;
$$;
