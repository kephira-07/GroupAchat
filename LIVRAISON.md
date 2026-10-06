# Group Achat — le partenariat de livraison

> Développe le §11 du [cahier des charges](CAHIER_DES_CHARGES.md).
> Version : 1.1 — plusieurs transporteurs, sans API, et l'anonymat appliqué au colis

---

## 1. Pourquoi cette livraison n'est pas une livraison ordinaire

Avant de parler à une agence, il faut savoir ce qu'on lui demande. Un groupage ne ressemble pas à du e-commerce classique sur **quatre points**, et chacun change la négociation.

**1. C'est une rafale, pas un flux.** Une campagne clôture, et 32 commandes arrivent d'un coup. Puis plus rien pendant trois jours. Une agence calibrée pour un débit régulier encaissera mal ces pics. C'est à dire d'emblée : *« nous ne vous donnerons pas 10 colis par jour, nous vous en donnerons 32 le jeudi »*.

**2. Un seul point d'enlèvement, beaucoup de dépôts.** Les 32 colis partent du même endroit. **C'est notre meilleur argument de prix** : une tournée depuis un point unique coûte bien moins cher, par colis, que 32 enlèvements indépendants. L'agence le sait ; il faut qu'elle le répercute.

**3. La marchandise est lourde et encombrante.** Un sac de riz de 25 kg, un bidon de 20 L. Ce n'est pas un colis de moto-taxi. **C'est le point qui peut faire exploser le tarif de 1 000 F**, et c'est le premier chiffre à vérifier avec l'agence.

**4. Le point de départ change à chaque campagne.** La marchandise est chez le groupeur, pas chez nous. L'agence doit donc accepter un enlèvement à une adresse différente à chaque fois — ce qui n'est pas l'hypothèse habituelle d'un contrat de transport.

## 2. Le risque économique, en chiffres

Reprenons la campagne de référence : **32 commandes de riz 25 kg**, soit **800 kg** à déplacer, pour **32 000 F** de frais collectés (32 × 1 000 F).

La question à poser à l'agence est simple : **une journée de véhicule adapté, avec chauffeur et manutentionnaire, pour 32 dépôts de 25 kg dans Lomé, ça coûte combien ?** Si la réponse dépasse 32 000 F, le modèle est en perte sur chaque campagne alimentaire — et l'alimentaire est précisément le cœur de l'offre.

**Je ne connais pas les tarifs réels des transporteurs de Lomé** et je ne vais pas les inventer : c'est à toi d'aller chercher ce chiffre, c'est le plus déterminant du dossier.

### Le levier qui change tout : la densité

Le coût d'une tournée ne dépend presque pas du nombre de colis, il dépend de **la distance parcourue**. Trente-deux dépôts éparpillés dans tout Lomé coûtent très cher ; trente-deux dépôts dans trois quartiers coûtent peu.

Or **nous avons une information que l'agence n'a pas** : la répartition par quartier de chaque campagne, visible dès l'écran 15. Trois façons de s'en servir :

| Levier | Principe | Effet |
|---|---|---|
| **Tournées par quartier** | Livrer par vagues géographiques, pas dans l'ordre des commandes | Réduit la distance, donc le prix. Coût nul à mettre en place |
| **Jour de livraison par zone** | « Agoè le jeudi, Bè le vendredi » | Densifie encore. Demande d'annoncer un créneau, pas une date libre |
| **Points relais** | Livrer à une boutique ou un kiosque par quartier, l'acheteur y passe | **Le levier le plus puissant** : 3 arrêts au lieu de 32 |

Le troisième mérite d'être regardé sérieusement, même s'il s'éloigne de la livraison à domicile que tu as retenue. Il se situe exactement entre le domicile et le retrait au local que tu envisages plus tard, et il peut sauver l'économie des campagnes lourdes. **À proposer en option sur la campagne** : « livraison à domicile 1 000 F, retrait au point relais 400 F » — l'acheteur arbitre lui-même.

### La position face au poids

Le prix dépendra de l'endroit, et c'est juste : **le coût d'une tournée dépend de la distance**, et la position est le meilleur indicateur de distance qu'on ait au moment de la commande.

Mais une question reste ouverte : **la position ne dit rien du poids du colis.** Livrer un sac de 25 kg à Agoè et une robe à Agoè n'ont pas le même coût, et pourtant la même distance. Trois sorties possibles, à choisir quand tu auras les tarifs :

