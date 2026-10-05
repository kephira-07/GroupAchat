# Group Achat — fonctionnalités et contenu des écrans pour Figma

> Accompagne le [cahier des charges](CAHIER_DES_CHARGES.md). Version : 1.0
> Objet : ce qu'il y a **dans** chaque écran — textes réels, données réelles, états réels.

**Comment lire ce document.** Les textes entre guillemets se recopient tels quels. Les chiffres viennent du jeu de données du §3 : n'en invente pas d'autres, la cohérence d'un écran à l'autre est ce qui fait croire à une démonstration.

**Une règle avant tout le reste :** aucun faux texte. Pas de *Lorem ipsum*, pas de « Produit 1 ». Un jury regarde le contenu avant la mise en page.

---

## 1. Fondations

### 1.1 Cadre et grille

| Élément | Valeur |
|---|---|
| Frame Figma | **390 × 844** |
| Marge latérale | **16 px**, jamais entamée — sauf le fil (§4), qui est à bord perdu |
| Grille d'espacement | multiples de 4 : 4, 8, 12, 16, 24, 32, 48 |
| Zone tactile minimale | **48 × 48 px** |
| Barre de navigation | 72 px en bas |

Prévois aussi une **frame de présentation** : le téléphone centré sur fond neutre, pour la projection devant le jury.

### 1.2 Couleurs

Marque : **bleu `#1E3A8A`** et **orange `#FF6A00`**. À définir en variables Figma, pas en valeurs directes.

| Jeton | Hex | Usage |
|---|---|---|
| `primaire` | **`#1E3A8A`** | Boutons d'action, liens, éléments actifs |
| `primaire-fond` | `#E8EDF8` | Fonds d'encarts |
| `primaire-sombre` | `#172E6E` | État pressé |
| `accent` | **`#FF6A00`** | **Remplissage** : compteurs de temps, liserés d'urgence, bouton flottant |
| `accent-texte` | `#B34A00` | Orange **en texte ou icône** sur fond clair |
| `accent-fond` | `#FFF1E6` | Fond des blocs d'urgence |
| `succes` | `#0B6B52` | Livré, paiement confirmé, économie |
| `succes-fond` | `#E6F4EC` | Fond des confirmations |
| `attention` | `#8A5300` | Texte des avertissements |
| `attention-fond` | `#FFF4E0` | Fond des avertissements |
| `danger` | `#C0392B` | Erreurs, annulation, litige |
| `texte` | `#14181F` | Texte principal |
| `texte-secondaire` | `#5A6472` | Libellés, métadonnées |
| `bordure` | `#DFE3E8` | Séparateurs |
| `fond` | `#F7F8FA` | Fond d'écran |
| `surface` | `#FFFFFF` | Cartes, champs |
| `voile` | `#000000` à 45 % | Dégradé sur les médias du fil, pour lire le texte par-dessus |

**La règle à ne pas enfreindre sur l'orange.** `#FF6A00` ne contraste qu'à **2,87:1** avec le blanc — il en faut 4,5.

- ❌ jamais de texte blanc sur fond `#FF6A00`, ni de texte `#FF6A00` sur blanc ;
- ✅ l'orange en **remplissage** : c'est son rôle ;
- ✅ texte sombre `#14181F` sur fond orange : 6,20:1 ;
- ✅ `accent-texte` `#B34A00` dès qu'il faut écrire en orange : 5,39:1.

Donc **les boutons d'action principale sont bleus**. L'orange est le signal, le bleu est l'action.

Contrastes vérifiés : blanc sur `primaire` **10,36:1**, `primaire` sur `primaire-fond` 8,83:1, `texte-secondaire` sur `surface` 6,0:1. Si tu changes une teinte, revérifie.

### 1.3 Typographie

**Inter**, ou Roboto pour un rendu plus fidèle sur Android.

| Style | Taille / graisse | Usage |
|---|---|---|
| `Titre-ecran` | 24 / Semibold | Titre en haut d'écran |
| `Titre-fil` | 20 / Bold | Nom du produit dans le fil, en blanc sur média |
| `Titre-section` | 18 / Semibold | Titres de blocs |
| `Prix` | 22 / Bold | Prix et montants |
| `Corps` | 16 / Regular | Texte courant — **plancher absolu** |
| `Corps-fort` | 16 / Semibold | Valeurs importantes |
| `Libelle` | 14 / Medium | Libellés de champs |
| `Petit` | 12 / Regular | Mentions, horodatages |
| `Code` | 32 / Bold, interlettrage +4 | Le code de livraison, uniquement |

Jamais de texte sous 12 px. Sur les médias du fil, tout texte blanc est posé sur un dégradé `voile`, sans quoi il devient illisible sur une photo claire.

### 1.4 Rédaction

- **Vouvoiement** partout.
- **Montants :** `14 500 F` — espace comme séparateur de milliers, `F` et non `FCFA` ni `XOF`.
- **Dates :** `sam. 11 oct.` en liste, `samedi 11 octobre` en détail. Les délais en relatif : « Plus que 2 jours ».
- **Vocabulaire :** une **campagne** (pas un « groupage » ni un « deal »), un **groupeur**, **commander une part**, **livraison**. Jamais *séquestre*, *escrow*, *transaction* à l'écran.
- **Ne jamais nommer le groupeur autrement que par son pseudonyme.**

### 1.5 Règle d'accès : aucun mur à l'entrée

> **À la première ouverture, l'utilisateur arrive directement sur le fil. Le compte n'est demandé qu'au moment où il engage quelque chose.**

Trois choses à ne jamais dessiner : **écran « Connexion / Inscription » au lancement**, **tutoriel bloquant**, **pop-up « créez un compte »**.

| Libre, sans compte | Exige un compte |
|---|---|
| Faire défiler le fil, chercher, filtrer | **Payer** une commande |
| Ouvrir une campagne, voir prix et délai | **Envoyer** une demande de produit |
| Lire les questions et réponses | **Poser** une question |
| Choisir sa quantité, saisir son adresse | Suivre ses commandes et ses demandes |

**Le déclencheur est le bouton « Payer » de l'écran 5**, pas avant. Choisir une quantité n'engage rien ; payer engage.

**La connexion est une feuille remontante, pas une page.** Elle monte par-dessus l'écran en cours, qui reste visible derrière sous un voile sombre. L'utilisateur voit qu'il n'a pas quitté son parcours ; fermer la feuille le ramène à son écran **intact** ; après le code, la feuille redescend et **l'action reprend seule**.

**Ce qui doit survivre à la connexion :** la campagne, la quantité, **l'adresse de livraison saisie**, le contenu du formulaire de demande, la position dans le fil.

