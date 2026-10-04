# Cahier des charges — Plateforme de groupages d'achat (Togo)

> Nom du projet : **À définir**
> Version : 0.3 (brouillon)
> Légende : les sections marquées **À définir** sont volontairement vides et seront complétées plus tard. Les éléments marqués *(proposition)* sont à valider.

---

## 1. Contexte et problématique

Au Togo, acheter au détail coûte jusqu'à 40 % plus cher qu'en gros. Les gens ont déjà l'habitude de s'unir pour acheter ensemble, mais ces **groupages vivent dans des groupes WhatsApp dispersés** : difficiles à trouver, mal organisés (qui a payé ? qui a reçu ?), sans garantie sur l'argent versé et sans moyen de savoir quel organisateur est fiable.

> Source du chiffre de 40 % : **À définir** (à sourcer avant toute présentation officielle).

## 2. Solution

Une **plateforme web** qui réunit les organisateurs de groupages d'achat (les « groupeurs ») au même endroit. Elle reproduit le fonctionnement des groupes WhatsApp, en mieux organisé et en plus sûr :

- les acheteurs trouvent tous les groupages au même endroit ;
- les groupeurs gèrent leurs participants et leurs commandes plus simplement ;
- **la plateforme est tiers de séquestre** : elle bloque le paiement de l'acheteur et ne le verse au groupeur qu'après validation de la remise ;
- la remise est prouvée par un **code unique ou QR code** remis à l'acheteur, et non par une simple déclaration ;
- chaque groupeur a une réputation visible et peut être **certifié**.

La plateforme **ne vend pas et ne livre pas** : les groupeurs gèrent eux-mêmes leurs fournisseurs et la remise des produits.

## 3. Positionnement et différence avec l'existant

| Existant | Ce qu'il fait | Ce qui manque |
|---|---|---|
| Groupes WhatsApp | Groupages informels | Dispersés, non trouvables, sans garantie, sans réputation, suivi manuel |
| Tushop (Kenya), Grup, Pricepally, Floc, BuyPool (Nigeria) | Achats groupés avec achat direct chez le fournisseur | Pas de présence connue au Togo ; modèle centré sur la plateforme, pas sur les groupeurs indépendants |
| Annuaires (Annuaires Togo, DataBiz) | Listent des entreprises | Ne couvrent pas les groupages |

**Différence :** une plateforme qui rassemble les groupeurs indépendants existants, sécurise l'argent des acheteurs par séquestre et affiche la fiabilité de chaque groupeur, centrée sur le Togo.

> Cette comparaison provient d'une recherche rapide ; elle doit être vérifiée avant présentation.

## 4. Objectifs

- Permettre à tout visiteur de trouver rapidement un groupage ouvert.
- Permettre à un groupeur de publier et gérer ses groupages.
- Sécuriser l'argent de l'acheteur jusqu'à la validation de la remise.
- Rendre la confiance visible (certification, avis, historique).
- Objectifs chiffrés (utilisateurs, nombre de groupages) : **À définir**

## 5. Public cible

**Acheteurs :** toute personne qui veut acheter au prix de gros sans disposer d'un gros budget — particuliers, ménages, petits commerçants, revendeuses de marché, qu'ils achètent pour eux-mêmes ou pour revendre. Le marché n'est volontairement pas restreint à un segment.

**Profil type retenu pour concevoir le MVP :** un adulte de Lomé avec un smartphone Android d'entrée de gamme et un forfait data limité, qui participe déjà à des achats groupés sur WhatsApp sans aucune garantie sur l'argent qu'il verse. Ce profil sert à trancher les choix concrets (interface légère, images chargées en dernier, vocabulaire du groupage déjà connu), pas à exclure les autres.

**Groupeurs :** personnes qui organisent déjà des groupages (WhatsApp, quartiers, tontines).

**Ville de lancement :** Lomé (à confirmer).

## 6. Profils utilisateurs

