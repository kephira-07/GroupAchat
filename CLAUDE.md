# Group Achat

Place de marché d'achat groupé pour Lomé, Togo. **Projet de conception, pas encore de code** : tout le contenu est documentaire et rédigé **en français**.

> Le `AGENTS.md` du dossier parent (`C:\ALLPROJECT\`) décrit un projet React/Vite « figma-make-app » **sans rapport avec celui-ci**. Ne pas l'appliquer ici.

## Les documents

| Fichier | Rôle |
|---|---|
| [PRD.md](PRD.md) | Le PRD d'une page — un paragraphe, puis les détails pour coder |
| [CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md) | Le document maître : modèle, argent, KYC, admin, livraison, modération, stack |
| [SPEC_ECRANS_FIGMA.md](SPEC_ECRANS_FIGMA.md) | 22 écrans + A1 admin, design system, jeu de données de démonstration |
| [LIVRAISON.md](LIVRAISON.md) | Dossier de négociation avec les transporteurs |
| `maquettes/` | Exports PNG que l'utilisateur produit lui-même dans Figma |
| `medias/` | Photos, vidéos et logos qu'il fournit |

**Les quatre documents se citent entre eux par numéro de section.** Toute insertion ou renumérotation de section oblige à corriger les renvois dans les trois autres — vérifier avec `grep -rno "§[0-9.]*" *.md`.

## Règles produit non négociables

Ce sont des décisions tranchées par l'utilisateur, pas des préférences. Ne pas les rouvrir sans qu'il le demande.

- **Anonymat dans les deux sens.** L'acheteur ne voit qu'un pseudonyme de groupeur ; le groupeur ne voit que des **codes et des quartiers**, jamais un nom, un numéro ou une adresse. C'est ce qui protège la commission contre la désintermédiation. Seule la page du livreur (écran 22) réunit nom, adresse et téléphone.
- **Pas de mur d'authentification.** On navigue librement ; le compte est demandé **au moment de payer**.
- **Aucun prix barré, aucun badge de réduction, aucun « au lieu de ».** Nulle part.
- **Le groupeur est payé intégralement à la clôture**, pas à la livraison. Conséquence : **aucun écran ne doit écrire « votre argent est bloqué jusqu'à la livraison »** — la formulation autorisée est « détenu jusqu'à la clôture ». Tableau des formulations interdites au §1.7 de la spec des écrans.
- **Commission 5 %**, à la charge du groupeur, retenue à la clôture, jamais sur les frais de livraison.
- **Frais de livraison calculés selon la position** de l'acheteur ; la fonction renvoie **1 000 F** pour l'instant. La position est **conservée sur la commande**.
- **Pas de messagerie privée.** Questions publiques uniquement, filtrées avant publication.
- **Web React d'abord** (mobile d'abord, 390 px), mobile Android/iOS ensuite. Django + DRF + PostgreSQL. **Paiement simulé** jusqu'à l'agrément d'un agrégateur.

## Jeu de données de démonstration

Les additions doivent tomber juste — un jury vérifie.

- Campagne C1 : **Écouteurs filaires avec micro**, **4 000 F** la part, **32 commandes**
- Total payé par l'acheteur : 4 000 + 1 000 de livraison = **5 000 F**
- Collecté **128 000 F** − commission **6 400 F** = **121 600 F versés**
- Code de livraison : `K7M-4PQ` · Acheteuse : Akosua Doe, Tokoin · Groupeuse : Mama Gro

## Chromes

Deux chromes, définis au §1.2 de la spec des écrans. **Ne jamais les inverser.**

- **Acheteur (écrans 1-12) : orange dominant.** `primaire` `#CC4A00` (blanc 4,62:1), `marque` `#FF6A00` **texte sombre uniquement** — blanc sur orange vif = 2,87:1, interdit.
- **Groupeur (écrans 13-21) : bleu dominant.** `confiance` `#1E3A8A` (blanc 10,36:1). L'orange n'y est qu'une alerte.
- **Admin (A1) : chrome neutre**, ni orange ni bleu, et **1 280 × 800** — seul écran destiné à un ordinateur.
- Orange sur aplat bleu = 3,61:1 : gros caractères et pastilles pleines seulement.

**Tout contraste doit être calculé, jamais estimé.**

## Comment éditer ces fichiers

**Les heredocs Bash cassent sur les apostrophes françaises** (`l'argent`, `d'achat`) — erreur `unexpected EOF`. Même problème avec `python -c`.

Méthode qui marche : écrire un script de correctifs dans le **scratchpad** avec l'outil `Write`, puis l'exécuter par son chemin.

```python
# -*- coding: utf-8 -*-
import io
p = r'C:\ALLPROJECT\Professionnel\GroupAchat\CAHIER_DES_CHARGES.md'
s = io.open(p, encoding='utf-8').read()

def rep(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:70])   # garde-fou indispensable
    s = s.replace(old, new)

rep("ancien texte", "nouveau texte")
io.open(p, 'w', encoding='utf-8').write(s)
```

L'`assert` sur le nombre d'occurrences évite les remplacements partiels silencieux. **Toujours `grep` la formulation exacte avant d'écrire le correctif** : ces documents ont été réécrits souvent, et la phrase mémorisée n'est pas toujours celle du fichier.

## Ton de rédaction

Français, phrases pleines, pas de listes à puces télégraphiques. Chaque décision est **justifiée**, et les coûts d'un choix sont dits franchement plutôt que passés sous silence. Quand un chiffre n'est pas connu — les tarifs des transporteurs par exemple — on écrit qu'on ne le connaît pas, **on ne l'invente pas**.

## Git

Branche `master`. **Ne jamais committer sans que l'utilisateur le demande** : il relit avant.