**Pas d'inscription distincte.** Numéro, puis code SMS. Si le numéro est inconnu, le compte se crée. **Ne dessine jamais deux boutons « Se connecter » et « Créer un compte ».**

**Les onglets protégés n'affichent pas un mur.** Un visiteur qui touche « Mes commandes » voit :

> 📦 **Vos commandes apparaîtront ici**
> Commandez une part dans une campagne pour suivre votre livraison.
> **[ Voir les campagnes ]** · *J'ai déjà un compte — me connecter*

À décliner pour **Mes commandes**, **Mes demandes** et **Profil**.

### 1.6 Le fil vidéo — contrainte technique à intégrer dès la maquette

Le fil en défilement plein écran est le cœur de l'expérience **et le point de vigilance du projet** : c'est l'écran le plus coûteux en données, destiné au public le plus sensible au coût des données. Un fil qui vide un forfait fait désinstaller l'application, quelle que soit la qualité du reste.

Six règles à matérialiser dans la maquette :

1. **Une image d'abord, toujours.** Chaque campagne a une image de couverture qui s'affiche immédiatement. La vidéo se charge par-dessus une fois prête — jamais d'écran vide pendant le chargement.
2. **Le son coupé par défaut**, avec une icône de son bien visible et touchable. Un son qui démarre seul dans un taxi fait fermer l'application.
3. **Une seule vidéo préchargée à l'avance**, pas trois.
4. **Un mode « économie de données »** dans le profil : images seulement, aucune vidéo automatique. À dessiner, c'est un argument produit sur ce marché.
5. **Les vidéos sont courtes et verticales** : 9:16, 15 secondes maximum, et le prix est lisible sans le son.
6. **Un état de secours** : si le média ne charge pas, la carte reste utilisable avec l'image, le titre, le prix et le bouton.

À prévoir aussi côté maquette : les campagnes de produits non filmables (un sac de riz) auront **une photo, pas une vidéo**. Le fil doit être aussi convaincant avec une photo fixe qu'avec une vidéo — sinon les groupeurs sans moyens de tournage sont désavantagés sans raison.

### 1.7 Anonymat du groupeur

**Il n'existe aucune page de profil de groupeur, et aucun moyen de le joindre.**

| Visible | Jamais visible |
|---|---|
| Un **pseudonyme** : « Mama Gro » | Nom, photo, quartier, date d'inscription |
| Qu'il répond aux questions | Téléphone, WhatsApp, e-mail, réseaux |
| — | Ses autres campagnes, toute fiche le concernant |

**Le pseudonyme n'est cliquable nulle part.** C'est une étiquette, pas un lien.

Ce qui porte la confiance à la place, et qui doit être visible sur le fil comme sur le détail, c'est la **promesse de plateforme** :

> 🛡️ **Groupeurs sélectionnés par Group Achat**
> Votre paiement est détenu par Group Achat. Vous êtes livré, ou remboursé.

C'est le seul signal de confiance de l'application : il doit être présent, court, et répété.

**Filtre anti-contournement :** à la publication d'une question ou d'une réponse, les numéros de téléphone et identifiants de réseaux sociaux sont masqués, avec le message « Les échanges de numéros ne sont pas autorisés. Votre paiement n'est protégé que sur Group Achat. »

---

## 2. Composants à créer avant les écrans

### 2.1 `CarteFil` — la carte plein écran du fil
Le composant le plus important de l'application. Détaillé à l'écran 1.

### 2.2 `BarreNav`
Hauteur 72, fond `surface`, bordure haute. Icône 24 + libellé 12. Actif en `primaire`, inactif en `texte-secondaire`.
- **Acheteur :** Fil · Rechercher · Demander · Mes commandes
- **Groupeur :** Tableau de bord · Mes campagnes · Demandes · Portefeuille

**Identique, connecté ou non.** Aucun onglet grisé, aucun cadenas.

Sur le fil, la barre est posée sur le média avec un dégradé `voile` derrière elle.

### 2.3 `CarteCampagne` — version liste
Pour la recherche et les listes, à côté du fil plein écran.

```
┌──────────────────────────────────────┐
│ [photo 96×96]  Riz parfumé 25 kg     │
│                14 500 F  18 000 F    │
│                🕐 Plus que 2 jours   │
│                Mama Gro              │
│                32 personnes ont      │
│                commandé              │
└──────────────────────────────────────┘
```

Variantes : `ouverte`, `derniers-jours` (liseré `accent`), `cloturee` (grisée), `annulee`.

### 2.4 `CompteurTemps`
Puce avec icône horloge. **Le temps restant est le seul élément de pression de l'application** — il n'y a ni minimum ni places limitées, donc c'est lui qui crée l'urgence.
Variantes : `large` (« Plus que 6 jours », `texte-secondaire`), `proche` (« Plus que 2 jours », `accent-fond` + `accent-texte`), `derniere-heure` (« Plus que 4 h », `danger`), `terminee` (« Campagne clôturée », grisé).

### 2.5 `CompteurParticipants`
« 32 personnes ont commandé ». Jamais de fraction ni de jauge : **il n'y a pas de plafond ni de minimum**, donc rien à remplir. Un nombre qui monte suffit, et il rassure.

### 2.6 `BandeauConfiance`
Le bandeau de la promesse de plateforme (§1.7). Fond `primaire-fond`, bordure gauche 4 px `primaire`, icône bouclier. Deux tailles : `compact` (une ligne, pour le fil) et `complet` (deux lignes, pour le détail et la confirmation).

### 2.7 `Bouton`
Hauteur 52, coins 10, pleine largeur moins les marges.
Variantes : `primaire` (fond `#1E3A8A`, texte blanc), `secondaire` (contour `primaire`), `danger-texte`, `desactive`, et pour chacune un état `chargement`. **Aucune variante orange** (§1.2).
Les boutons principaux sont **ancrés en bas** sur `surface` avec une ombre haute.

### 2.8 `Statut`
Hauteur 24, coins complets, texte 12 Medium.

| Statut | Couleur |
|---|---|
| Payée — en attente de clôture | `primaire` sur `primaire-fond` |
| Campagne clôturée | `primaire` sur `primaire-fond` |
| Commande en cours chez le groupeur | `accent-texte` sur `accent-fond` |
| En cours de livraison | `accent-texte` sur `accent-fond` |
| Livrée | `succes` sur `succes-fond` |
| Litige | `danger` sur rouge très clair |
| Remboursée | `texte-secondaire` sur gris clair |
| Campagne annulée | `danger` sur rouge très clair |

