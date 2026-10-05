# Group Achat — cahier des charges

> Version : 1.0 — refonte complète à partir de l'entretien de cadrage
> Lomé, Togo · interface en français · application mobile
> Légende : **À définir** = volontairement vide. *(proposition)* = à valider par toi.
> Document lié : [contenu des écrans pour Figma](SPEC_ECRANS_FIGMA.md)

---

## 1. Contexte et problème

Au Togo, les achats groupés existent déjà, mais ils vivent dans des **groupes WhatsApp** qui posent deux problèmes distincts :

**Pour l'acheteur, un problème de fiabilité.** Il verse de l'argent à quelqu'un qu'il ne connaît pas, sans garantie, sans recours, et sans moyen de savoir si cette personne a déjà livré ou disparu avec une caisse.

**Pour l'acheteur, un problème de choix.** Un groupe WhatsApp ne montre que ce que son animateur publie. L'offre est limitée à un organisateur, un cercle, un moment. Rien ne permet de voir tout ce qui est en groupage à un instant donné.

**Pour le groupeur, un problème de visibilité.** Il ne vend qu'à son carnet d'adresses. Son marché s'arrête aux membres de son groupe, alors que sa capacité à négocier, elle, ne s'arrête pas là.

## 2. Solution

**Group Achat réunit au même endroit les campagnes de groupage et les groupeurs que nous avons nous-mêmes sélectionnés.**

- L'acheteur **gagne en fiabilité** : il ne traite plus avec un inconnu, il commande sur une plateforme qui a choisi ses groupeurs et qui détient l'argent.
- Le groupeur **gagne un marché** : il n'est plus limité à son groupe WhatsApp, il est exposé à toute la demande de Lomé.
- La plateforme **prélève une commission** sur chaque campagne aboutie.

La plateforme n'achète pas, ne stocke pas et ne négocie pas. Elle **rassemble l'offre, encaisse, sécurise et organise la livraison**.

## 3. Ce qui nous distingue

| L'existant | Ce qu'il fait | Ce qui manque |
|---|---|---|
| Groupes WhatsApp | Groupages informels | Offre limitée à un animateur, aucune fiabilité, aucun recours |
| Pages et comptes de vente sur les réseaux | Vente au détail | Pas de groupage, pas de prix de gros |
| Sites de e-commerce | Catalogue et livraison | Prix au détail, pas de mécanique de groupage |

**Notre force n'est pas un algorithme, c'est une sélection.** Nous ne laissons pas n'importe qui ouvrir une campagne : nous recrutons et vérifions les groupeurs un par un. L'acheteur ne juge donc pas un groupeur — il fait confiance à Group Achat. C'est un engagement fort, et toute la section 10 existe pour le rendre tenable.

## 4. Objectifs

- Rassembler en un lieu toutes les campagnes de groupage ouvertes à Lomé.
- Permettre à un groupeur sélectionné de lancer une campagne en quelques minutes.
- Garantir à l'acheteur qu'il est livré ou remboursé.
- Faire naître l'offre à partir de la demande des acheteurs.
- Objectifs chiffrés (groupeurs, campagnes, volume) : **À définir**

## 5. Public cible

**Acheteurs :** toute personne à Lomé qui veut acheter au prix de gros sans gros budget — particuliers, ménages, petits commerçants, revendeuses. Pas de restriction de segment.

**Profil type retenu pour concevoir le MVP :** un adulte de Lomé, smartphone Android d'entrée de gamme, forfait data limité, habitué aux achats groupés WhatsApp et aux applications où l'on fait défiler des vidéos. Ce profil tranche les choix concrets, il n'exclut personne.

**Groupeurs :** personnes qui savent déjà sourcer et négocier — organisateurs de groupages, commerçants, importateurs à petite échelle. **Ils ne s'inscrivent pas librement : nous les recrutons.**