- **La position seule**, et on accepte que le léger subventionne le lourd. Le plus simple à comprendre pour l'acheteur. Tenable si les campagnes légères sont nombreuses.
- **Position × palier de poids** : un prix jusqu'à un seuil, un autre au-delà. Le plus juste économiquement.
- **Position × catégorie de campagne**, le poids étant déclaré par le groupeur à la création. Plus fin, mais ça dépend d'une déclaration qu'on ne vérifie pas.

Ma recommandation : **garde une seule dimension pour commencer**, la position. Le poids s'ajoute sans rien casser le jour où les chiffres montrent qu'il est nécessaire — c'est un argument de la fonction, pas une refonte.

Je ne tranche pas à ta place : la réponse dépend du tarif réel de l'agence, que tu n'as pas encore.

### Ce qui est décidé en attendant

**Les frais sont une fonction de la position de l'acheteur, et cette fonction renvoie 1 000 F pour l'instant** (§11.1 du cahier des charges). L'acheteur indique où il est de deux façons, à son choix : il **partage sa position exacte**, ou il **donne le nom du lieu**.

Deux conséquences utiles pour ta négociation :

- **La position est enregistrée sur chaque commande**, pas seulement le prix facturé. Au moment où un transporteur te donnera ses tarifs, tu auras **l'historique réel des endroits livrés** — de quoi vérifier son prix au lieu de le croire, et de quoi savoir quelles zones concentrent tes livraisons.
- **Rien à reconstruire le jour du changement** : une seule fonction à remplacer, et les frais déjà facturés restent figés sur les commandes passées.

## 3. Qui est le client de l'agence — la décision structurante

C'est **la** décision de ce dossier, et elle n'est pas négociable au vu de la promesse du produit.

| Option | Conséquence |
|---|---|
| **Group Achat est le client** ✅ | Nous encaissons les 1 000 F, nous payons l'agence, nous imposons le niveau de service, nous obtenons la preuve de livraison. La promesse « livré ou remboursé » est **tenable** |
| Le groupeur est le client | Nous ne contrôlons ni le délai, ni la preuve, ni la qualité — mais nous restons celui qui rembourse. **La promesse devient intenable** |

**Group Achat contracte les transporteurs, et lui seul.** Un groupeur qui a son propre livreur reste libre de l'utiliser (§11.2 du cahier des charges), mais il assume alors le même niveau d'exigence : preuve par code comprise.

## 4. Le circuit physique, étape par étape

C'est là que se trouvent les trous qu'on ne voit pas avant le premier incident.

### Étape 1 — Le groupeur reçoit la marchandise en vrac

Il a acheté 32 sacs. Ils arrivent sur une palette, pas en colis individuels.

### Étape 2 — Il répartit, emballe et étiquette — **c'est son travail, pas celui de l'agence**

Aucun transporteur n'acceptera un tas non étiqueté. Cette obligation doit être **écrite dans le contrat du groupeur**, pas supposée. Et nous devons lui fournir l'outil : **une étiquette à imprimer ou à recopier**, par commande.

Mais attention à ce qu'on y met. L'étiquette ne porte **ni nom, ni téléphone, ni adresse précise** :

> **K7M-4PQ**
> Tokoin
> Riz parfumé 25 kg — 1 part

C'est tout. Le nom, le numéro et le repère ne sont **jamais remis au groupeur** : ils sont révélés au livreur, au moment de la tournée, en échange du code. Le groupeur emballe donc 32 colis sans savoir qui les reçoit — seulement dans quel quartier ils vont, ce dont il a besoin pour les trier par vague.

**Et surtout pas le montant payé** : le livreur n'a pas à le connaître, et l'afficher crée une tentation inutile.

> **Pourquoi cette règle est structurante.** C'est elle qui fait tenir l'anonymat dans les deux sens (§1.7 de la spec écrans). Un groupeur qui repère les gros acheteurs et leurs numéros peut leur proposer la même marchandise hors plateforme — c'est exactement la fuite que l'anonymat du groupeur cherchait à éviter, prise par l'autre bout. Le colis est le dernier endroit par où l'identité de l'acheteur peut s'échapper. Il faut le fermer.

### Étape 3 — Le manifeste de campagne

Un document que **la plateforme génère**, et qui n'existe nulle part aujourd'hui dans la spec. Il existe en **deux versions, et c'est volontaire** :

