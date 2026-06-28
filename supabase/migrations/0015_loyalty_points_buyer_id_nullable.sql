-- buyer_id est l'ancienne référence auth.users, désormais remplacée par buyer_account_id.
-- On la rend nullable pour que les nouveaux inserts (avec buyer_account_id uniquement) fonctionnent.
ALTER TABLE loyalty_points ALTER COLUMN buyer_id DROP NOT NULL;