**Catégories de produits :** sans restriction — alimentaire, vêtements, chaussures, maison, hygiène, électronique.

## 6. Acteurs et rôles

| Acteur | Ce qu'il fait | Ce qu'il y gagne |
|---|---|---|
| **Visiteur** | Fait défiler les campagnes, cherche, consulte, pose des questions — sans compte | — |
| **Acheteur** | Commande une part dans une campagne, paie, suit, reçoit, peut contester à la livraison | La fiabilité : il est livré ou remboursé |
| **Groupeur** | Lance les campagnes, fixe le produit, le prix et le délai, décide si la commande passe, commande chez son fournisseur, répond aux questions | Un marché bien plus large que son carnet d'adresses |
| **Service de livraison partenaire** | Livre les acheteurs pour les groupeurs qui n'ont pas de livreur | Son tarif de livraison |
| **Administrateur (nous)** | Recrute et vérifie les groupeurs, contrôle les justificatifs d'achat, débloque les fonds, arbitre les litiges, modère | La commission |

**Sur le livreur.** Nous ne gérons pas de flotte et n'employons personne. Nous **passons un partenariat avec un service de livraison** et lui confions les livraisons des groupeurs qui n'ont pas leur propre livreur. Un groupeur qui a déjà son livreur peut l'utiliser. Le livreur n'est donc **pas un profil utilisateur de l'application** dans le MVP — c'est un prestataire, avec une conséquence importante traitée en section 11 : il faut quand même un moyen de prouver qu'il a livré.

## 7. Règles générales

1. **Aucune authentification au premier contact.** À la première ouverture, l'utilisateur arrive directement sur le fil des campagnes. Pas d'écran de connexion, pas de tutoriel bloquant, pas d'invitation à créer un compte.

2. **La connexion est déclenchée par l'opération, jamais par l'ouverture.** Elle n'est demandée qu'au moment où l'utilisateur engage quelque chose.

   | Reste libre, sans compte | Exige un compte |
   |---|---|
   | Faire défiler le fil, chercher, filtrer | **Payer** une commande |
   | Consulter une campagne, son prix, son délai | **Envoyer** une demande de produit |
   | Lire les questions et les réponses | **Poser** une question |
   | Choisir sa quantité et voir son total | Suivre ses commandes et ses demandes |

   Le compte se crée par **numéro de téléphone + code SMS**. Pas de mot de passe, pas d'e-mail, pas d'inscription distincte de la connexion : si le numéro est inconnu, le compte se crée à la validation du code.

3. **Rien de ce qui a été saisi n'est perdu.** Après connexion, l'action interrompue reprend d'elle-même, avec la quantité, l'adresse et le contenu des formulaires conservés. Une connexion abandonnée ramène à l'écran d'origine intact.

4. **Les groupeurs sont anonymes.** L'acheteur ne voit qu'un **pseudonyme**. Ni nom, ni photo, ni quartier, ni coordonnées, et aucune page de profil. Le pseudonyme n'est cliquable nulle part.

   La raison est économique : un acheteur qui peut identifier et joindre le groupeur traite directement avec lui la fois suivante, sans la plateforme, sans garantie et sans commission. L'anonymat protège le modèle autant que l'acheteur.

5. **Les échanges passent par la plateforme.** L'acheteur pose ses questions **publiquement** sous une campagne, le groupeur répond, et la réponse est visible de tous. Les numéros de téléphone et identifiants de réseaux sociaux sont masqués automatiquement dans les messages.

6. **Le groupeur est maître de sa campagne.** Il choisit le produit, le prix, la quantité par part, la durée, et c'est lui qui décide, à la clôture, si la commande passe ou non. La plateforme n'impose **aucun minimum de participants**.

7. **Un acheteur peut être servi seul**, si le groupeur l'autorise. Il n'y a pas de seuil imposé par la plateforme.

8. **Tout l'argent passe par la plateforme.** L'acheteur paie Group Achat, jamais le groupeur en direct.