| Profil | Rôle |
|---|---|
| **Visiteur** | Parcourt la plateforme librement, sans compte |
| **Acheteur** | Visiteur connecté : rejoint et paie des groupages, reçoit son code de retrait, suit ses commandes |
| **Groupeur** | Publie et gère des groupages, organise la remise, valide les codes, reçoit ses versements |
| **Administrateur** | Vérifie et certifie les groupeurs, modère, arbitre les litiges |

## 7. Règles générales

1. **Pas d'authentification au premier contact.** Un visiteur peut tout parcourir sans compte.
2. La connexion (numéro de téléphone + code SMS) n'est demandée que lorsqu'une **action** le nécessite (rejoindre un groupage, payer, demander un produit, suivre ses commandes). Après connexion, l'utilisateur revient exactement où il était, avec son choix conservé.
3. Il existe des **groupeurs certifiés** (badge visible) et des **groupeurs non certifiés**. Un avertissement clair s'affiche pour un groupeur non certifié.
4. **Circuit de l'argent (séquestre) :**
   1. l'acheteur paie sur la plateforme (Mobile Money) en rejoignant un groupage ;
   2. la plateforme **bloque** les fonds : ils ne sont pas envoyés au groupeur ;
   3. le groupeur voit que l'argent est réel et peut lancer sa commande en confiance ;
   4. à la remise, l'acheteur donne son **code de retrait** que le groupeur valide : c'est la **seule** preuve de remise ;
   5. l'acheteur dispose ensuite de **48 h pour réclamer** (produit non conforme, quantité incomplète) ;
   6. passé ce délai sans réclamation, la plateforme libère les fonds au groupeur, **moins la commission** ;
   7. si le groupage échoue, est annulé, si le code n'est jamais validé, ou si un litige est tranché en faveur de l'acheteur, celui-ci est remboursé.
5. **Commission au succès :** la plateforme ne prélève sa commission que sur les groupages **aboutis et validés**. Aucune commission sur un groupage échoué ou annulé.
6. La plateforme n'est **ni vendeuse ni livreuse**. Sa responsabilité se limite au séquestre et à l'arbitrage décrit en 13.7.

## 8. Périmètre du MVP

- **Plateforme :** application **web**, utilisable sur ordinateur et mobile (mobile d'abord).
- Langue de l'interface : français.
- **Le MVP est fonctionnel de bout en bout, mais le paiement est simulé** : aucun argent réel ne circule. Le branchement d'un agrégateur de paiement agréé se fait en phase 2 (voir section 15).

### 8.0 Ordre de priorité

Si une seule chose devait être livrée, ce serait la première.

1. **Rejoindre un groupage et payer, avec l'argent bloqué jusqu'à la remise.** L'acheteur voit les groupages ouverts avec leur jauge, il paie sa part, et son paiement n'est versé au groupeur qu'après validation de son code de retrait. C'est la seule fonctionnalité qui apporte ce que les groupes WhatsApp ne savent pas faire : la garantie que personne ne part avec l'argent.
2. **La demande de produit par l'acheteur.** N'importe qui soumet un produit qu'il veut acheter ; la demande est visible par tous les groupeurs, qui peuvent la prendre en charge et lancer le groupage. La demande crée l'offre, ce qui rend le catalogue illimité sans gérer de stock.
3. **La certification des groupeurs.** Identité vérifiée, badge visible, historique public des groupages livrés. L'acheteur sait à qui il a affaire avant de payer.

Le catalogue public et la création de groupage par le groupeur ne figurent pas dans ce classement : ce sont les fondations sans lesquelles rien ne fonctionne, et non des fonctionnalités à arbitrer.

### 8.1 Fonctionnalités Visiteur / Acheteur

- Accueil avec recherche, catégories et liste des groupages ouverts.
- Carte d'un groupage : photo, prix de gros, jauge de progression (ex. « 14 / 20 participants »), groupeur, badge certifié ou non, date limite.
- Page détail d'un groupage : description, quantité, lieu et date de remise, profil du groupeur, règles.
- Filtres : catégorie, quartier/ville, groupeurs certifiés uniquement.
- Connexion par numéro de téléphone et code SMS, déclenchée à la demande.
- Rejoindre un groupage, choisir sa quantité et **payer** (paiement simulé), avec affichage clair du séquestre.
- « Mes commandes » : liste des groupages rejoints et leur statut.
- **Code de retrait / QR code** affiché dans le détail de la commande une fois le groupage prêt pour la remise.
- **Signaler un problème** sur une commande (avant la libération des fonds).
- **Demander un produit** : formulaire (nom, photo, description, quantité souhaitée, quartier), visible par les groupeurs.
- « Mes demandes » : suivi des demandes soumises.
- Consulter le profil public d'un groupeur et laisser un avis après une commande terminée.

### 8.2 Fonctionnalités Groupeur

- Inscription et profil (nom, quartier, photo, présentation).
- Demande de certification (dépôt des pièces) et suivi de son statut (non certifié, en cours, certifié).
- Créer un groupage : produit, photos, description, prix, quantité, nombre minimum de participants, date limite, date et lieu de remise.
- Gérer un groupage : liste des participants, quantités et statut de paiement, statut du groupage.
- Annoncer la remise (date, lieu).
- **Valider une remise** : saisir ou scanner le code de retrait de l'acheteur.
- Voir le fil des demandes d'acheteurs et en prendre une en charge (pré-remplit la création d'un groupage).
- Portefeuille : montants bloqués, montants libérés, commission prélevée (simulés dans le MVP).
- Tableau de bord : groupages actifs, nombre de participants, remises validées.