| Version | Pour qui | Ce qu'elle contient |
|---|---|---|
| **Bordereau de colisage** | Le groupeur | Codes, quartiers, produit, nombre de parts. **Aucune identité** |
| **Manifeste de tournée** | Le transporteur, au moment de l'enlèvement | Codes, noms, repères, téléphones — l'information complète |

Le bordereau sert au groupeur à emballer et à compter. Le manifeste sert à livrer, et **il n'est produit qu'à l'enlèvement** : les données personnelles des acheteurs sortent de la plateforme le plus tard possible, et vers un seul destinataire.

**À ajouter au produit** : l'export « Bordereau de colisage » côté groupeur, et l'export « Manifeste de tournée » côté administrateur seulement.

### Étape 4 — L'enlèvement

Chez le groupeur, à une adresse qui change à chaque campagne. L'agence compte les colis et signe le manifeste. **À partir de là, les colis sont sous sa responsabilité** — c'est la bascule de responsabilité, et elle doit être datée.

### Étape 5 — La tournée et la preuve

Le livreur ouvre son **lien de tournée** (écran 22), saisit le code de chaque acheteur, et marque les refus. Chaque validation est horodatée.

**Contrainte à imposer à l'agence :** ses livreurs doivent avoir un téléphone avec un peu de données. Sans cela, pas de preuve de livraison — et sans preuve, l'historique de fiabilité des groupeurs ne se construit pas (§10.4 du cahier des charges). Ce n'est pas un détail technique, c'est une condition d'entrée.

### Étape 6 — Les retours

Un colis refusé ou non livré doit revenir quelque part. Chez le groupeur ? Au dépôt de l'agence ? Qui paie le retour, et qui le stocke en attendant l'arbitrage ? **Aucune réponse aujourd'hui.** C'est le trou le plus coûteux de la chaîne, parce qu'il se révèle toujours un vendredi soir avec un colis dans un camion.

## 5. Les cas d'échec, et qui paie

À régler **avant** de signer, parce que chacun a un coût et que personne n'y pense tant qu'il n'arrive pas.

| Cas | Question à trancher |
|---|---|
| **Acheteur absent** | Combien de présentations ? Qui paie la seconde ? |
| **Adresse introuvable** | À Lomé, le repère vaut plus que la rue. Qui appelle, et au bout de combien de temps on renonce ? |
| **Téléphone injoignable** | Délai avant abandon, et que devient le colis |
| **Colis refusé** (§12 du CDC) | Qui le reprend, qui le stocke, qui paie le retour |
| **Colis perdu ou abîmé** | **Qui indemnise ?** Nous remboursons l'acheteur — pouvons-nous nous retourner contre l'agence ? Il faut une clause de responsabilité et, si possible, une assurance |
| **Retard au-delà du délai annoncé** | Pénalité, ou simple constat ? Sans pénalité, le délai n'est qu'un souhait |

Sur le colis perdu, sois attentif : **c'est nous qui remboursons l'acheteur**, puisque c'est notre promesse. Si l'agence ne couvre rien, chaque perte sort de notre trésorerie. Une clause de responsabilité plafonnée vaut mieux que rien, et se négocie dès le premier contrat bien plus facilement qu'après le premier sinistre.

## 6. Les questions à poser à l'agence

À emporter telle quelle au rendez-vous.

**Prix**
1. Comment facturez-vous : au colis, à la tournée, à la journée de véhicule ?
2. Quel prix pour **une tournée de 30 dépôts depuis un point unique**, dans deux ou trois quartiers de Lomé ?
3. Le poids change-t-il le prix ? À partir de combien ?
4. Quel prix pour un **point relais** — un seul dépôt groupé par quartier ?
5. Sortie de Lomé : comment la facturez-vous ?

**Capacité**
6. Pouvez-vous absorber **32 colis en une journée**, de façon irrégulière, sans préavis long ?
7. Quel type de véhicule pour 800 kg ? Moto, tricycle, camionnette ?
8. Quel délai entre l'enlèvement et la dernière livraison ?

**Fonctionnement**
9. Acceptez-vous un **enlèvement à une adresse différente à chaque fois** ?
10. Vos livreurs ont-ils un téléphone avec des données ? **Peuvent-ils saisir un code sur une page web à chaque livraison ?**
11. Disposez-vous d'un système de preuve de livraison ? Lequel, et peut-on en récupérer les données ?
12. Comment gérez-vous un client absent, une adresse fausse, un refus ?

**Responsabilité**
13. Que se passe-t-il si un colis est perdu ou abîmé ? Jusqu'à quel montant couvrez-vous ?
14. Êtes-vous assurés ? Pouvez-vous le prouver ?
15. Quel engagement de délai acceptez-vous de mettre par écrit ?