9. **Commission sur campagne aboutie.** Aucune commission sur une campagne annulée : les acheteurs sont remboursés intégralement.

10. **La plateforme n'est ni vendeuse ni productrice.** Elle encaisse, sécurise, fait livrer et arbitre.

## 8. Le cycle d'une campagne

Le mot **campagne** désigne une opération de groupage sur un produit, ouverte pendant une durée fixée par le groupeur.

### 8.1 Statuts

**ouverte** → **clôturée** → *(décision du groupeur)* → **commande passée** → **en cours de livraison** → **terminée**

À la clôture, le groupeur tranche :
- **il maintient** : la campagne passe à *commande passée* et suit son cours ;
- **il annule** : tous les acheteurs sont **remboursés intégralement**, sans commission, et reçoivent une notification expliquant que la campagne n'a pas abouti.

**État alternatif :** *annulée*.

### 8.2 Ce qui déclenche chaque étape

| Étape | Déclencheur |
|---|---|
| Clôture | La date fixée par le groupeur est atteinte, ou il clôture à la main |
| Décision | Le groupeur, dans un délai de **48 h** *(proposition)* après la clôture |
| Annulation automatique | Aucune décision du groupeur passé ce délai — sinon l'argent des acheteurs resterait bloqué indéfiniment |
| Commande passée | Le groupeur a reçu les fonds et déposé son justificatif d'achat (section 10) |
| Livraison | Le groupeur déclare la marchandise reçue et prête |
| Terminée | Toutes les livraisons sont confirmées |

### 8.3 Statuts d'une commande d'acheteur

**payée** → **campagne clôturée** → **commande en cours chez le groupeur** → **en cours de livraison** → **livrée**

**États alternatifs :** *litige*, *remboursée*.

## 9. Circuit de l'argent

```
   Acheteur                 Group Achat              Groupeur            Fournisseur
      │                          │                      │                    │
      │  paie sa part            │                      │                    │
      ├─────────────────────────▶│                      │                    │
      │                     fonds détenus               │                    │
      │                          │                      │                    │
      │                     ── clôture de la campagne ──                     │
      │                          │                      │                    │
      │                          │  commission retenue  │                    │
      │                          │  + fonds versés      │                    │
      │                          ├─────────────────────▶│  achat             │
      │                          │                      ├───────────────────▶│
      │                          │   justificatif        │                    │
      │                          │◀─────────────────────┤                    │
      │                          │                      │                    │
      │        livraison par le partenaire              │                    │
      │◀─────────────────────────┴──────────────────────┘                    │
```

1. L'acheteur paie sa part **à la commande**, par Mobile Money. Il ne paie rien d'autre : pas de frais de service, pas d'abonnement.
2. **Les fonds sont détenus par Group Achat**, pas par le groupeur.
3. À la clôture, si le groupeur maintient la campagne, la plateforme **retient sa commission** et **lui verse les fonds** pour qu'il puisse acheter la marchandise.
4. Le groupeur achète chez son fournisseur et **dépose le justificatif de ce paiement** sur la plateforme.
5. La marchandise arrive, le partenaire de livraison livre les acheteurs.
6. Si la campagne est annulée, **remboursement intégral** et aucune commission.

### 9.1 Le point faible de ce circuit, énoncé clairement

Dans ce schéma, **l'argent des acheteurs quitte la plateforme avant que quoi que ce soit ne soit livré**. Entre l'étape 3 et l'étape 5, les acheteurs ont payé, la plateforme s'est dessaisie, et rien n'a encore été reçu.

Le justificatif d'achat arrive **après** le versement : il constate, il ne conditionne rien. Un groupeur qui reçoit les fonds et ne livre pas laisse la plateforme face à des acheteurs qui ont payé et qu'elle doit rembourser sur sa propre trésorerie — ou décevoir, ce qui est pire, puisque notre promesse unique est la fiabilité.

