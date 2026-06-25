# Vitrinly

Plateforme multi-boutiques pour commerçantes sans site web : catalogue, panier, paiement PayPal, espace cliente et back-office admin.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Resend (emails transactionnels)
- PayPal Smart Button (paiement par boutique)
- Vercel (hébergement)

## Structure

```
src/
  app/
    boutique/[slug]/                  catalogue public d'une boutique
    boutique/[slug]/produit/[id]      fiche produit
    boutique/[slug]/panier            panier
    boutique/[slug]/commande          tunnel de commande + paiement
    dashboard/                        espace cliente (commandes)
    admin/                            back-office admin (boutiques, produits)
    api/checkout                      création de commande (service role)
    api/webhooks/paypal               confirmation de paiement
  lib/supabase/                       clients Supabase (browser/server/middleware)
supabase/migrations/                  schéma SQL + RLS
```

## Démarrage

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Copier `.env.local.example` vers `.env.local` et renseigner les clés (URL, anon key, service role key).
3. Appliquer le schéma : dans le SQL Editor de Supabase, exécuter dans l'ordre les fichiers de `supabase/migrations/` (ou via `supabase db push` si la CLI est installée et liée au projet).
4. Créer le premier compte admin : dans Supabase Auth, créer un utilisateur, puis insérer une ligne dans `profiles` avec `role = 'admin'` et `shop_id = null`.
5. Lancer le projet :

```bash
npm install
npm run dev
```

## Modèle de données

`shops` → `products` → `product_images` / `variants`, et `orders` → `order_items`. Chaque boutique est isolée par Row Level Security : les visiteurs lisent le catalogue public, les commandes ne sont visibles que par l'admin ou la cliente propriétaire (`profiles.shop_id`). La création de commande passe par une route API serveur utilisant la service role key (jamais exposée au client).