**La question 10 est éliminatoire.** Sans saisie du code, il n'y a pas de preuve de livraison — et sans preuve, c'est tout l'édifice de fiabilité qui tombe.

## 7. Plusieurs transporteurs, sans intégration — le choix retenu

**Décision : pas d'agence unique, pas d'API.** Les informations de livraison — lieu, nom, téléphone — sont transmises au transporteur à l'arrivée des colis, campagne par campagne.

C'est le bon choix, et pour trois raisons qui tiennent au métier :

**1. Pas de point de défaillance unique.** Une seule agence qui s'arrête, c'est le produit qui s'arrête. Avec deux ou trois transporteurs, une campagne trouve toujours un véhicule.

**2. La concurrence sur le prix reste vivante.** Le tarif est le chiffre le plus incertain du dossier (§2). Pouvoir faire jouer deux transporteurs sur une campagne lourde vaut mieux que négocier une fois par an avec un partenaire qui sait qu'il est seul.

**3. L'anonymat se tient mieux.** Les données des acheteurs ne sont pas déversées en continu dans le système d'un tiers : elles sortent **par campagne, à l'enlèvement, pour la durée d'une tournée**. C'est la conséquence directe de l'étape 3 ci-dessus, et c'est exactement ce que tu décris.

### Ce que ce choix coûte, et comment le payer

Rien n'est gratuit. Deux coûts, et ils sont gérables.

| Coût | La parade |
|---|---|
| **Travail manuel à chaque clôture** : choisir un transporteur, l'appeler, lui envoyer le manifeste | Tenable à quelques campagnes par semaine, pas à cinquante. Un jour il faudra automatiser — mais pas maintenant, et surtout pas avant d'avoir des volumes |
| **Qualité inégale d'un transporteur à l'autre** | Le code de livraison égalise tout le monde : qui ne saisit pas les codes ne travaille plus avec nous. Un même indicateur, le taux de livraison au premier passage, se calcule par transporteur |

### La règle technique à tenir

**Le lien de tournée est l'unique interface.** Un transporteur n'a rien à installer, rien à intégrer : il reçoit un lien, ses livreurs saisissent les codes. C'est ce qui rend un transporteur remplaçable en une heure.

Le corollaire, à ne jamais oublier : **ne construis jamais le produit autour de l'outil d'un transporteur.** Si une intégration devient intéressante plus tard, elle s'ajoute à côté du lien de tournée, jamais à sa place.

### Et donc : contrats courts et non exclusifs

Un an reconductible plutôt que trois. Mais attention à un point : **sans contrat, pas de clause de responsabilité sur les colis perdus** (§5). Plusieurs transporteurs ne veut pas dire aucun écrit — ça veut dire **plusieurs écrits courts**, chacun portant les mêmes trois obligations : saisie du code, délai annoncé, plafond d'indemnisation.

## 8. Ce que ce dossier ajoute au produit

Quatre choses qui n'existent pas encore dans la spécification :

| À créer | Où |
|---|---|
| **Étiquette de colis** — code, quartier, produit, **sans identité** | Côté groupeur, après la décision (écran 16) |
| **Bordereau de colisage** — codes et quartiers, sans identité | Côté groupeur |
| **Manifeste de tournée** — l'information complète, produit à l'enlèvement | Admin Django uniquement |
| **Répertoire des transporteurs** + taux de livraison au premier passage | Admin Django |
| **Choix du mode de remise** par l'acheteur, si les points relais sont retenus | Écran 5, à côté de l'adresse |
| **Suivi des retours** — colis refusés, non livrés, en attente d'arbitrage | Admin Django |

## 9. Les décisions qui restent ouvertes

- **Tarifs réels des transporteurs**, et donc viabilité du 1 000 F. *Le chiffre le plus déterminant du dossier — tout le reste en découle.*
- **Forme du calcul**, une fois les tarifs connus : par distance, par zones, ou par paliers.
- Position seule ou **position × poids**.
- **Points relais** : oui ou non, et à quel prix pour l'acheteur.
- Nombre de présentations avant abandon, et qui paie la seconde.
- **Sort et coût des retours.**
- Plafond de responsabilité de l'agence en cas de perte.
- Barème hors de Lomé.
- **Combien de transporteurs** démarrer avec, et sur quels quartiers.
- Durée de validité du manifeste de tournée, et sa purge après livraison.