Ce n'est pas une critique du modèle : le groupeur a réellement besoin de l'argent pour acheter, et lui demander d'avancer sa trésorerie reviendrait à écarter la majorité des groupeurs. Le modèle est juste. **C'est son exécution qu'il faut armer**, et c'est l'objet de la section suivante.

## 10. Sécurisation du circuit — comment tenir la promesse de fiabilité

Cinq mesures, de la plus efficace à la plus accessoire. Les trois premières me paraissent nécessaires avant d'encaisser le premier franc réel.

### 10.1 Verser en deux fois, pas en une

**La mesure la plus efficace, et la moins coûteuse à mettre en œuvre.**

Au lieu de verser la totalité à la clôture, la plateforme verse **l'avance d'achat** — le montant nécessaire pour payer le fournisseur — et **retient le solde**, qui correspond à la marge du groupeur, jusqu'à la confirmation des livraisons.

| Moment | Ce que le groupeur reçoit |
|---|---|
| Clôture, campagne maintenue | **L'avance d'achat** : de quoi payer la marchandise |
| Après confirmation des livraisons | **Le solde**, soit sa marge, moins la commission |

Le groupeur peut acheter — rien n'est bloqué pour lui. Mais **il ne gagne son argent qu'après avoir livré**. C'est l'alignement d'intérêt que le versement unique ne produit pas.

Le calcul de l'avance : **À définir**. Deux voies possibles — un pourcentage fixe *(proposition : 70 %)*, ou le montant exact du devis fournisseur déposé par le groupeur, qui est plus juste mais demande de contrôler un devis avant chaque versement.

### 10.2 Déposer le devis avant, le reçu après

Aujourd'hui le justificatif arrive après le versement. Inverser la séquence change tout :

1. Le groupeur dépose le **devis ou la facture du fournisseur** → la plateforme sait ce qui va être acheté, à quel prix, chez qui.
2. La plateforme verse l'avance.
3. Le groupeur dépose le **reçu de paiement** → la plateforme constate l'achat effectif.
4. Sans reçu dans un délai donné *(proposition : 72 h)*, la campagne est annulée et les acheteurs remboursés — pendant que l'argent est encore récupérable.

Le devis n'empêche pas une fraude déterminée, mais il rend le mensonge documenté, donc attaquable, et il écarte l'erreur de bonne foi.

### 10.3 Payer le fournisseur directement, quand c'est possible

**La version forte, à viser pour les gros montants.** La plateforme règle le fournisseur elle-même, par Mobile Money ou virement, sur la base du devis. L'argent **ne transite jamais par le groupeur**.

Le groupeur garde son rôle entier — il trouve le produit, négocie, fait livrer — mais il ne détient plus les fonds des acheteurs. Le risque principal disparaît au lieu d'être atténué.

Ce n'est pas applicable partout : certains fournisseurs ne sont pas joignables par Mobile Money, certains achats se font en espèces sur un marché. D'où la règle proposée : **paiement direct au fournisseur au-delà d'un montant à fixer, avance au groupeur en dessous**. Seuil : **À définir**

### 10.4 Plafonner l'exposition d'un groupeur

Puisque nous recrutons les groupeurs nous-mêmes, nous disposons d'une information que personne d'autre n'a : leur historique chez nous. Autant l'utiliser pour borner le risque maximal.

| Niveau | Condition | Plafond de collecte par campagne *(proposition)* |
|---|---|---|
| Nouveau | 0 campagne livrée | 150 000 F |
| Confirmé | 3 campagnes livrées sans litige | 600 000 F |
| Établi | 10 campagnes livrées sans litige | Sans plafond, au cas par cas |

Un plafond n'empêche pas la fraude, il **borne le montant maximal d'un sinistre** — ce qui, pour une jeune structure, est la différence entre un incident et une fermeture. Il ne coûte rien à mettre en place et remplace utilement la certification abandonnée : la fiabilité se construit en livrant, pas en déposant des pièces.

