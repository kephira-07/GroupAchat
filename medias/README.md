# Médias — dépôt des photos, vidéos et logos

Dépose ici les visuels de l'application. L'inventaire complet, avec les tailles et les raisons, est au **§1.8** de [SPEC_ECRANS_FIGMA.md](../SPEC_ECRANS_FIGMA.md).

Tant que ce dossier est vide, chaque emplacement de la maquette est un bloc gris portant sa dimension écrite dessus. L'échange se fait alors sans rien redessiner.

## Nommage

Les codes de campagne (`c1` à `c5`) sont ceux du jeu de données du §3 de la spec.

```
campagnes/
  c1-ecouteurs-vertical.jpg    1080 × 1920   fil (écran 1)
  c1-ecouteurs-carre.jpg        288 × 288    vignettes
  c1-ecouteurs-detail.jpg      1170 × 1464   détail (écran 3)
  c2-robe-vertical.jpg
  c2-robe-carre.jpg
  c2-robe.mp4                  1080 × 1920   15 s max, < 3 Mo
  c3-huile-...
  c4-baskets-...               + c4-baskets.mp4
  c5-savon-...

annonceurs/
  annonceur-1-logo.png          120 × 120    PNG transparent
  annonceur-2-logo.png

marque/
  logo-icone.svg                            icône seule
  logo-horizontal.svg                       logotype
  icone-application.png        1024 × 1024

divers/
  recu-fournisseur-exemple.jpg              écran 17
```

## Les deux règles qui comptent

**1. Cadre le produit dans le tiers supérieur** pour les photos et vidéos verticales du fil.

Sur l'écran 1, le média fait 600 px de haut, mais **les 280 px du bas sont recouverts** par le prix, le compteur et le bouton. Une photo bien centrée aura donc son sujet masqué — et ça ne se voit qu'au montage. Le détail est au §1.8 de la spec, avec le schéma.

**2. Les vidéos doivent se comprendre sans le son**, qui est coupé par défaut. Verticales 9:16, 15 secondes maximum, moins de 3 Mo. Filmées au téléphone, c'est très bien : ce fil n'attend pas des films publicitaires.

## Liste minimale pour la démonstration

| Besoin | Quantité |
|---|---|
| Photo verticale 1080 × 1920 | **5** — une par campagne |
| Photo carrée 288 × 288 | **5** — recadrages des précédentes |
| Vidéo verticale de 15 s | **2** — C2 (robe wax) et C4 (baskets) |
| Logo d'annonceur 120 × 120 | **2 à 4** |
| Logo Group Achat | **1** jeu |
| Photo de reçu | **1** |

**Un mot sur C1, les écouteurs filaires.** C'est un petit objet sur une photo verticale de 1080 × 1920 : cadré de loin, il sera minuscule et le fil paraîtra vide. Prends-le **en gros plan, posé sur un fond uni**, ou dans une main — et place-le dans le tiers supérieur, comme la règle 1 l'exige. C'est l'écart le plus probable entre ta photo et ce que la maquette attend.

Je n'ai besoin d'aucun visuel pour les **icônes** (je les produis en traits de 1,5 px), le **QR code** (généré par le code) ni les **états vides** (sans illustration, par principe — §1.0 de la spec).