### 2.9 `Champ`
Libellé 14 **au-dessus** du champ, jamais un simple placeholder — il disparaît à la saisie et l'utilisateur ne sait plus ce qu'il remplit. Hauteur 52, coins 10.
Variantes : `vide`, `rempli`, `focus` (bordure `primaire` 2 px), `erreur` (bordure `danger` + message 12 dessous).

### 2.10 `CodeLivraison`
Bloc centré, fond `surface`, bordure 2 px en tirets `primaire`, coins 16. QR code 160 × 160, le code en style `Code`, et « Montrez ce code au livreur ».

### 2.11 `Encart`
Bordure gauche 4 px, icône + texte, coins 8.

| Variante | Fond | Bordure et texte |
|---|---|---|
| `attention` | `attention-fond` | `attention` |
| `info` | `primaire-fond` | `primaire` |
| `succes` | `succes-fond` | `succes` |
| `danger` | `#FBEAE8` | `danger` |

### 2.12 `EtatVide`
Icône 64, titre 18, phrase explicative 16 en `texte-secondaire`, bouton `secondaire`. À décliner : aucune commande, aucune demande, aucune campagne, aucun résultat, non connecté.

### 2.13 `FriseEtapes`
Frise verticale à 4 ou 5 étapes, l'étape atteinte en `primaire`, les suivantes en `bordure`. Sert au suivi de commande (écran 9) et à la confirmation (écran 7).

---

## 3. Jeu de données de démonstration

Un seul jeu, utilisé sur **tous** les écrans.

**Acheteuse :** Akosua Doe — `+228 90 12 34 56` — Tokoin, rue des Cocotiers, près de la pharmacie Sodji

**Groupeurs** — pseudonymes seuls, jamais de nom réel :
**Mama Gro** · **Lomé Deals** · **Chez Sika**

| # | Produit | Prix / part | Prix détail | Commandes | Groupeur | Fin | Média |
|---|---|---|---|---|---|---|---|
| C1 | Riz parfumé 25 kg | **14 500 F** | 18 000 F | 32 | Mama Gro | Plus que 2 jours | Photo |
| C2 | Robe wax, taille au choix | 7 500 F | 11 000 F | 18 | Chez Sika | Plus que 5 jours | **Vidéo** |
| C3 | Huile de palme 20 L | 11 200 F | 14 000 F | 24 | Mama Gro | Plus que 6 jours | Photo |
| C4 | Baskets homme, pointures 39-45 | 9 800 F | 15 000 F | 41 | Lomé Deals | **Plus que 4 h** | **Vidéo** |
| C5 | Savon de Marseille, carton de 48 | 9 500 F | 12 500 F | 12 | Chez Sika | Clôturée | Photo |

**La commande fil rouge :** C1, 1 part, **14 500 F**, code de livraison **`K7M-4PQ`**.

**Portefeuille de Mama Gro** (cohérent avec C1 : 32 × 14 500 = 464 000 F) :
collecté sur C1 **464 000 F** · avance reçue **324 800 F** (70 %) · commission **23 200 F** (5 %) · solde retenu **116 000 F** · disponible **86 450 F**.

Le calcul doit tomber juste à l'écran : 464 000 − 324 800 − 23 200 = **116 000**. Un jury vérifie ce genre d'addition.

**Quartiers :** Agoè, Bè, Tokoin, Adidogomé, Nyékonakpoè, Hédzranawoé.

---

# Lot 1 — commander et payer

## Écran 1 — Le fil des campagnes

**Objectif :** qu'un visiteur comprenne en trois secondes ce qu'il regarde, et qu'il ait envie de faire défiler. C'est l'écran d'accueil, celui qui s'ouvre à la toute première utilisation, **sans aucun compte**.

**Structure : une carte par campagne, plein écran, défilement vertical.** Une campagne occupe tout l'écran ; on glisse vers le haut pour la suivante.

**De haut en bas sur une carte**

1. **Le média à bord perdu** : photo ou vidéo 9:16 couvrant tout l'écran. Un dégradé `voile` en haut sur 120 px et en bas sur 280 px, sans quoi aucun texte n'est lisible.
2. **En haut :** « Group Achat » à gauche, icône de recherche à droite. Rien d'autre — pas de bouton « Connexion », pas d'avatar (§1.5).
3. **Rail d'actions vertical à droite**, aligné sur le bas, icônes blanches de 28 avec libellé 12 dessous :
   - 💬 **Questions** — « 7 »
   - ↗️ **Partager**
   - 🔇 **Son** — coupé par défaut (§1.6), seulement si la campagne a une vidéo
4. **Bloc d'information en bas à gauche**, au-dessus de la barre de navigation :
   - `CompteurTemps` : « 🕐 Plus que 2 jours »
   - **Nom du produit** en `Titre-fil` blanc : « Riz parfumé 25 kg »
   - **Prix** : `14 500 F` en `Prix` blanc, puis `18 000 F` barré, puis une puce « **−19 %** » sur `succes`
   - `CompteurParticipants` : « 32 personnes ont commandé »
   - **Pseudonyme** en 14 : « Mama Gro » — **non cliquable** (§1.7)
   - `BandeauConfiance` en version `compact`, une ligne : « 🛡️ Groupeur sélectionné · Livré ou remboursé »
5. **Bouton ancré** au-dessus de la barre de navigation, pleine largeur : « **Commander — 14 500 F** ». Le montant dans le bouton supprime la surprise à l'étape suivante.
6. **`BarreNav`**, onglet Fil actif, posée sur un dégradé.
7. **Indice de défilement**, à dessiner seulement sur la première carte : une flèche vers le haut et « Faites glisser pour voir d'autres campagnes », qui disparaît au premier geste. Sans cet indice, un utilisateur qui n'a jamais vu ce type d'interface reste bloqué sur la première campagne.