### 10.5 Contractualiser le recrutement

Notre force annoncée est la sélection. Elle doit laisser une trace juridique, sinon elle ne vaut rien le jour d'un litige sérieux :

- pièce d'identité conservée, contact vérifié, adresse d'activité constatée ;
- **contrat signé** portant engagement de livraison, obligation de dépôt des justificatifs, et sanctions en cas de manquement ;
- caution ou garant pour les campagnes au-delà d'un montant : **À définir** ;
- procédure de retrait d'un groupeur, et sort des campagnes en cours : **À définir**

### 10.6 Ce que cela donne, assemblé

> L'acheteur paie Group Achat. À la clôture, le groupeur dépose son devis fournisseur et reçoit l'avance d'achat — ou le fournisseur est payé directement au-delà d'un certain montant. Il dépose ensuite son reçu, sous peine d'annulation. La marchandise est livrée par notre partenaire. **Le solde, qui est sa marge, ne lui est versé qu'après les livraisons confirmées**, et la commission n'est acquise à la plateforme qu'à ce moment-là.

Le groupeur n'avance pas sa trésorerie, et il ne gagne rien tant qu'il n'a pas livré. C'est le même modèle que le tien, avec la séquence remise dans l'ordre.

## 11. Livraison

- **Dans le MVP, tout est livré.** Il n'y a pas de retrait sur un point de rendez-vous.
- La livraison est assurée par un **service partenaire**, ou par le livreur du groupeur s'il en a un.
- L'acheteur saisit son **adresse de livraison** au moment de la commande (quartier, repères, numéro joignable).
- **Plus tard**, quand la structure aura un local, l'acheteur pourra venir récupérer sur place.

**Frais de livraison :** qui les paie, et sont-ils affichés séparément du prix de la part ? **À définir** — c'est une question de modèle économique autant que d'affichage, et elle doit être tranchée avant la maquette de l'écran de commande.

### 11.1 La preuve de livraison — point ouvert et important

Tu n'as pas répondu à cette question, et elle commande le versement du solde (10.1) comme la fenêtre de contestation (12).

Le livreur n'étant pas un utilisateur de l'application, trois voies, de la plus simple à la plus solide :

| Voie | Fonctionnement | Limite |
|---|---|---|
| **L'acheteur confirme** dans son application | Un bouton « J'ai bien reçu ma commande » | Un acheteur qui oublie bloque le solde du groupeur. Il faut une confirmation automatique après quelques jours |
| **Le livreur saisit un code** *(recommandé)* | L'acheteur montre un code à 6 caractères ou un QR code, le livreur le saisit sur une page web ouverte depuis un lien — sans installer l'application | Suppose un téléphone et du réseau chez le livreur |
| **Le partenaire nous transmet ses preuves** | Intégration avec le système du service de livraison | Dépend entièrement de ses capacités techniques, inconnues à ce stade |

Je recommande la deuxième, avec la première en repli. Elle conserve une **preuve unique et horodatée**, ce dont dépend tout le reste.

## 12. Contestation et litiges

- L'acheteur peut contester **au moment de la livraison**, pas après. Le motif est le non-respect flagrant de la commande : il a commandé une robe, on lui présente une chaussure.
- Une fois la livraison acceptée, la contestation n'est plus possible.
- En cas de contestation, le colis n'est pas accepté, le dossier remonte à l'administrateur, et les fonds de cette commande ne sont pas libérés.
- L'administrateur examine et tranche : remboursement de l'acheteur, ou libération au groupeur.

**Ce que cette règle implique, et qu'il faut regarder en face.** Une fenêtre fermée à la livraison protège le groupeur contre les réclamations tardives de mauvaise foi, ce qui est légitime. Mais elle ne couvre pas ce qu'on ne voit pas sur le pas de la porte : un carton scellé, une quantité manquante au fond du sac, un produit défectueux à l'usage.

