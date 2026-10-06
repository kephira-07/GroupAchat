# Maquettes Figma — dépôt des exports

Dépose ici les exports PNG de Figma. Je les lis directement pour coder les écrans.

## Nommage

Un fichier par écran, numéroté comme dans [SPEC_ECRANS_FIGMA.md](../SPEC_ECRANS_FIGMA.md) :

```
01-fil.png
02-recherche.png
03-detail-campagne.png
04a-connexion-numero.png
04b-connexion-code.png
05-commander.png
06-paiement.png
07-confirmation.png
08-mes-commandes.png
09-detail-commande.png
10-questions.png
11-demander-produit.png
12-mes-demandes.png
13-tableau-bord-groupeur.png
14-creer-campagne.png
15-gerer-campagne.png
16-decision.png
17-justificatif.png
18-portefeuille.png
19-fil-demandes.png
20-questions-recues.png
21-statistiques-groupeur.png
22-tournee-livreur.png
```

Les **états** vont dans un fichier séparé, suffixé :

```
09-detail-commande--payee.png
09-detail-commande--en-livraison.png
09-detail-commande--livree.png
09-detail-commande--annulee.png
06-paiement--echec.png
17-justificatif--refuse.png
```

## Export depuis Figma

- **PNG à 2×** — à 1×, les textes de 12 px sont illisibles pour moi comme pour toi.
- **Une frame entière par fichier**, pas un recadrage : j'ai besoin de voir les marges et la barre de navigation.
- Pas besoin de fond de présentation : la frame 390 × 844 suffit.

## Ce que je peux lire, et ce que je ne peux pas

| Je lis bien | Je ne lis pas de façon fiable |
|---|---|
| La mise en page, l'ordre des blocs, les proportions | Les valeurs exactes en pixels |
| Les textes à partir de 12 px à l'export 2× | Les codes hexadécimaux exacts |
| Les états et les variantes | Les noms de composants et de calques |
| La hiérarchie visuelle | Les contraintes d'auto-layout |

Pour tout ce qui est dans la colonne de droite, **je prends les valeurs de la spec** (§1.1 pour la grille, §1.2 pour les couleurs, §1.3 pour la typographie). Si ta maquette s'en écarte volontairement, dis-le moi dans le message : sinon je code la spec, et c'est la maquette qui aura raison.

## Alternative plus fidèle

Le connecteur Figma permettrait de lire la structure exacte — composants, variables, espacements — au lieu de l'approximer depuis une image. Il n'est pas autorisé dans cette session ; il faudrait le connecter via `/mcp` dans une session interactive. À faire si tu veux un rendu au pixel près, sinon les PNG suffisent largement pour un prototype de compétition.