### 8.3 Fonctionnalités Administrateur

- Examiner les demandes de certification (approuver, refuser).
- Modérer les groupeurs, groupages et demandes signalés.
- Examiner les litiges et trancher (rembourser l'acheteur ou libérer les fonds au groupeur).
- Vue d'ensemble des fonds bloqués, libérés et des commissions (simulés dans le MVP).

## 9. Statuts

**Groupage :** ouvert → complet → commandé → prêt pour la remise → terminé. Un groupage non rempli à la date limite passe à *annulé* et les acheteurs sont remboursés *(proposition)*.

**Participation d'un acheteur :** payé (fonds bloqués) → code de retrait disponible → remise validée (code saisi par le groupeur) → délai de réclamation de 48 h → fonds libérés. États alternatifs : *litige en cours*, *remboursé*.

## 10. Parcours principaux

1. **Visiteur → acheteur :** parcourt → ouvre un groupage → clique « Rejoindre » → se connecte (SMS) → choisit sa quantité → paie (fonds bloqués) → suit sa commande → reçoit son code de retrait → le présente à la remise.
2. **Remise :** le groupeur annonce la remise → l'acheteur se présente avec son code → le groupeur le valide → l'acheteur a 48 h pour réclamer → sans réclamation, les fonds sont libérés au groupeur, moins la commission.
3. **Demande de produit :** l'acheteur soumet une demande → les groupeurs la voient → un groupeur la prend en charge et crée le groupage → l'acheteur est informé et peut le rejoindre.
4. **Groupeur :** s'inscrit → demande la certification → crée un groupage → suit les participants → organise la remise et valide les codes → reçoit son versement.
5. **Litige :** l'acheteur signale un problème → les fonds restent bloqués → le groupeur répond → l'administrateur examine les preuves et tranche.
6. **Administrateur :** reçoit les demandes de certification → approuve ou refuse.

## 11. Écrans du MVP

1. Accueil
2. Résultats de recherche / filtres
3. Détail d'un groupage
4. Connexion / code SMS
5. Rejoindre et choisir la quantité
6. Paiement (simulé)
7. Confirmation de participation
8. Mes commandes
9. Détail d'une commande (statut, code de retrait / QR code, signaler un problème)
10. Demander un produit
11. Mes demandes
12. Profil groupeur et avis
13. Tableau de bord groupeur
14. Créer un groupage
15. Gérer un groupage (participants, annonce de remise)
16. Valider une remise (saisie ou scan du code)
17. Portefeuille groupeur
18. Fil des demandes (groupeur)
19. Demande de certification (groupeur)
20. Validation des groupeurs (administrateur)
21. Litiges (administrateur)

## 12. Contraintes non fonctionnelles

- Mobile d'abord, interface légère adaptée aux connexions lentes.
- Gros boutons, textes lisibles, contraste élevé.
- Traçabilité de tous les mouvements d'argent (journal des opérations).
- Unicité et non-devinabilité des codes de retrait.
- Protection des données personnelles (numéros de téléphone, pièces d'identité) : **À définir**
- Performance, disponibilité, volumétrie cibles : **À définir**

## 13. Fonctionnalités à préciser

### 13.1 Paiement
- **Phase 1 (MVP de test) :** paiement simulé, sans argent réel.
- **Phase 2 (production) :** intégration d'un agrégateur de paiement agréé (Mobile Money : T-Money, Flooz) pour encaisser, bloquer et reverser. Choix de l'agrégateur : **À définir**
- Mode de versement aux groupeurs et frais de transfert : **À définir**

### 13.2 Modèle économique et revenus
- **Commission au succès** : pourcentage prélevé uniquement sur les groupages aboutis et validés. Aucune commission en cas d'échec ou d'annulation.
- Taux *(proposition)* : entre 3 et 8 %. Taux définitif : **À définir**
- Qui supporte la commission (acheteur, groupeur ou les deux) : **À définir**
- **Revenus futurs :** abonnements et options payantes de visibilité pour les groupeurs certifiés. Détails : **À définir**

### 13.3 Validation de la remise
- Chaque participation génère un **code unique (ou QR code)** remis à l'acheteur.
- À la remise, le groupeur saisit ou scanne ce code. **La validation du code est la seule preuve de remise** : aucune libération de fonds n'a lieu sans elle.
- Une fois le code validé, l'acheteur dispose d'un **délai de réclamation de 48 h** (produit non conforme, quantité incomplète). Sans réclamation, les fonds sont libérés automatiquement au groupeur, moins la commission.
- **Si le code n'est jamais validé**, les fonds restent bloqués. Au-delà d'un délai à fixer après la date de remise annoncée, le dossier bascule en litige ou l'acheteur est remboursé. Délai et règle : **À définir**
- Cas particuliers (code perdu, acheteur absent, remise partielle) : **À définir**

### 13.4 Avis et notation des groupeurs
- Note de 1 à 5 et commentaire, réservés aux acheteurs ayant participé à un groupage du groupeur *(proposition)*.
- Affichage sur le profil : note moyenne, nombre de groupages réalisés, taux de remises validées *(proposition)*.
- Règles détaillées : **À définir**

### 13.5 Critères et processus de certification
- **Groupeur certifié :** vérification de la pièce d'identité, des antécédents et des garanties. Il offre une garantie renforcée à l'acheteur et bénéficie d'un badge visible.
- **Groupeur non certifié :** il peut publier ses offres pour tester le marché, mais un avertissement clair s'affiche pour les acheteurs, ce qui l'incite à se faire certifier.
- Nature exacte des « garanties » exigées et portée juridique de la garantie offerte à l'acheteur : **À définir** (point sensible, voir 13.8).
- Niveaux de certification, coût éventuel, conditions de retrait du badge : **À définir**

### 13.6 Notifications (SMS, e-mail, WhatsApp)
**À définir**

### 13.7 Litiges et signalements
- Bouton « Signaler un problème » sur chaque commande, avant la libération des fonds.
- Pendant le litige, les fonds restent bloqués.
- Un administrateur examine les preuves des deux parties, puis rembourse l'acheteur ou libère les fonds au groupeur.
- Délais (réponse du groupeur, durée maximale du litige, délai de réclamation après remise) : **À définir**

### 13.8 Conformité légale (CGU, données personnelles, statut)
- Détenir et bloquer l'argent de tiers est une activité réglementée : le passage par un agrégateur agréé et un avis juridique sont nécessaires avant la production.
- La « garantie totale » annoncée pour les groupeurs certifiés engage financièrement la plateforme : son périmètre doit être défini et borné dans les CGU.
- Autres éléments (CGU, politique de confidentialité, déclaration des données, statut de société) : **À définir**

### 13.9 Stack technique et hébergement

**Type d'application**
- **MVP :** application **web responsive, conçue mobile d'abord**. C'est la version utilisée pour la présentation et les tests avec les groupeurs pilotes.
- **Version future :** application **mobile en Flutter**, qui consommera la même API que le web.

**Règle d'architecture à respecter dès le départ**
L'API est **séparée de l'interface**. Le back-end expose une API indépendante (groupages, participations, codes de retrait, paiements, certification). Le web la consomme aujourd'hui, l'application Flutter la consommera demain. Flutter utilisant Dart, l'interface web ne sera pas réutilisable : seule cette séparation évite de réécrire aussi la logique métier.

**Back-end**
- **Django** (Python) avec **Django REST Framework** pour exposer l'API.
- **PostgreSQL** comme base de données.
- L'**admin Django** sert de back-office pour la certification, les litiges et la modération.

**Intégrité des opérations sensibles**
Tout ce qui touche à l'argent et aux places disponibles passe par une **transaction** avec verrouillage de ligne (`SELECT FOR UPDATE`), afin d'éviter : deux acheteurs qui prennent la dernière place simultanément, et un code de retrait validé deux fois.

**Tâches planifiées (indispensables)**
Deux règles du cahier des charges ne se déclenchent pas sur une action utilisateur et exigent un traitement automatique :
1. la **libération des fonds** 48 h après la validation du code de retrait ;
2. l'**annulation et le remboursement** d'un groupage non rempli à sa date limite.

- **MVP :** commande de gestion Django appelée par un cron (toutes les heures).
- **Plus tard :** Celery avec Redis, quand s'ajouteront les SMS et les notifications.

**Hébergement**
- **Production :** serveur privé virtuel (VPS), avec Gunicorn derrière Nginx.
- **Phase de test :** Render (et services similaires).

**Détails à arrêter**
- Framework front-end du MVP web : **À définir**
- Service SMS : **À définir**

## 14. Évolutions futures (pistes)

**Déjà identifiées :** paiement réel en production, abonnements et visibilité payante pour les groupeurs certifiés, notifications SMS/WhatsApp, avis et badges avancés, application mobile Flutter, extension à d'autres villes et pays.

### 14.1 Simplifier l'usage par l'IA et les langues locales

- **Côté groupeur :** dicter son offre à voix haute (« riz 25 kg, 14 500 francs, minimum 20 personnes, remise samedi à Agoè ») et voir le formulaire se remplir seul, au lieu de tout taper sur un petit écran.
- **Côté acheteur :** rechercher en langage courant (« de l'huile pas chère près de Bè ») et consulter l'interface en **éwé, mina ou kabiyè**, à l'écrit comme à l'oral, pour que savoir lire le français cesse d'être une condition pour acheter au prix de gros.
- **Réserve :** traduire l'interface dans ces langues est faisable dès aujourd'hui, mais la **reconnaissance vocale** y reste faible et sans solution fiable prête à l'emploi. La dictée fonctionnera d'abord en français, les langues locales suivront à mesure que les modèles progressent.

### 14.2 Exploiter les données de la plateforme

- **Détection des groupeurs à risque** à partir du taux de remises validées, des délais, des litiges et des montants inhabituels. Un signalement automatique, une décision humaine.
- **Agrégation de la demande** par produit, quartier et période, pour indiquer aux groupeurs où se trouve la demande réelle (« 32 personnes à Agoè cherchent de l'huile cette semaine »).
- **Vérification des prix** par comparaison avec l'historique et le prix de détail, pour repérer les faux bons plans.

**Prérequis, à mettre en place dès le MVP :** ces usages supposent un historique qui n'existera pas au départ. Il faut donc enregistrer proprement, dès maintenant, chaque changement de statut avec sa date, chaque validation de code avec son heure, chaque litige avec son issue et chaque demande avec son quartier. C'est gratuit aujourd'hui et irrécupérable plus tard.

## 15. Planning et équipe

- **Phase 1 : MVP web de test** avec paiement simulé : valider les écrans, les règles et les parcours avec de vrais groupeurs pilotes.
- **Phase 2 : production** avec agrégateur de paiement agréé, après avis juridique.
- Équipe : **À définir**
- Jalons et dates : **À définir**
- Budget : **À définir**