Je ne propose pas de rouvrir la fenêtre — ton choix se défend. Je propose de la **borner explicitement dans les conditions d'utilisation** et de l'**afficher sur l'écran de suivi** avant la livraison : « vérifiez votre commande devant le livreur, la contestation n'est plus possible ensuite ». Un acheteur prévenu accepte une règle stricte ; un acheteur surpris la vit comme une arnaque, et c'est la réputation de la plateforme qui paie.

Délais de réponse du groupeur, durée maximale d'un litige : **À définir**

## 13. Confiance et anonymat

Tu as retiré la certification : **tous les groupeurs présents sont sélectionnés par nous**, c'est la garantie. L'acheteur ne compare donc pas les groupeurs entre eux, et ne voit d'eux qu'un pseudonyme.

Cela a une conséquence qu'il faut assumer : **toute la confiance repose sur la marque Group Achat**, et plus du tout sur le groupeur. Un seul groupeur défaillant n'abîme pas sa propre réputation — il abîme la nôtre. C'est exactement pourquoi la section 10 n'est pas un luxe.

Ce qui remplace la réputation individuelle, côté acheteur :

- une **promesse de plateforme** affichée clairement : groupeurs sélectionnés, argent détenu par Group Achat, livré ou remboursé ;
- les **questions publiques** sous chaque campagne, qui montrent un groupeur qui répond ;
- la **mécanique de recours** : contestation à la livraison, arbitrage, remboursement.

**Avis et notes :** retirés de l'interface acheteur, puisqu'il n'y a pas de profil à noter. Mais il serait dommage de ne pas mesurer la fiabilité **en interne** : taux de campagnes livrées, délais, litiges, c'est ce qui alimente les plafonds de 10.4. Affichage public d'un indicateur agrégé : **À définir**

## 14. Périmètre du MVP

- **Produit :** application mobile (Android et iOS), base de code unique.
- **Démonstration de compétition :** prototype web reproduisant l'application, ouvrable depuis un lien, sans installation.
- **Paiement réel** par Mobile Money — voir 17.2, qui conditionne ce choix.
- Ville : Lomé. Langue : français.

### 14.1 Ordre de priorité

1. **Commander une part dans une campagne et payer.** Le fil, la campagne, la quantité, l'adresse, le paiement, le suivi. Sans cela, il n'y a pas de produit.
2. **Lancer et gérer une campagne, côté groupeur.** Créer, suivre les participants, clôturer, décider, déposer les justificatifs, être payé.
3. **La demande de produit par l'acheteur.** Elle fait naître l'offre et rend le catalogue illimité sans gérer de stock.
4. **Le contrôle administrateur.** Recrutement des groupeurs, vérification des justificatifs, déblocage des fonds, litiges.

### 14.2 Hors périmètre, assumé

- Retrait sur place : attend le local.
- Compte et application pour le livreur : le partenaire est un prestataire, pas un utilisateur.
- Avis et notes publics.
- Langues locales et recherche vocale.
- Abonnements et visibilité payante.

## 15. Parcours

### 15.1 Acheteur

Il ouvre l'application et **fait défiler** les campagnes en plein écran, photo ou vidéo, comme un fil de réseau social. Une campagne l'intéresse : il ouvre le détail, lit le prix, la quantité par part, le délai restant, les questions déjà posées. Il peut en poser une.

Il choisit sa quantité, voit son total, saisit son adresse de livraison. **C'est en payant que son compte lui est demandé** — numéro, code SMS — et le paiement reprend seul ensuite.

Il suit sa commande : *payée*, puis *campagne clôturée*, puis *commande en cours chez le groupeur*, puis *en cours de livraison*. Le livreur se présente, **il vérifie sa commande devant lui** et accepte, ou refuse si ce n'est pas du tout ce qu'il a commandé.