**Cartes à dessiner** — au moins trois, pour montrer la variété : **C1** (photo, 2 jours), **C2** (vidéo, robe wax), **C4** (vidéo, 4 h restantes — en `danger`, l'urgence maximale).

**États à dessiner**

| État | Contenu |
|---|---|
| Chargement | Fond `fond` avec un dégradé animé, logo discret au centre |
| Image seule | La vidéo n'a pas chargé : image de couverture + tous les éléments d'information, pleinement utilisable (§1.6) |
| Mode économie de données | Un bandeau discret en haut : « Mode économie activé — vidéos désactivées » |
| Fin du fil | « Vous avez vu toutes les campagnes ouvertes » + « Demander un produit » |

**Actions :** glisser vers le haut → campagne suivante · toucher le média → pause de la vidéo · « Commander » → écran 5 · toucher le titre ou le prix → écran 3 · 💬 → écran 10 · recherche → écran 2.

## Écran 2 — Recherche, catégories et résultats

**Objectif :** servir ceux qui cherchent quelque chose de précis — le fil sert la découverte, pas la recherche.

1. En-tête avec champ de recherche actif : « Rechercher un produit… », retour à gauche.
2. **Catégories** en puces défilantes : Alimentaire · Vêtements · Chaussures · Hygiène · Maison · Électronique.
3. **Filtres** en puces : « Se termine bientôt » · « Moins de 10 000 F » · catégorie.
4. **Tri :** fin proche · prix · nombre de commandes.
5. **Résultats** en `CarteCampagne` (liste, pas plein écran), avec le compte : « 7 campagnes ».
6. `BarreNav`, onglet Rechercher actif.

**États :** recherches récentes et suggestions avant toute saisie ; chargement ; **aucun résultat** → `EtatVide` « Aucune campagne pour « lait en poudre » » + bouton « **Demander ce produit** », qui transforme un échec de recherche en demande (écran 11).

## Écran 3 — Détail d'une campagne

**Objectif :** donner tout ce qu'il faut pour décider de payer.

1. **Média** pleine largeur, ratio 4:5, flèche de retour à gauche et **icône de partage à droite**. Si vidéo : lecture au toucher, son coupé par défaut.
2. **Titre :** « Riz parfumé 25 kg »
3. **Prix :** `14 500 F` en `Prix`, `18 000 F` barré, puce « **−19 %** ».
4. **`CompteurTemps`** : « 🕐 Plus que 2 jours — se termine le 7 octobre à 23 h 59 ».
5. **`CompteurParticipants`** : « 32 personnes ont commandé ».
6. **Pseudonyme**, non cliquable, sans aucun autre détail : « Proposé par **Mama Gro** ».
7. **`BandeauConfiance`** version `complet` — **avant le bouton, pas après** :
   > 🛡️ **Groupeurs sélectionnés par Group Achat**
   > Votre paiement est détenu par Group Achat jusqu'à la livraison. Vous êtes livré, ou remboursé.
8. **Ce que contient une part :** « 1 sac de 25 kg », en bloc distinct — c'est la question que tout acheteur se pose en premier.
9. **Description** sur 4 lignes, avec « Voir plus ».
10. **Livraison :** « Livraison à domicile par notre partenaire » · « Sous 3 à 5 jours après la clôture » · frais de livraison. ⚠️ **Le traitement des frais de livraison est un point ouvert du cahier des charges (§11) : dessine cette ligne avec un montant provisoire et attends l'arbitrage.**
11. **Les règles**, en liste à puces :
    - « Paiement à la commande, détenu par Group Achat »
    - « Le groupeur décide à la clôture si la commande passe »
    - « **Si la campagne n'aboutit pas, vous êtes remboursée intégralement** »
    - « **Vérifiez votre commande devant le livreur** : la contestation n'est plus possible après acceptation »

    La dernière règle est à écrire exactement ainsi. Une fenêtre de contestation fermée à la livraison est acceptable si elle est annoncée ; découverte après coup, elle est vécue comme une arnaque (§12 du cahier des charges).
12. **« Questions sur cette campagne »** : les deux plus récentes avec leur réponse, puis « Voir les 7 questions » (écran 10) et un bouton `secondaire` « Poser une question ».
13. **Bouton ancré :** « Commander — 14 500 F ». **Ne demande aucun compte** : il ouvre l'écran 5.

**Bloc Partage** — à dessiner, c'est un levier de croissance. Deux entrées : l'icône sur le média, et un bouton `secondaire` sous les règles. La feuille propose **WhatsApp en premier**, puis « Copier le lien ». Message pré-rempli :

> *Riz parfumé 25 kg à **14 500 F** au lieu de 18 000 F 🌾*
> *Plus que 2 jours — 32 personnes ont déjà commandé.*
> *Livré à domicile. Paiement gardé par Group Achat jusqu'à la livraison.*
> *👉 [lien]*

Le lien doit ouvrir **directement la campagne, consultable sans rien installer ni créer** (§1.5).

**États :** `cloturee` (bouton désactivé « Campagne clôturée » + « Me prévenir de la prochaine campagne sur ce produit »), `annulee` (`Encart` `danger` : « Campagne annulée — les participants ont été remboursés »).

## Écran 4 — Connexion (feuille remontante)

**Objectif :** déclenchée par le paiement, jamais par l'ouverture. Traversée en moins de 20 secondes.

**À dessiner comme une feuille**, pas comme une page : coins supérieurs arrondis 20, poignée de glissement, croix de fermeture à droite, et l'écran d'origine visible derrière sous un voile à 50 %.

**Étape A — numéro**
1. Poignée et croix — **pas de flèche de retour** : on superpose, on ne navigue pas.
2. Titre : « Votre numéro de téléphone »
3. Sous-titre : « Pour sécuriser votre commande et suivre votre livraison. »
4. Champ : `+228` figé à gauche, puis `90 12 34 56`. Clavier numérique.
5. Mention 12 px : « Nous ne communiquons jamais votre numéro au groupeur. »
6. Bouton « Recevoir mon code ».
7. **Rappel de contexte** : « Vous commandez : Riz parfumé 25 kg — 1 part, 14 500 F ».

**Aucun second bouton.** Pas de « Créer un compte » à côté de « Se connecter » (§1.5).

**Étape B — code**
1. Titre : « Entrez le code reçu », sous-titre « Code envoyé au +228 90 12 34 56 » + lien « Modifier ».
2. **Quatre cases** de 56 × 56, espacées de 12.
3. « Renvoyer le code dans 00:42 », grisé puis actif.
4. Validation automatique à la quatrième case — pas de bouton.

**Étape C — le nom, facultative**, seulement si le numéro est inconnu. Champ « Votre nom », phrase « Le livreur en a besoin pour vous remettre votre commande », bouton « Continuer », lien « Plus tard ». Rien d'autre : ni e-mail, ni mot de passe. Chaque champ ajouté ici est un acheteur perdu à un écran du paiement.

**Après validation :** la feuille redescend, **le paiement reprend seul** (écran 6). **Si l'utilisateur ferme :** retour à l'écran 5 intact, quantité et adresse conservées.

**États :** code erroné (cases en `danger` + « Code incorrect. Il vous reste 2 essais. »), code expiré, vérification en cours.

## Écran 5 — Commander : quantité et adresse

**Objectif :** choisir une quantité, saisir une adresse, voir le total. **Aucun compte encore demandé.**

1. En-tête « Commander », retour.
2. **Rappel compact :** vignette 64, « Riz parfumé 25 kg », « 14 500 F la part ».
3. **Sélecteur de quantité :** `−` | `1` | `+`, boutons 48 × 48, valeur en 24 Semibold.
   **Pas de plafond** : il n'y a ni places limitées ni minimum (§7 du cahier des charges). Ne dessine donc **aucune** mention « places disponibles ».
4. **Variantes du produit** si la campagne en a — pour C2, « Taille » ; pour C4, « Pointure ». En puces sélectionnables, obligatoire avant de continuer.
5. **Adresse de livraison**, en bloc :
   - « Quartier » — liste déroulante
   - « Adresse et repères » — texte libre, avec l'exemple « rue des Cocotiers, près de la pharmacie Sodji ». À Lomé, le repère vaut plus que la rue : écris-le dans le placeholder.
   - « Numéro à joindre à la livraison » — pré-rempli après connexion
6. **Récapitulatif :**
   - 1 part × 14 500 F → `14 500 F`
   - Livraison → *(selon l'arbitrage du §11)*
   - **Total à payer** → **`14 500 F`** en `Prix`
7. **`BandeauConfiance`** version courte.
8. Case à cocher « J'accepte les conditions de vente » (lien). Non cochée par défaut, bouton désactivé tant qu'elle ne l'est pas.
9. **Bouton ancré : « Payer 14 500 F ».**

**C'est ce bouton qui déclenche la connexion** (écran 4), et seulement si l'utilisateur n'a pas de compte. S'il en a un, il va droit à l'écran 6. **Deux variantes à prototyper depuis ce bouton.**

## Écran 6 — Paiement Mobile Money

**Objectif :** encaisser réellement, avec assez de clarté pour qu'un acheteur méfiant aille au bout.

1. En-tête « Paiement », retour.
2. **Montant** au centre : `14 500 F` en 32 Bold, puis « Riz parfumé 25 kg — 1 part ».
3. **Moyen de paiement** : deux cartes sélectionnables 100 × 80, **T-Money** et **Flooz**.
4. **Champ numéro**, pré-rempli, modifiable — le numéro de paiement peut différer du numéro du compte.
5. **Rappel :** « Votre argent est détenu par Group Achat, pas versé au groupeur. »
6. Bouton ancré : « Confirmer le paiement ».

**États à dessiner — ce sont eux qui font la différence**

- **En attente de confirmation sur le téléphone :** superposition sombre, indicateur circulaire, « **Validez le paiement sur votre téléphone** », « Saisissez votre code Mobile Money quand il s'affiche », « Ne fermez pas cette page ». C'est l'étape réelle d'un paiement Mobile Money, et l'oublier dans la maquette la rend fausse.
- **Réussi :** passage automatique à l'écran 7.
- **Échec :** `Encart` `danger`, « Le paiement n'a pas abouti. **Aucun montant n'a été débité.** » + « Réessayer » / « Changer de moyen de paiement ». La phrase sur l'absence de débit est celle qui évite la panique.
- **Expiré :** « Vous n'avez pas validé le paiement à temps. Aucun montant n'a été débité. »
- **Campagne clôturée entre-temps :** « Cette campagne vient de se clôturer. Aucun montant n'a été débité. »

**Si le paiement réel n'est pas prêt pour la compétition** (§17.2 du cahier des charges), ajoute en haut un `Encart` `info` : « **Démonstration** — aucun paiement réel n'est effectué. » Ne le cache pas : un jury qui découvre seul que le paiement est faux le prend bien plus mal que s'il l'a lu.

## Écran 7 — Confirmation de commande

**Objectif :** l'écran qui transforme un paiement en confiance.

1. Pas de retour — on ne revient pas sur un paiement. Croix de fermeture à droite.
2. **Pastille de succès :** rond `succes-fond` 72, coche `succes` 40.
3. **Titre :** « Commande confirmée »
4. **Sous-titre :** « Vous êtes la 33ᵉ personne à commander cette campagne. »
5. **`BandeauConfiance` en version développée** — le plus grand de l'application :
   > 🛡️ **Vos 14 500 F sont détenus par Group Achat**
   > Ils ne sont versés au groupeur qu'une fois la campagne confirmée. **Si elle n'aboutit pas, vous êtes remboursée intégralement.**
6. **`FriseEtapes`**, première étape active :
   - ✅ **Paiement reçu** — argent détenu par Group Achat
   - ⏳ **Clôture de la campagne** — 7 octobre
   - 📦 **Commande chez le fournisseur** — par le groupeur
   - 🛵 **Livraison à domicile** — sous 3 à 5 jours
7. **`Encart` `attention`**, à ne pas omettre : « **Vérifiez votre commande devant le livreur.** Vous pourrez refuser le colis s'il ne correspond pas, mais plus après l'avoir accepté. »
8. **Rappel de l'adresse** saisie, avec un lien « Modifier » actif tant que la campagne n'est pas clôturée.
9. Deux boutons : « Suivre ma commande » (primaire), « Voir d'autres campagnes » (secondaire).

## Écran 8 — Mes commandes

1. En-tête « Mes commandes ».
2. **Onglets :** « En cours (3) » / « Terminées (2) ».
3. **Liste**, pastille `Statut` en évidence :

| Produit | Montant | Statut |
|---|---|---|
| Riz parfumé 25 kg — Mama Gro | 14 500 F | **En cours de livraison** — arrive demain |
| Robe wax — Chez Sika | 7 500 F | **Commande en cours chez le groupeur** |
| Huile de palme 20 L — Mama Gro | 11 200 F | **Payée — en attente de clôture** — 6 jours |
| Baskets homme — Lomé Deals | 9 800 F | **Livrée** — 28 septembre |
| Savon de Marseille — Chez Sika | 9 500 F | **Remboursée** — campagne annulée |

La ligne « Remboursée » est à garder : elle montre que la promesse de remboursement n'est pas qu'une phrase dans les conditions.

4. Sur la ligne « En cours de livraison », le code est accessible sans ouvrir le détail : « Votre code : **K7M-4PQ** ». C'est le geste fait debout devant le livreur.

**Deux états vides à distinguer :** non connecté → l'état pédagogique du §1.5 ; connecté sans commande → « Vous n'avez pas encore commandé » + « Voir les campagnes ».

## Écran 9 — Détail d'une commande et suivi

**Objectif :** porter le suivi et le code de livraison.

1. En-tête « Ma commande », retour.
2. **Pastille `Statut`** large.
3. **`CodeLivraison`** quand la livraison est en cours — le bloc dominant :
   - QR code 160 × 160, `K7M-4PQ` en style `Code`
   - « Montrez ce code au livreur »
   - Lien « Augmenter la luminosité » — en plein soleil, un écran sombre ne se scanne pas
4. **`FriseEtapes`** avec l'étape atteinte et les dates.
5. **Récapitulatif :** vignette, produit, 1 part, 14 500 F, « Payée le 5 octobre ».
6. **Adresse de livraison** et numéro joignable. **Aucun contact du groupeur** (§1.7) — ni numéro, ni bouton d'appel. À la place : « Une question ? » vers l'écran 10.
7. **`Encart` `attention`**, tant que la livraison n'est pas faite : « **Vérifiez votre commande devant le livreur.** Vous pouvez refuser le colis s'il ne correspond pas à votre commande. »
8. **Bouton « Refuser le colis »** en `danger-texte`, visible **uniquement** pendant la livraison.

**Les six états à dessiner — ils racontent tout le circuit**

| État | Ce qui change |
|---|---|
| **Payée — en attente de clôture** | Pas de code. « Votre code apparaîtra ici quand la livraison sera lancée. » Compteur : « Clôture dans 2 jours » |
| **Campagne clôturée** | « Le groupeur confirme la commande sous 48 h. Vos 14 500 F sont toujours détenus par Group Achat. » |
| **Commande en cours chez le groupeur** | « Le groupeur a passé commande chez son fournisseur. » |
| **En cours de livraison** | Le code est affiché. État principal ci-dessus. Bouton « Refuser le colis » actif |
| **Livrée** | Coche `succes`, « Livrée le 11 octobre ». Le code et le bouton de refus disparaissent |
| **Campagne annulée** | `Encart` `danger` : « Cette campagne n'a pas abouti. **Vos 14 500 F vous ont été remboursés le 8 octobre.** » |

**Feuille « Refuser le colis »** : motif (ce n'est pas le produit commandé · produit visiblement abîmé · autre), description, photos, bouton « Refuser et signaler ». Puis : « Votre signalement est enregistré. Vos 14 500 F restent détenus par Group Achat pendant l'examen. »

## Écran 10 — Questions sur une campagne

**Objectif :** obtenir une information manquante sans jamais sortir de la plateforme. C'est ce qui rend l'anonymat du groupeur supportable.

1. En-tête « Questions », retour, rappel de la campagne : vignette 48 + « Riz parfumé 25 kg ».
2. **Champ de question** en haut : « Posez votre question sur ce produit… », 2 lignes, bouton « Envoyer ».
3. **Mention sous le champ**, 12 px : « Votre question et la réponse seront visibles par tout le monde. » À lire avant d'écrire.
4. **Liste des questions**, la plus récente en haut :
   - question en `Corps`, auteur « Akosua D. » et date en `Petit`
   - réponse en retrait, fond `fond`, bordure gauche 3 px `primaire`, avec « **Mama Gro** » et la date
   - une question sans réponse porte une pastille `En attente de réponse`

**Contenu à écrire dans la maquette** — du vrai contenu, c'est ce qui rend l'écran crédible :

| Question | Réponse |
|---|---|
| « C'est du riz parfumé de quelle marque ? » — Akosua D. | « Riz parfumé Delice, sac de 25 kg, récolte 2025. » — Mama Gro |
| « La livraison va jusqu'à Adidogomé ? » — Yawa T. | « Oui, tout Lomé est couvert. Comptez un jour de plus pour Adidogomé. » — Mama Gro |
| « On peut prendre 2 sacs ? » — Kossi A. | « Oui, mettez 2 dans la quantité. » — Mama Gro |
| « Est-ce qu'on peut payer à la livraison ? » — Dodzi M. | *En attente de réponse* |

5. **`Encart` `attention` en bas de liste** : « N'échangez jamais de numéro de téléphone. Votre paiement n'est protégé que sur Group Achat. » À dessiner, pas à sous-entendre (§1.7).

**La connexion est demandée au bouton « Envoyer »**, pas à l'ouverture : la lecture est libre.

**État vide :** « Aucune question pour le moment » + « Soyez le premier à poser une question ».

---

# Lot 2 — la demande crée l'offre

## Écran 11 — Demander un produit

**Objectif :** un formulaire si court qu'on le remplit en marchant. Cinq champs.

1. En-tête « Demander un produit », retour.
2. Accroche : « Dites ce que vous cherchez. Nos groupeurs le verront et pourront lancer une campagne. »
3. **Les champs :**
   - « Quel produit ? » — texte, avec suggestions à la saisie
   - « Quelle quantité ? » — texte court (« 20 litres », « 2 paires »)
   - « Votre quartier » — liste déroulante
   - « Budget maximum (facultatif) » — montant
   - « Photo ou précisions (facultatif) » — dépôt + texte
4. **`Encart` `info`** : « 32 personnes ont déjà demandé de l'huile de palme à Bè cette semaine. Votre demande rejoindra la leur. » Dynamique selon la saisie — c'est ce qui donne l'impression d'un marché vivant.
5. Bouton ancré « Envoyer ma demande ».

**La connexion n'est demandée qu'à l'envoi.** Les cinq champs se remplissent sans compte, et **tout ce qui a été saisi, photo comprise, est conservé** pendant la connexion, puis l'envoi reprend seul.

**Après envoi :** « Demande envoyée », « Nous vous prévenons dès qu'un groupeur lance une campagne », boutons « Voir mes demandes » / « Retour au fil ».

## Écran 12 — Mes demandes

1. En-tête « Mes demandes ».
2. Liste avec pastille `Statut` :

| Demande | Statut |
|---|---|
| Huile de palme, 20 L — Bè | **Campagne lancée !** — « Mama Gro a lancé une campagne » + bouton « Commander » |
| Lait en poudre, 2 kg — Tokoin | **Prise en charge** — « Un groupeur prépare une campagne » |
| Charbon, 1 sac — Tokoin | **En attente** — « 8 personnes ont demandé la même chose » |
| Ventilateur — Agoè | **Non aboutie** — « Aucun groupeur n'a pu trouver ce produit » |

La première ligne ferme la boucle du produit : une demande devient une campagne qu'on peut commander. C'est la ligne à montrer au jury. La dernière est honnête et doit exister : une demande peut ne rien donner, et l'acheteur doit l'apprendre (§8 du cahier des charges).

3. **États vides :** connecté sans demande, et non connecté (§1.5).

---

# Lot 3 — côté groupeur

## Écran 13 — Tableau de bord groupeur

1. **En-tête :** « Bonjour Mama Gro », pseudonyme et non nom réel, même sur son propre écran.
2. **Quatre tuiles**, grille 2 × 2 :
   - **3** campagnes ouvertes
   - **74** commandes
   - **464 000 F** collectés
   - **86 450 F** disponibles
3. **« À faire aujourd'hui »** — la section qui donne une raison d'ouvrir l'application :
   - 🔴 « **Riz parfumé — campagne clôturée, décidez sous 41 h** » → écran 16
   - 🟠 « **Déposez le reçu d'achat — Robe wax** » → écran 17
   - 🟣 « **3 questions sans réponse** » → écran 20
   - 🔵 « 4 nouvelles demandes dans votre quartier » → écran 19
4. **« Mes campagnes »** : liste compacte avec compteur de commandes, temps restant et statut.
5. **Bouton flottant** « + Créer une campagne », 56 × 56, en bas à droite, fond `accent` avec icône `#14181F` — le seul élément orange plein de l'interface groupeur, donc le plus repérable.
6. `BarreNav` version groupeur.

## Écran 14 — Créer une campagne

**Trois étapes** avec indicateur de progression : un formulaire de douze champs sur un seul écran mobile ne se remplit pas.

**Étape 1 — le produit**
Nom · catégorie · **média** (jusqu'à 3 photos **ou une vidéo verticale de 15 s**) · description · ce que contient une part.

Sur le média, une consigne à afficher dans le formulaire : « Une vidéo verticale filmée au téléphone marche très bien. Une photo nette suffit aussi. » Les groupeurs sans moyens de tournage ne doivent pas se sentir exclus du fil (§1.6).

**Étape 2 — le prix et la durée**
Prix par part · prix au détail, pour afficher l'économie · quantité par part · **durée de la campagne** (3, 7, 14 jours, ou une date) · variantes éventuelles (tailles, pointures, coloris).

**Un aperçu en direct de la `CarteFil`** telle que les acheteurs la verront, mis à jour à la saisie. Il évite les erreurs de prix et rend le formulaire moins aride.

Sous le prix, le calcul affiché : « Sur 14 500 F, vous recevrez **13 775 F** par part. Commission Group Achat : 725 F (5 %). » La commission se dit au moment de fixer le prix, pas au moment de verser.

**Étape 3 — la livraison**
Délai de livraison annoncé · zones couvertes · « J'ai mon propre livreur » ou « J'utilise le service partenaire de Group Achat ».

**Écran de fin :** récapitulatif + « Publier la campagne ». Puis une confirmation avec **« Partager sur WhatsApp »** bien visible : c'est par là que les groupeurs amènent leurs contacts existants, et l'ignorer serait ignorer comment ce marché fonctionne.

**Variante pré-remplie** (arrivée depuis l'écran 19) : `Encart` `info` en haut, « Créée à partir de 32 demandes pour « Huile de palme » à Agoè », champs déjà remplis.

## Écran 15 — Gérer une campagne

1. En-tête « Riz parfumé 25 kg », retour, icône « modifier ».
2. **Bandeau de synthèse :** « 32 commandes » · « 464 000 F collectés » · `CompteurTemps` « Plus que 2 jours ».
3. **Actions :** « Partager » · « Clôturer maintenant » · « Prévenir les participants ».
4. **Liste des commandes**, 32 lignes : initiales en rond, prénom et initiale (« Akosua D. »), quantité, variante choisie, montant, quartier de livraison.
5. **Répartition par quartier**, en petit tableau — utile au groupeur pour organiser les tournées, et c'est une information qu'il n'a nulle part ailleurs.

**Point de conception :** affiche un prénom et une initiale, **jamais le numéro de téléphone de l'acheteur**. L'écran 4 promet à l'acheteur que son numéro n'est pas communiqué au groupeur : l'écran du groupeur doit tenir cette promesse. Le numéro ne va qu'au livreur, au moment de la livraison.

## Écran 16 — Clôturer et décider

**Objectif :** le point de bascule de la campagne. **C'est l'écran le plus important côté groupeur**, et il n'a pas d'équivalent dans une application de vente classique.

1. En-tête « Décision », retour désactivé — on ne quitte pas cet écran sans décider ou sans le refermer explicitement.
2. **`Encart` `attention` avec compte à rebours :**
   > ⏳ **La campagne est clôturée**
   > 32 commandes · **464 000 F collectés** · il vous reste **41 h** pour décider.
   > Sans décision, les acheteurs seront remboursés automatiquement.
3. **Récapitulatif de la décision :**
   - Collecté : `464 000 F`
   - Commission Group Achat (5 %) : `− 23 200 F`
   - **Avance d'achat versée maintenant : `324 800 F`**
   - **Solde versé après les livraisons : `116 000 F`**
4. **`Encart` `info`** expliquant le versement en deux temps : « L'avance vous permet d'acheter la marchandise. Le solde vous est versé une fois les livraisons confirmées. » Un groupeur qui découvre la retenue au moment du versement se sent trompé — elle doit être dite ici, et déjà à l'écran 14.
5. **Deux boutons :**
   - « **Je passe la commande** » (primaire) → confirmation : « Vous vous engagez à livrer les 32 commandes. Déposez ensuite le devis de votre fournisseur. » → écran 17
   - « J'annule la campagne » (`danger-texte`) → confirmation : « Les 32 acheteurs seront remboursés intégralement. Aucune commission ne vous sera prélevée. »

**Le compte à rebours n'est pas décoratif** : passé 48 h, la plateforme annule et rembourse (§8.2 du cahier des charges). L'afficher en heures, pas en date.

## Écran 17 — Déposer un justificatif d'achat

**Objectif :** la pièce maîtresse du dispositif de sécurisation (§10 du cahier des charges). À traiter avec autant de soin que le paiement.

**Deux dépôts successifs, dans cet ordre.**

**A — Le devis, avant de recevoir l'avance**
1. Titre : « Devis de votre fournisseur »
2. Phrase : « Déposez le devis ou la facture. L'avance vous est versée après vérification. »
3. Champs : montant du devis · nom du fournisseur · **photo ou PDF du document** (zone de dépôt).
4. Bouton « Envoyer pour vérification ».
5. **État d'attente :** « En cours de vérification — réponse sous 4 h ouvrées » avec `FriseEtapes`.

**B — Le reçu, après l'achat**
1. Titre : « Reçu de paiement »
2. **`Encart` `attention` avec délai** : « Déposez votre reçu **avant le 9 octobre à 14 h**. Sans reçu, la campagne est annulée et les acheteurs remboursés. » Le délai doit être une date et une heure, pas « sous 72 h ».
3. Champs : montant payé · date · photo du reçu.
4. Bouton « Envoyer ».

**États à dessiner :** à déposer · en vérification · **refusé** (`Encart` `danger` : « Document illisible. Déposez une photo plus nette. » + bouton « Déposer à nouveau ») · validé (coche `succes` + « Avance de 324 800 F versée le 7 octobre »).

L'état *refusé* est celui qu'on oublie et celui qui arrivera le plus souvent : une photo de reçu prise à la va-vite dans un marché est rarement nette du premier coup.

## Écran 18 — Portefeuille groupeur

**Objectif :** montrer où est l'argent et à quel titre. C'est l'écran qui explique le modèle économique sans un mot de pitch.

1. En-tête « Portefeuille ».
2. **Carte principale**, fond `primaire`, texte blanc : « Disponible » / **`86 450 F`** / bouton blanc « Retirer mes fonds ».
3. **Trois tuiles :**
   - **324 800 F** — « Avance versée » — « Pour l'achat de la marchandise » — icône panier
   - **116 000 F** — « Solde retenu » — « Versé après les livraisons » — icône horloge
   - **23 200 F** — « Commission Group Achat » — « 5 % sur les campagnes abouties » — icône pourcentage
4. **`Encart` explicatif**, à ne pas omettre : « Votre solde vous est versé une fois les livraisons de la campagne confirmées. La commission n'est prélevée que sur les campagnes abouties. »
5. **Historique**, lignes datées :

| Date | Libellé | Montant |
|---|---|---|
| 11 oct. | Solde versé — Riz parfumé (32 livraisons) | **+116 000 F** |
| 11 oct. | Commission Group Achat (5 %) | −23 200 F |
| 7 oct. | Avance d'achat — Riz parfumé | +324 800 F |
| 7 oct. | Devis fournisseur validé | — |
| 28 sept. | Solde versé — Baskets homme | +72 400 F |
| 20 sept. | Campagne annulée — Savon de Marseille | **Aucune commission** |

La dernière ligne vaut d'être montrée : elle prouve qu'aucune commission n'est prélevée sur une campagne annulée, comme l'annonce le §7 du cahier des charges.

## Écran 19 — Fil des demandes (groupeur)

**Objectif :** transformer une masse de demandes en décision commerciale. **Agrégé, jamais une liste brute.**

1. En-tête « Demandes », icône de filtre.
2. **Filtres :** « Mon quartier » · « Toutes » · « Cette semaine ».
3. **Cartes de demande agrégée :**

```
┌──────────────────────────────────────┐
│ Huile de palme                       │
│ 🔥 32 personnes · Agoè · 7 jours     │
│ Budget moyen indiqué : 11 500 F      │
│ Volume estimé : 640 L                │
│         [ Lancer une campagne ]      │
└──────────────────────────────────────┘
```

Trois autres : Lait en poudre (18, Tokoin) · Charbon (14, Bè) · Couches bébé (9, Adidogomé).

4. Lien discret « Voir les 32 demandes » pour le détail.
5. **`Encart` `info`** : « Les produits les plus demandés sont ceux où vous avez le moins de concurrence. »

**« Lancer une campagne » ouvre l'écran 14 pré-rempli** : produit, quantité estimée, quartier, prix suggéré. C'est tout l'intérêt de l'écran — à matérialiser dans le prototypage.

## Écran 20 — Questions reçues (groupeur)

1. En-tête « Questions », compteur « 3 sans réponse ».
2. **Filtres :** « Sans réponse (3) » · « Toutes ».
3. **Liste groupée par campagne** : vignette, nom, puis les questions avec auteur, date, texte, et un champ de réponse dépliable + bouton « Répondre ».
4. **`Encart` `info`** : « Une réponse publique profite à tous vos participants et rassure les visiteurs. »

Une question sans réponse est une vente qui n'a pas lieu : c'est pourquoi elle figure dans « À faire aujourd'hui » de l'écran 13.

---

## 4. Ce qu'il faut prototyper dans Figma

Un enchaînement cliquable vaut dix écrans statiques. Quatre parcours :

1. **Commander :** 1 *(glisser 2 ou 3 cartes)* → 3 → 5 → **[feuille 4A → 4B]** → 6 → *(attente de validation)* → 7 → 8 → 9
2. **Livraison :** 9 en état *en cours de livraison* → code affiché → 9 en état *livrée*
3. **Groupeur :** 13 → 16 → *(je passe la commande)* → 17A → *(validé)* → 18
4. **Demande :** 11 → *(confirmation)* → 12, puis 19 → 14

Six détails qui font la différence devant un jury :

- le **défilement du fil** sur au moins trois cartes, dont une vidéo ;
- le **parcours libre jusqu'au paiement**, sans jamais demander de compte ;
- la **reprise de l'action après connexion** : la feuille redescend, le paiement continue ;
- l'**attente de validation Mobile Money**, qui est l'étape réelle du paiement ;
- l'**écran de décision du groupeur** (16), avec son compte à rebours et son calcul avance/solde ;
- au moins un **cas d'erreur** cliquable — le reçu refusé à l'écran 17 est le plus parlant.

## 5. À vérifier avant de présenter

- [ ] Aucun *Lorem ipsum*, aucun « Produit 1 » sur aucun écran.
- [ ] Les montants concordent : 14 500 F la part, 464 000 F collectés, 324 800 F d'avance, 116 000 F de solde, 23 200 F de commission.
- [ ] Le `BandeauConfiance` est présent sur les écrans 1, 3, 5, 7 et 9.
- [ ] L'avertissement « vérifiez votre commande devant le livreur » figure sur les écrans 3, 7 et 9.
- [ ] **Aucun contact de groupeur sur un écran acheteur**, et **aucun numéro d'acheteur sur un écran groupeur**.
- [ ] **Le pseudonyme du groupeur n'est cliquable nulle part**, et aucune page de profil n'existe.
- [ ] Aucune mention de « places disponibles », de minimum de participants ou de jauge à remplir.
- [ ] Le fil a son **état image seule** et son **mode économie de données** dessinés.
- [ ] Le son des vidéos est **coupé par défaut**, avec son icône visible.
- [ ] Chaque liste a son état vide, et les onglets protégés leur variante « non connecté ».
- [ ] L'écran 17 a son état **refusé**.
- [ ] Nulle part de texte blanc sur orange `#FF6A00`, ni de texte orange sur blanc.
- [ ] Tous les textes de bouton sont des verbes d'action, pas « OK » ni « Valider » seul.
