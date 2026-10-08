# Le site vitrine

Ce dossier contient le **site de présentation** de Group Achat — pas l'application. Son rôle est
d'expliquer la solution à quelqu'un qui n'a jamais rien vu du produit : le problème qu'elle règle,
ce que devient l'argent, à quoi ressemblent les **deux interfaces**, et pourquoi l'argent d'un
acheteur ne risque rien.

Il reste écrit en HTML, CSS et JavaScript simples, **sans aucune étape de construction et sans
dépendance**. Un site de présentation doit se charger vite sur un forfait data limité et survivre
aux changements du prototype React sans rien casser : il ne partage avec lui que les logos.

```
frontend/public/presentation/
├── index.html    La page entière — dix sections
├── styles.css    Les jetons du §1.2 et toute la mise en forme
├── script.js     Purement additif : lien actif et apparition au défilement
└── medias/       Les logos et le favicon, copiés de ../../src/assets/
```

## Où il vit, et pourquoi là

**Il est servi par la boutique, sur le même port** — plus de service Docker ni de port à lui.

| | Adresse |
|---|---|
| Développement | <http://localhost:5173/presentation/> |
| Conteneur | <http://localhost:5173/presentation/> |

Il est dans `frontend/public/`, donc **Vite le recopie tel quel** dans `dist/` : il n'est ni
compilé, ni passé par Rollup, ni touché par le typage. Les deux propriétés qui comptent — aucune
étape de construction, aucune dépendance — sont donc conservées, alors qu'il bénéficie du même
serveur que l'application.

⚠️ **La boutique reste à la racine**, la présentation est sous un sous-chemin. C'est le §1.5 qui
tranche : « un site marchand s'ouvre sur son catalogue ». Mettre la présentation à `/` reviendrait
à poser une page d'explications entre le visiteur et les groupages.

⚠️ **Il n'est pas dans le paquet de l'administration.** `vite.admin.config.ts` a son propre
`publicDir` (`public-admin/`, qui ne contient que le favicon) : sans cela, l'outil interne
embarquerait une centaine de kilo-octets de pages marketing, et `localhost:5174/presentation/`
aurait servi la vitrine depuis le port de l'administration.

## Le faire tourner

```bash
cd frontend && npm run dev       # puis /presentation/
```

Ouvrir `index.html` directement dans un navigateur marche aussi, ses liens étant tous relatifs.

## La direction visuelle

C'est un croisement de deux des trois pistes proposées : **la sobriété fiduciaire** d'un côté,
**l'ouverture coupée en deux** de l'autre.

**Blanc, filets fins, bleu dominant.** Les cartes n'ont pas d'ombre, les rayons ne dépassent pas
8 px, les sections sont séparées par des filets d'un pixel. Cette retenue n'est pas une préférence :
l'argument de vente du produit est la fiabilité (§3 du cahier, « notre force, c'est la sécurité »),
et une page qui ressemble à du commerce festif ne rassure pas quelqu'un qui hésite à confier
5 000 F à un inconnu.

**L'objet principal de la page est un relevé, pas une photo.** 128 000 F collectés, −6 400 F de
commission, 121 600 F versés : l'arithmétique est montrée en entier parce que c'est elle qui est
crédible. Les cinq mesures de sécurité suivent, numérotées 01 à 05 en colonnes filetées.

**L'ouverture est coupée en deux dans la hauteur** : moitié gauche sur fond orange pâle pour
l'acheteur, moitié droite sur aplat bleu pour le groupeur, chacune avec son téléphone. C'est la
seule façon de dire en une image que le produit sert deux publics — et de rendre lisible d'un coup
d'œil la règle des deux chromes.

## La barre de navigation ne dépend d'aucun script

**C'est une règle, pas un détail d'implémentation.** Les liens sont écrits en clair dans le HTML et
restent visibles à toutes les largeurs. Sous 900 px, le CSS les fait simplement passer sur une
deuxième ligne, qui défile horizontalement si elle n'y tient pas.

La première version de cette page masquait les liens sous 860 px et les remettait derrière un bouton
hamburger géré par `script.js`. Résultat : dès que le script ne se chargeait pas — fichier ouvert
en `file://`, aperçu d'un éditeur, réseau coupé au mauvais moment — **il ne restait aucune
navigation**, juste un bouton inerte. Ne pas réintroduire de menu qui a besoin de JavaScript pour
exister. Si un jour il faut un menu repliable, il se fait en CSS seul.

`script.js` ne fait plus que deux choses, et les deux sont décoratives : surligner le lien de la
section lue, et faire apparaître les blocs au défilement. La page est entièrement lisible et
navigable sans lui.

## Les règles produit respectées par cette page

Ce ne sont pas des préférences de style, ce sont les décisions du `CLAUDE.md` et du §1.2 de
`SPEC_ECRANS_FIGMA.md`.

- **Les deux chromes ne sont jamais inversés.** Tout ce qui parle de l'acheteur est orange
  (`#CC4A00`, blanc dessus à 4,62:1) ; tout ce qui parle du groupeur est bleu (`#1E3A8A`, blanc
  dessus à 10,36:1) — jusqu'aux étiquettes des cartes du problème. L'orange vif `#FF6A00` ne porte
  que du **texte sombre** (6,20:1) ; du blanc dessus tomberait à 2,87:1, ce qui est interdit.
- **Tous les contrastes sont calculés.** Le plus faible de la page est 4,62:1, et c'est le blanc sur
  `#CC4A00`. Aucune teinte ne s'ajoute sans refaire le calcul.
- **Aucun prix barré, aucun badge de réduction, aucun « au lieu de »**, nulle part.
- **La formulation sur l'argent est « détenu jusqu'à la clôture »**, jamais « bloqué jusqu'à la
  livraison » — le groupeur est payé intégralement à la clôture, et la page ne doit pas raconter le
  contraire.
- **La commission de 5 %** est dite à la charge du groupeur, et la page précise qu'elle ne porte pas
  sur les frais de livraison.
- **Les frais de livraison sont annoncés à 1 000 F** et la page dit franchement que la grille des
  transporteurs n'est pas encore arrêtée, plutôt que d'inventer un tarif.
- **L'anonymat est présenté dans les deux sens**, avec la seule exception assumée : la feuille de
  tournée du livreur.

## Les chiffres de la page

Ceux du jeu de démonstration, et les additions tombent juste — un jury vérifie.

| | |
|---|---|
| Part — Écouteurs filaires avec micro | 4 000 F |
| Livraison (Tokoin) | 1 000 F |
| **Total payé par l'acheteuse** | **5 000 F** |
| Collecté — 32 parts | 128 000 F |
| Commission 5 % | − 6 400 F |
| **Versé à la groupeuse à la clôture** | **121 600 F** |

Code de livraison `K7M-4PQ` · acheteuse Akosua Doe, Tokoin · groupeuse Mama Gro.

**Chacun de ces nombres apparaît à plusieurs endroits** : la section « Le circuit de l'argent », le
téléphone « Commander » et le téléphone « Portefeuille ». Les modifier demande de les corriger
partout.

## Ce qui reste à fournir

- Les écrans dans les cadres de téléphone sont **reconstitués en CSS**, pas des captures. Les
  exports PNG des maquettes Figma les remplaceront avantageusement.
- Cette version ne contient **aucune photographie** — c'est un choix de la direction retenue, qui
  tient debout sans images. Le jour où `../medias/` sera rempli, la section du problème et
  l'ouverture pourront en accueillir.
- L'adresse `contact@groupachat.tg` des boutons d'appel **reste à créer**.