Si la campagne est annulée, il est notifié et **remboursé intégralement**.

### 15.2 Groupeur

Nous le recrutons, vérifions son identité, lui faisons signer un contrat et lui créons son accès. Il choisit un **pseudonyme**.

Il consulte le **fil des demandes** des acheteurs, agrégé par produit et quartier — c'est ce qui lui dit où est la demande réelle. Il peut aussi lancer une campagne de sa propre initiative.

Il crée la campagne : produit, photos ou vidéo, description, prix par part, quantité par part, durée. Il suit les participants et le montant collecté, répond aux questions publiques, et peut partager sa campagne sur WhatsApp pour amener ses contacts.

À la clôture, **il décide** : la commande passe, ou pas. S'il maintient, il dépose son devis fournisseur, reçoit l'avance, achète, dépose son reçu. La marchandise arrive, le partenaire livre. **Son solde lui est versé après les livraisons confirmées, moins la commission.**

### 15.3 Administrateur

Il recrute et vérifie les groupeurs, fixe leur plafond, contrôle les devis et les reçus, débloque les avances et les soldes, surveille les campagnes en retard, arbitre les contestations et modère les questions.

## 16. Écrans

**Acheteur**
1. Fil des campagnes (défilement vertical plein écran)
2. Recherche, catégories et résultats
3. Détail d'une campagne
4. Connexion (feuille remontante)
5. Commander : quantité et adresse de livraison
6. Paiement Mobile Money
7. Confirmation de commande
8. Mes commandes
9. Détail d'une commande et suivi de livraison
10. Questions sur une campagne
11. Demander un produit
12. Mes demandes

**Groupeur**
13. Tableau de bord
14. Créer une campagne
15. Gérer une campagne
16. Clôturer et décider
17. Déposer un justificatif d'achat
18. Portefeuille
19. Fil des demandes
20. Questions reçues

**Administrateur** — dans l'admin Django, sans maquette
21. Recrutement et gestion des groupeurs
22. Contrôle des justificatifs et déblocage des fonds
23. Litiges et contestations

## 17. Contraintes non fonctionnelles

### 17.1 Interface et réseau

- Application légère, pensée pour une connexion lente et un forfait data limité.
- **Le fil en défilement vidéo est le point de vigilance du projet** : c'est l'écran le plus coûteux en données, sur le public le plus sensible au coût des données. Les mesures à prendre sont détaillées au §1.6 du document Figma.
- Gros boutons, textes lisibles, contraste élevé.
- Aucune action engageant de l'argent ne doit pouvoir être exécutée deux fois à cause d'une coupure réseau : chaque requête de paiement porte une **clé d'idempotence**.

### 17.2 Conformité et paiement réel

Tu as choisi le **paiement réel** dès la compétition. C'est faisable, mais cela a des prérequis qui ne sont pas techniques :

- **Détenir l'argent de tiers est une activité réglementée.** L'encaissement doit passer par un **agrégateur de paiement agréé** connecté à T-Money et Flooz. Group Achat ne détient pas l'argent sur un compte personnel.
- Cela suppose un **compte marchand**, donc une **structure juridique existante** et un dossier de connaissance du client. C'est le délai le plus long du projet, et il faut le lancer maintenant si la compétition est proche.
- Un **avis juridique** est nécessaire sur la détention de fonds et sur l'engagement « livré ou remboursé ».
- Choix de l'agrégateur, tarifs, délais de reversement : **À définir**

**Si ce dossier n'est pas bouclé à temps pour la compétition**, le repli est un paiement simulé dans le prototype, affiché honnêtement comme tel. Cela ne change rien à l'architecture : seul le connecteur de paiement diffère.

### 17.3 Traçabilité

Journal horodaté de **tous** les mouvements d'argent et de **tous** les changements de statut : paiements, versements d'avance, dépôts de justificatifs, livraisons confirmées, remboursements, décisions d'arbitrage. C'est à la fois l'exigence comptable, la preuve en cas de litige, et la matière des plafonds de 10.4.

