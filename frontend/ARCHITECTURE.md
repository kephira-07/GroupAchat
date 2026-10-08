# Architecture du front

À lire avant d'ajouter un fichier. Le code est rangé selon **deux axes** qui se
croisent, et les deux règles qui comptent sont celles des dépendances.

## Les deux axes

**L'axe des rôles, d'abord.** Le produit n'est pas une application mais quatre,
et elles ne partagent presque rien : un écran acheteur et un écran groupeur
n'ont ni la même couleur, ni le même vocabulaire, ni le même utilisateur. Chaque
rôle a donc son dossier, qui contient **tout ce qui n'intéresse que lui** — son
routeur, ses pages, ses composants, son chrome.

**L'axe des couches, ensuite**, à l'intérieur de chaque rôle et à la racine pour
ce qui est partagé : `pages → mise-en-page → composants → ui`, avec `domaine` et
`donnees` à côté.

Le test pour savoir où va un fichier est en deux temps : *est-ce qu'un seul rôle
s'en sert ?* — alors il va dans le dossier de ce rôle. Puis : *est-ce que ça
marcherait encore si on remplaçait React par autre chose ?* — alors c'est du
domaine.

```
src/
├── App.tsx            La boutique : acheteur, groupeur, livreur. Pas l'admin.
├── main.tsx           Point d'entrée de la boutique      — index.html, port 5173
├── admin/main.tsx     Point d'entrée de l'administration — admin.html, port 5174
├── index.css          Les jetons de couleur et les polices. La seule feuille de style,
│                      partagée par les deux applications.
│
│   ——— Les quatre rôles ———
│
├── acheteur/          Écrans 1 à 12 — chrome orange (§1.2)
│   ├── ApplicationAcheteur.tsx  Le routeur côté acheteur
│   ├── pages/           Les onze écrans : Fil, GroupagesOuverts, DetailGroupage,
│   │                    Commander, Paiement, Confirmation, MesCommandes,
│   │                    DetailCommande, Questions, DemanderProduit, MesDemandes
│   ├── mise-en-page/    BarreNav §2.2 · EnTeteApplication · EnTeteEcran ·
│   │                    EnTeteBureau · PiedPage
│   └── composants/      LigneGroupage §2.3 · CompteurTemps §2.4 ·
│                        CompteurParticipants §2.5 · BandeauConfiance §2.6 ·
│                        CodeLivraison §2.10 · BandeauPartenaires §2.14 ·
│                        CarteGroupage · RechercheEtFiltres · PanneauFiltres ·
│                        FeuilleConnexion
│
├── groupeur/          Écrans 13 à 21 — chrome bleu (§1.2)
│   ├── ApplicationGroupeur.tsx  Le routeur côté groupeur
│   ├── pages/           Les dix écrans : Inscription, TableauDeBord,
│   │                    CreerCampagne, GererCampagne, Decision, Justificatif,
│   │                    Portefeuille, QuestionsRecues, FilDemandes, Statistiques
│   └── mise-en-page/    ChromeGroupeur — en-tête et barre de nav bleus
│
├── admin/             Écran A1 — chrome neutre, 1 280 × 800
│   └── pages/           TableauDeBordAdmin
│
├── livreur/           Écran 22 — le seul écran qui réunit nom, adresse et téléphone
│   └── pages/           TourneeLivreur
│
│   ——— Ce qui est partagé ———
│
├── domaine/           Les règles métier. Zéro React, zéro JSX.
│   ├── groupage.ts      Le modèle d'un groupage, catégories, quartiers
│   ├── commande.ts      Commande, position, statuts (§2.8)
│   ├── demande.ts       Questions publiques et demandes de produit
│   ├── groupeur.ts      Campagnes, portefeuille, statistiques, commission
│   ├── inscription.ts   Le dossier d'un groupeur candidat
│   ├── livreur.ts       La tournée — le seul modèle qui porte des identités
│   ├── admin.ts         Alertes, files de travail, indicateurs
│   ├── filtres.ts       Modèle de filtrage, seuils, tri — une seule implémentation
│   ├── livraison.ts     Frais de livraison, code de livraison
│   ├── moderation.ts    Le filtre des messages publics (§14.2)
│   └── format.ts        Montants, dates, temps restant
│
├── donnees/           Les jeux de démonstration. Rien que des tableaux.
│   ├── groupages.ts     Les 16 groupages        ├── groupeur.ts  Mama Gro
│   ├── commandes.ts     Les 5 commandes         ├── tournee.ts   La tournée du jour
│   ├── questions.ts     Questions et demandes   ├── admin.ts     Files et indicateurs
│   └── annonceurs.ts    Les bannières publicitaires
│
├── ui/                Le design system du §2. Ne connaît aucune notion métier.
│   ├── Bouton.tsx       §2.7      ├── EtatVide.tsx        §2.12
│   ├── Champ.tsx        §2.9      ├── FriseEtapes.tsx     §2.13
│   ├── Encart.tsx       §2.11     ├── Statut.tsx          §2.8
│   ├── Carrousel.tsx              ├── FeuilleRemontante.tsx
│   ├── Icones.tsx                 ├── Logo.tsx
│   └── chrome.ts        Le type `RoleChrome` : orange ou bleu (§1.2)
│
├── composants/        Les composants métier utilisés par PLUSIEURS rôles.
│   └── Vignette.tsx     L'image d'un groupage — acheteur et groupeur
│
├── mise-en-page/      Le chrome partagé.
│   └── SelecteurRole.tsx  Outil de démonstration — à retirer
│
├── pages/             Les écrans d'avant le choix du rôle.
│   ├── PageDemarrage.tsx  L'écran 0
│   └── ChoixProfil.tsx    « Acheter » ou « Grouper »
│
└── hooks/
    └── useEstBureau.ts  La bascule téléphone / site, à 768 px
```

