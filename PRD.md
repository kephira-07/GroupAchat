# Group Achat — PRD d'une page

> Avant tout prompt. Version : 2.0 — 7 octobre 2026
> Documents liés : [cahier des charges](CAHIER_DES_CHARGES.md) · [écrans](SPEC_ECRANS_FIGMA.md) · [livraison](LIVRAISON.md)

---

À Lomé, un particulier paie le prix de détail faute de pouvoir acheter en gros seul ou de faire confiance à un inconnu qui propose de grouper. Deux utilisateurs : **l'acheteur**, sur Mobile Money, qui veut le prix de gros sans risque ; **le groupeur**, commerçant sélectionné, qui lance les campagnes. Fonctionnalités — *acheteur* : parcourir les campagnes sans compte ; rejoindre une campagne et payer sa part ; suivre sa livraison, validée par un code ; poser une question publique au groupeur, qui reste anonyme. *Groupeur* : créer une campagne ; décider à la clôture ; recevoir l'argent collecté moins 5 % de commission. Trois écrans : **détail**, **commander**, **confirmation**. Quatre tables : *groupeur*, *acheteur*, *campagne*, *commande* — avec trois champs à ne pas oublier : frais de livraison séparés de la part, position conservée sur la commande, clé d'idempotence sur le paiement. Hors périmètre : filtrage des messages par IA, paiement réel, application mobile. Stack : React, Django, PostgreSQL.

---

## Les détails, pour quand on code

Le paragraphe ci-dessus est le PRD. Ce qui suit n'en fait pas partie — c'est ce qu'il faudra avoir sous la main.

**Le récit de la fonctionnalité n°1**

> En tant qu'acheteuse à Lomé avec un smartphone, je veux rejoindre une campagne de groupage et payer ma part en Mobile Money, afin d'obtenir le prix de gros sans avancer l'argent à un inconnu.

C'est le seul parcours qui fait vivre les autres : sans acheteurs qui paient, aucune campagne ne se clôture.

**C'est fini quand**

- Je vois les campagnes ouvertes sans créer de compte
- Je vois mon total, livraison comprise, avant de payer
- Mon compte se crée au moment de payer, pas avant
- Je reçois une confirmation avec mon code de livraison
- Si la campagne n'aboutit pas, je suis remboursée intégralement

**Les trois champs qu'on oublie**

| Champ | Ce qui casse sans lui |
|---|---|
| `frais_livraison` séparé du montant de la part | Les frais varient selon la position et ne sont pas commissionnés : fondus dans la part, ni l'acheteur ni la comptabilité ne s'y retrouvent |
| `position` conservée sur la commande | Sans elle, aucune commande passée ne pourra servir à étalonner le barème le jour où les tarifs des transporteurs seront connus |
| `clé_idempotence` sur le paiement | Sans elle, un double appui facture deux fois |

**Web d'abord, mobile ensuite**

La v1 est une application web React, conçue **mobile d'abord** à 390 px — comme les maquettes. La version destinée au grand public sera mobile. Le travail n'est pas perdu : toute la logique métier vit côté serveur et l'application mobile consommera la même API. Ce qui se refait, c'est l'interface, pas le produit.

**Le paiement est simulé** jusqu'à l'agrément d'un agrégateur. Le parcours est complet et crédible, aucun argent réel ne circule. Le branchement du paiement réel ne change ni les écrans, ni les statuts, ni la logique métier — seul le connecteur diffère.