## 18. Stack technique

**Architecture.** API séparée de l'interface. Le back-end expose une API indépendante que le prototype web consomme aujourd'hui et que l'application mobile consommera. **Toute la logique métier — détention des fonds, calcul de la commission, avances, soldes, statuts — vit côté serveur, jamais dans l'application.** Une application installée ne se corrige pas par un déploiement : ce qui est côté serveur se corrige le jour même.

**Back-end :** Django + Django REST Framework, PostgreSQL. L'admin Django sert de back-office pour le recrutement, le contrôle des justificatifs, le déblocage des fonds et les litiges.

**Front :** Flutter, compilé pour Android, iOS et le web — le prototype de compétition est ainsi le code de l'application, et non du travail jeté.

**Intégrité.** Toute opération touchant à l'argent passe par une transaction avec verrouillage de ligne (`SELECT FOR UPDATE`) : pas de double versement d'avance, pas de double validation de livraison, pas de double paiement.

**Tâches planifiées.** Trois règles ne se déclenchent sur aucune action utilisateur, et chacune est une **porte de sortie de l'argent détenu** :
1. clôture d'une campagne à sa date d'échéance ;
2. annulation et remboursement si le groupeur ne décide pas dans les 48 h ;
3. annulation et remboursement si le reçu d'achat n'est pas déposé dans le délai.

MVP : commande de gestion Django appelée par un cron horaire. Plus tard : Celery et Redis.

**Hébergement :** VPS avec Gunicorn derrière Nginx en production ; Render ou équivalent en phase de test.

**Stockage des médias.** Les vidéos du fil changent la nature du problème : il faut un stockage objet et une diffusion adaptée, pas des fichiers servis par le serveur applicatif. Solution retenue : **À définir**

## 19. Évolutions

- Retrait sur place dès l'ouverture d'un local.
- Intégration technique avec le service de livraison partenaire.
- Indicateur de fiabilité des groupeurs, interne puis peut-être public.
- Extension à d'autres villes, puis à d'autres pays.
- Création de campagne par dictée vocale, et interface en éwé, mina ou kabiyè. La traduction est faisable aujourd'hui ; la reconnaissance vocale dans ces langues reste faible, donc la dictée commencera en français.
- Agrégation de la demande par produit, quartier et période, pour orienter les groupeurs.
- Détection automatique des groupeurs à risque — signalement automatique, décision humaine.

**Prérequis à mettre en place dès le MVP :** ces derniers usages supposent un historique qui n'existera pas au départ. Enregistrer proprement, dès maintenant, chaque changement de statut avec sa date, chaque justificatif avec son montant, chaque livraison avec son heure et chaque demande avec son quartier. C'est gratuit aujourd'hui et irrécupérable plus tard.

## 20. Points à définir

**Bloquants avant de maquetter**
- Taux de commission, et qui le supporte — acheteur, groupeur, ou partagé.
- Frais de livraison : qui paie, et affichage séparé ou inclus dans le prix de la part.
- Preuve de livraison : laquelle des trois voies du §11.1.

**Bloquants avant d'encaisser réellement**
- Agrégateur de paiement, compte marchand, structure juridique.
- Avis juridique sur la détention de fonds et sur la promesse « livré ou remboursé ».
- Mode de calcul de l'avance d'achat, et seuil de paiement direct au fournisseur.

**À traiter pendant la construction**
- Plafonds d'exposition par niveau de groupeur.
- Contrat groupeur, caution, procédure de retrait.
- Délais : réponse du groupeur, dépôt du reçu, durée d'un litige.
- Notifications : quels événements, par quel canal.
- Protection des données personnelles : numéros, adresses de livraison, pièces d'identité des groupeurs.
- Stockage et diffusion des vidéos.
- Planning, équipe, budget, date de la compétition.