## La première règle : un rôle n'importe jamais un autre rôle

`acheteur/` ne connaît pas `groupeur/`, et réciproquement. Aucune exception.

Ce n'est pas du rangement : c'est la seule chose qui empêche un chrome de fuir
dans l'autre. Le jour où une page groupeur importe un en-tête acheteur, elle
devient orange, et la règle de dominance du §1.2 est cassée sans que rien ne le
signale. Un `grep` suffit à le vérifier :

```bash
grep -rn "acheteur/" src/groupeur src/admin src/livreur
grep -rn "groupeur/" src/acheteur src/admin src/livreur
```

Les deux doivent ne rien renvoyer.

**Quand deux rôles ont besoin de la même chose**, elle remonte à la racine — et
pas chez le voisin. C'est ce qui est arrivé à `Vignette`, le seul composant
métier que l'acheteur et le groupeur partagent vraiment. Avant de faire
remonter un fichier, vérifiez que c'est bien le même besoin : `EnTeteEcran` et
`ChromeGroupeur` se ressemblent, mais les fusionner aurait produit un composant
avec un `if` sur la couleur, c'est-à-dire exactement la porte par laquelle le
chrome fuit.

## La seconde règle : une couche ne connaît que celles qui sont en dessous

```
pages  →  mise-en-page  →  composants  →  ui
   ↓            ↓              ↓
          domaine  ←  donnees
```

Concrètement :

- `ui/` **n'importe jamais** `domaine/groupage`, `donnees/` ni `composants/`.
  Un `Bouton` qui saurait ce qu'est un groupage ne serait plus réutilisable.
  La seule exception est `Statut`, qui importe le type des statuts — un type,
  pas une donnée ;
- `domaine/` **n'importe jamais** React. On doit pouvoir tester `filtrerEtTrier`
  ou `verifier` sans monter un composant ;
- `donnees/` ne contient **que des tableaux**. Si vous écrivez une fonction
  dans `donnees/`, elle va dans `domaine/` ;
- `pages/` ne contient **aucune règle métier**. Une page assemble et branche ;
  elle ne décide pas d'un seuil.

