-- Comptes acheteurs isolés par boutique (remplace Supabase Auth pour les acheteuses)

CREATE TABLE buyer_accounts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     uuid        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  password_hash text      NOT NULL,
  firstname   text        NOT NULL,
  lastname    text        NOT NULL,
  phone       text,
  address     text,
  zip         text,
  city        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, email)
);

CREATE TABLE buyer_sessions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_account_id  uuid        NOT NULL REFERENCES buyer_accounts(id) ON DELETE CASCADE,
  token             text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE buyer_password_resets (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_account_id  uuid        NOT NULL REFERENCES buyer_accounts(id) ON DELETE CASCADE,
  token             text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  used              boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Mise à jour de loyalty_points : buyer_account_id remplace buyer_id (auth.users)
ALTER TABLE loyalty_points
  ADD COLUMN buyer_account_id uuid REFERENCES buyer_accounts(id) ON DELETE CASCADE;

-- Nouvelle contrainte unique sur buyer_account_id + shop_id
ALTER TABLE loyalty_points
  DROP CONSTRAINT IF EXISTS loyalty_points_buyer_id_shop_id_key;

ALTER TABLE loyalty_points
  ADD CONSTRAINT loyalty_points_buyer_account_id_shop_id_key
  UNIQUE (buyer_account_id, shop_id);

-- Mise à jour de la fonction d'incrémentation des points
CREATE OR REPLACE FUNCTION increment_loyalty_points(
  p_buyer_account_id uuid,
  p_shop_id          uuid,
  p_points           int
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO loyalty_points (buyer_account_id, shop_id, points)
    VALUES (p_buyer_account_id, p_shop_id, p_points)
  ON CONFLICT (buyer_account_id, shop_id)
    DO UPDATE SET points = loyalty_points.points + p_points;
END;
$$;

-- Colonne buyer_account_id sur orders (nullable)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS buyer_account_id uuid REFERENCES buyer_accounts(id) ON DELETE SET NULL;

-- RLS : lecture/mise à jour par l'admin uniquement (pas de RLS row-level côté acheteur,
-- la validation se fait via le token de session en application)
ALTER TABLE buyer_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_password_resets ENABLE ROW LEVEL SECURITY;
