export function legalMentionsTemplate(shopName: string) {
  return `MENTIONS LÉGALES

Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l'économie numérique.

PROPRIÉTAIRE DE LA BOUTIQUE
Nom : [Votre nom et prénom]
Adresse : [Votre adresse complète]
Email : [Votre adresse email]
Téléphone : [Votre numéro de téléphone]
Statut : [Auto-entrepreneur / SARL / EI…]
SIRET : [Votre numéro SIRET]

HÉBERGEUR
Vitrineasy – plateforme de boutiques en ligne
Hébergement technique : Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA

La boutique « ${shopName} » est exploitée de manière indépendante. Vitrineasy agit uniquement en tant que prestataire technique et ne saurait être tenue responsable du contenu et des transactions réalisées sur cette boutique.`;
}

export function cgvTemplate(shopName: string) {
  return `CONDITIONS GÉNÉRALES DE VENTE : ${shopName}

En vigueur au [date de mise à jour]

ARTICLE 1 – OBJET
Les présentes CGV régissent les ventes réalisées sur la boutique « ${shopName} » via la plateforme Vitrineasy.

ARTICLE 2 – PRIX
Les prix sont indiqués en euros TTC. [Précisez si vous êtes assujetti(e) à la TVA ou non — en tant qu'auto-entrepreneur sous le régime de la franchise en base de TVA ; la mention « TVA non applicable, art. 293 B du CGI » doit apparaître.]

ARTICLE 3 – COMMANDE
Toute commande vaut acceptation des présents CGV. Une confirmation est envoyée par email après validation du paiement.

ARTICLE 4 – PAIEMENT
Le paiement s'effectue en ligne, de manière sécurisée, par carte bancaire (via Stripe) ou PayPal. Le montant est débité au moment de la commande.

ARTICLE 5 – LIVRAISON
Les commandes sont expédiées dans un délai de [X jours ouvrés] après validation du paiement.
Modes de livraison proposés : [Mondial Relay / Chronopost / autre].
Les frais de livraison sont indiqués lors de la commande.

ARTICLE 6 – DROIT DE RÉTRACTATION
Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de 14 jours à compter de la réception de votre commande pour exercer votre droit de rétractation, sans avoir à justifier de motifs.
Pour exercer ce droit, contactez-moi à : [Votre email].
Les frais de retour sont à la charge du client. Le remboursement sera effectué dans les 14 jours suivant la réception du retour.

ARTICLE 7 – EXCEPTIONS AU DROIT DE RÉTRACTATION
Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux articles personnalisés ou aux produits descellés par l'acheteur.

ARTICLE 8 – GARANTIES LÉGALES
Tous les produits bénéficient de la garantie légale de conformité (art. L217-4 du Code de la consommation) et de la garantie contre les vices cachés (art. 1641 du Code civil).

ARTICLE 9 – LITIGES
En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux français seront compétents.`;
}

export function privacyPolicyTemplate(shopName: string) {
  return `POLITIQUE DE CONFIDENTIALITÉ : ${shopName}

Dernière mise à jour : [date]

RESPONSABLE DU TRAITEMENT
[Votre nom], [Votre adresse], [Votre email]

DONNÉES COLLECTÉES
Lors d'une commande, nous collectons : nom, prénom, adresse email, numéro de téléphone, adresse de livraison.
Ces données sont nécessaires au traitement et à la livraison de votre commande.

FINALITÉS
- Traitement et suivi des commandes
- Envoi de la confirmation de commande par email
- Respect des obligations légales (comptabilité, litiges)

DURÉE DE CONSERVATION
Les données liées aux commandes sont conservées 3 ans à compter de la date d'achat, conformément aux obligations légales.

PARTAGE DES DONNÉES
Vos données ne sont jamais vendues à des tiers. Elles peuvent être transmises à nos prestataires de paiement (Stripe / PayPal) et de livraison dans le seul but d'exécuter votre commande.

VOS DROITS (RGPD)
Conformément au Règlement Général sur la Protection des Données (UE 2016/679), vous disposez des droits suivants :
- Droit d'accès à vos données
- Droit de rectification
- Droit à l'effacement (« droit à l'oubli »)
- Droit d'opposition au traitement
Pour exercer ces droits, contactez-moi à : [Votre email].
Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).

COOKIES
Ce site n'utilise pas de cookies publicitaires ou de tracking. Seuls des cookies techniques nécessaires au fonctionnement du panier sont utilisés.`;
}