**`domaine/` et `donnees/` ne sont pas découpés par rôle**, même quand un
fichier ne sert aujourd'hui qu'à un seul — `admin.ts`, `livreur.ts`. C'est
volontaire : il n'y a qu'un seul modèle de commande et qu'une seule campagne,
vus de quatre côtés différents. Dupliquer le modèle par rôle, c'est garantir que
les quatre copies divergeront. La frontière des rôles s'arrête donc à
l'interface.

## Pourquoi pas de fichiers `index.ts` de regroupement

Les imports sont écrits en entier — `from "../ui/Bouton"` — plutôt que
regroupés derrière un `ui/index.ts`. C'est trois caractères de plus et deux
avantages : on voit d'un coup d'œil de quel rôle et de quelle couche vient
chaque import, donc une violation des deux règles ci-dessus **se lit dans
l'en-tête du fichier** ; et le bundle ne tire pas de dépendances inutiles.

## Trois endroits où la logique est volontairement centralisée

Ce ne sont pas des abstractions pour le plaisir : chacune a déjà failli être
dupliquée.

**`domaine/filtres.ts`** — trois interfaces montrent les mêmes filtres : les
puces de l'écran 2, la colonne latérale de bureau, et les deux carrousels de
l'accueil. Le seuil de 48 h sert à la fois à la puce « Se termine bientôt » et
au partage des carrousels. S'il vivait dans les composants, le jour où il change
on en oublierait un, et l'acheteur qui filtre ne retrouverait pas ce qu'il
voyait dans la rangée.

**`domaine/moderation.ts`** — la rédaction des messages de refus est la copie la
plus sensible du produit, et chaque mot est justifié dans le tableau de l'écran
10 de la spec. La mettre en dur dans un composant, c'est garantir qu'elle sera
réécrite « pour faire plus court » par quelqu'un qui n'aura pas lu le tableau.

**`App.tsx`** — l'état du parcours vit dans le routeur, pas dans les pages.
C'est ce qui permet de tenir la promesse du §1.5 : fermer la feuille de
connexion ramène à l'écran 5 **intact**, parce que l'écran 5 n'a jamais été
démonté. Déplacer cet état dans une page casserait la promesse sans que rien ne
le signale.

## Les commentaires

Le code est commenté en français, et les commentaires expliquent **pourquoi**,
pas quoi. Une ligne qui dit « incrémente le compteur » ne sert à personne ; une
ligne qui dit « ce seuil sert aussi au carrousel, ne pas le changer sans
l'autre » évite un bug.

Chaque fichier porte en tête :

1. **ce qu'il est**, avec le numéro de section de la spec qui le décrit ;
2. **les règles non négociables** qui s'y appliquent, avec leur raison ;
3. **les écarts assumés** avec la spec, s'il y en a, et pourquoi.

Les écarts sont signalés par `⚠️` pour qu'un `grep` les retrouve tous :

```bash
grep -rn "⚠️" src/
```

## Les deux chromes

`ui/chrome.ts` définit le type ; `Bouton`, `Encart` et `Statut` portent l'axe
`role`. Chaque rôle porte ensuite son chrome chez lui : `acheteur/mise-en-page/`
pour l'orange, `groupeur/mise-en-page/ChromeGroupeur.tsx` pour l'en-tête et la
barre de navigation bleus. C'est précisément parce qu'ils vivent dans des
dossiers séparés qu'aucun des deux ne peut être importé par erreur de l'autre
côté.

**La règle de dominance, dans les deux cas :** une seule couleur porte
l'action, l'autre est un signal rare. **Au plus un élément de la seconde
couleur par écran.** Si vous en comptez deux, l'un des deux est de trop.

L'écran A1 n'a aucun des deux chromes : il est neutre, et cette neutralité
évite de confondre une capture d'écran interne avec le produit.

## Ce qui n'est pas encore là

- **Le routage par URL.** `App.tsx` enchaîne les écrans avec un `useState`.
  Le type `Ecran` donne directement la table des routes le jour où il faudra des
  liens partageables — le partage d'un groupage est un levier de croissance de
  l'écran 3.
