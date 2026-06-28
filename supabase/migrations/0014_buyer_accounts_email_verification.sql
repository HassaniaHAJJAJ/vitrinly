-- Ajout des colonnes manquantes pour la vérification d'email
ALTER TABLE buyer_accounts
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex');

-- Index pour lookup rapide par token
CREATE UNIQUE INDEX IF NOT EXISTS buyer_accounts_verification_token_idx
  ON buyer_accounts (verification_token);