- **Le réseau.** Les données sont des constantes. Les champs sont nommés comme
  ceux du §6 du PRD pour que la bascule vers Django/DRF soit un `fetch`.

---

## La couche `api/` — le front parle au serveur

Ajoutée quand l'interface a cessé de lire des constantes TypeScript. **C'est
la seule couche qui fasse un `fetch`**, et la règle de dépendance s'étend donc
ainsi :

```
pages → mise-en-page → composants → ui
  ↓                                  ↑
 api → domaine ←──────────────────────
```

`api/` dépend de `domaine/` — pour traduire vers ses types — et jamais
l'inverse : le domaine ne doit rien savoir du réseau, c'est ce qui le rend
testable sans serveur.

| Fichier | Rôle |
|---|---|
| `client.ts` | L'adresse du serveur, les erreurs de champ, la coupure réseau |
| `useRequete.ts` | Les trois états d'une lecture, et `useAction` pour les écritures |
| `campagnes.ts` | Catalogue, questions, commandes, paiement — **et les adaptateurs** |
| `espaceGroupeur.ts` | Ses campagnes, son portefeuille, ses questions |
| `dossiers.ts` | Le dépôt de dossier KYC, et son examen côté administration |
| `CatalogueContexte.tsx` | Le catalogue, chargé **une fois** pour tous les écrans acheteur |
| `EspaceGroupeurContexte.tsx` | Idem côté groupeur |

### Les adaptateurs, et pourquoi ils existent

L'API parle en `snake_case` et en vocabulaire **interne** — « campagne »,
`date_fin`, `media`. Les écrans parlent en `camelCase` et en vocabulaire
**utilisateur** — « groupage », `clotureLe`, `photo` (§3 : le mot visible est
« groupage », jamais « campagne »).

`adapterGroupage`, `adapterCommande`, `adapterQuestion`, `adapterDemande` font
la traduction **en un seul endroit**. Les vingt écrans acheteur continuent de
lire les types qu'ils connaissent depuis le début : brancher l'API n'a donc
touché ni à leur mise en page, ni à leurs calculs.

⚠️ **C'est aussi là que se verra une divergence avec le serveur.** TypeScript ne
vérifie rien à l'exécution : un champ renommé côté serveur produira `undefined`
ici, sans erreur. Les garde-fous sont les tests backend, qui vérifient champ par
champ ce qui sort, et les scripts de vérification en navigateur.

### Les trois états, qu'aucun écran de liste ne doit oublier

Les constantes n'avaient qu'un état : présentes. Une API en a trois —
**chargement, erreur, données** — et oublier les deux premiers est la façon la
plus courante de rendre une application pénible. Le §5 du cahier des charges
part d'un forfait de données limité et d'une connexion irrégulière à Lomé : une
liste qui met trois secondes à arriver est l'ordinaire, pas l'accident.

`ui/EtatReseau.tsx` fournit les deux formes employées partout : un squelette
**qui a la forme du contenu attendu** (pour que rien ne saute quand les données
arrivent) et une erreur **toujours accompagnée d'un bouton « Réessayer »** —
sans lui, la seule issue serait de recharger la page, c'est-à-dire de tout
retélécharger.

⚠️ **Un échec réseau n'est jamais un état vide.** Afficher « aucune commande »
parce que la requête a échoué ferait croire à quelqu'un qui vient de payer que
sa commande a disparu.

### Ce qui lit encore des constantes, et pourquoi

Trois fichiers subsistent dans `donnees/`, chacun faute d'endpoint :

| Fichier | Écran | Ce qui manque |
|---|---|---|
| `admin.ts` | A1 — tableau de bord | Les six files et les indicateurs ne sont pas agrégés côté serveur |
| `annonceurs.ts` | Bandeau publicitaire | Aucun modèle : le §A6 prévoit leur gestion dans l'admin Django |
| `tournee.ts` | 22 — tournée du livreur | Le jeton de tournée n'existe pas (§6) |
