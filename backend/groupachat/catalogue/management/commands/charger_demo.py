# -*- coding: utf-8 -*-
"""Charge le jeu de démonstration du §3 de la spec des écrans.

    python manage.py charger_demo

**Les additions doivent tomber juste : un jury vérifie.** Cette commande monte
exactement le fil rouge — C1, 32 commandes à 4 000 F, 128 000 F collectés,
6 400 F de commission, 121 600 F versés — pour qu'on puisse interroger l'API et
retrouver les chiffres de la maquette.

Elle est **idempotente** : on peut la relancer sans créer de doublons, ce qui
évite de devoir effacer la base entre deux démonstrations.

## D'où vient le catalogue

Des seize groupages de ``donnees_demo/catalogue.json``, et non plus d'une liste
écrite dans ce fichier.

Ce JSON a été **extrait des constantes TypeScript du front**, qui étaient la
source du catalogue tant que l'interface ne parlait pas à l'API. Les deux
auraient divergé en une semaine : le front affichait seize produits avec leurs
caractéristiques et leurs points de remise, la base en contenait quatre sans
rien de tout cela. Brancher l'interface sur l'API aurait fait disparaître douze
produits et vidé l'écran 3.

**La base est désormais la seule source**, et c'est ce que signifie « brancher
le front » : le `src/donnees/groupages.ts` d'origine n'a plus de lecteur.
"""

from __future__ import annotations

import json
from datetime import timedelta
from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from groupachat.catalogue.models import Campagne
from groupachat.commandes.models import enregistrer_paiement
from groupachat.comptes.models import Acheteur, Groupeur, PieceKyc
from groupachat.echanges.models import Question

#: Le catalogue, à côté du code qui le charge.
CATALOGUE = (
    Path(__file__).resolve().parent.parent.parent / "donnees_demo" / "catalogue.json"
)

#: Les trois pseudonymes du §3, et rien d'autre.
GROUPEURS = [
    ("Mama Gro", "Akossiwa Mensah", "+22891000001"),
    ("Chez Sika", "Sika Adjo", "+22891000002"),
    ("Lomé Deals", "Kodjo Amegan", "+22891000003"),
]

QUARTIERS = ("Tokoin", "Agoe", "Be", "Adidogome", "Nyekonakpoe", "Hedzranawoe")

#: Des dossiers **en attente d'examen**, qui alimentent l'écran A2 (§13.6).
#:
#: Sans eux, la file de l'administrateur est vide et l'écran de recrutement ne
#: se démontre pas — alors que c'est le seul écran du produit où une décision
#: humaine engage la promesse faite à l'acheteur (§10.5).
#:
#: Les quatre cas ne sont pas interchangeables : ils couvrent les quatre
#: décisions que l'administrateur doit savoir prendre.
DOSSIERS_EN_ATTENTE = [
    {
        # Le cas simple : tout concorde, il n'y a qu'à valider.
        "pseudonyme": "Adjo Textile",
        "nom_complet": "Adjo Mensah",
        "telephone": "+22891000010",
        "courriel": "adjo.textile@example.tg",
        "titulaire": "Adjo Mensah",
        "jours": 1,
        "pieces": ("piece-recto", "piece-verso", "selfie"),
    },
    {
        # Le cas qui **arrête tout** : le compte de versement n'est pas à son
        # nom (contrôle n° 2 du §10.5). Le formulaire le refuse à la saisie —
        # ce dossier représente donc un compte modifié après le dépôt, qui est
        # le signal d'alerte numéro un.
        "pseudonyme": "Gros Bonnet",
        "nom_complet": "Yao Komlan",
        "telephone": "+22891000011",
        "courriel": "",
        "titulaire": "Afi Kossi",
        "jours": 3,
        "pieces": ("piece-recto", "piece-verso", "selfie"),
    },
    {
        # Le cas le plus fréquent : il manque une pièce. Il se renvoie « à
        # compléter », il ne se refuse pas.
        "pseudonyme": "Kossi Électro",
        "nom_complet": "Kossi Agbeko",
        "telephone": "+22891000012",
        "courriel": "kossi@example.tg",
        "titulaire": "Kossi Agbeko",
        "jours": 4,
        "pieces": ("piece-recto", "selfie"),
    },
    {
        # Le cas qui doit sauter aux yeux : **six jours d'attente**, au-delà
        # des 48 h annoncées au groupeur à l'inscription. Et sans courriel :
        # la décision ne pourra lui être annoncée que par téléphone.
        "pseudonyme": "Marché Hedzranawoe",
        "nom_complet": "Afiwa Dogbe",
        "telephone": "+22891000013",
        "courriel": "",
        "titulaire": "Afiwa Dogbe",
        "jours": 6,
        "pieces": ("piece-recto", "piece-verso", "selfie"),
    },
]


def _texte_de_la_reponse(valeur) -> str:
    """La réponse, quelle que soit la forme qu'elle a dans le JSON.

    Les deux listes du catalogue ont été écrites à des moments différents et
    ne la représentent pas pareil : ``questions`` porte un objet
    ``{auteur, texte, repondueLe}``, ``questionsRecentes`` une simple chaîne.
    Plutôt que de corriger le JSON — qui est une extraction, pas une source
    qu'on édite à la main — on accepte les deux ici, en un seul endroit.
    """
    if isinstance(valeur, str):
        return valeur
    if isinstance(valeur, dict):
        return valeur.get("texte", "")
    return ""


class Command(BaseCommand):
    help = "Charge le jeu de démonstration du §3 de la spec des écrans."

    @transaction.atomic
    def handle(self, *args, **options):
        catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))

        groupeurs = {}
        for pseudonyme, nom, telephone in GROUPEURS:
            groupeur, _ = Groupeur.objects.get_or_create(
                pseudonyme=pseudonyme,
                defaults={
                    "nom_complet": nom,
                    "telephone": telephone,
                    # Leur dossier est validé : sans ça ils ne pourraient rien
                    # lancer, ce qui est le comportement voulu.
                    "statut_kyc": Groupeur.StatutKyc.VALIDE,
                    "titulaire_mobile_money": nom,
                    "numero_mobile_money": telephone,
                },
            )
            groupeurs[pseudonyme] = groupeur

        self._charger_les_dossiers_en_attente()

        par_identifiant = {}
        for index, donnees in enumerate(catalogue["groupages"], start=1):
            campagne = self._charger_une_campagne(index, donnees, groupeurs)
            par_identifiant[donnees["id"]] = campagne

        self._charger_les_questions(catalogue, par_identifiant)

        self.stdout.write(
            self.style.SUCCESS(
                f"Jeu de démonstration chargé — {len(par_identifiant)} groupages."
            )
        )

    # ── Le catalogue ────────────────────────────────────────────────────────

    def _charger_une_campagne(self, index: int, donnees: dict, groupeurs: dict):
        """Crée une campagne et les commandes payées qui vont avec.

        Les commandes ne sont pas décoratives : ``acheteurs_confirmes``,
        ``collecte_sur_les_parts`` et le versement du groupeur en découlent.
        Une campagne sans commande afficherait « 0 acheteur confirmé », ce qui
        est exact mais ne démontre rien.
        """
        variante = donnees.get("variante") or {}

        campagne, creee = Campagne.objects.get_or_create(
            titre=donnees["produit"],
            defaults={
                "groupeur": groupeurs[donnees["groupeur"]],
                "description": donnees["description"],
                "contenu_part": donnees["contenuPart"],
                "categorie": donnees["categorie"],
                "prix_part": Decimal(str(donnees["prixPart"])),
                "media": donnees.get("photo", ""),
                "media_alt": donnees.get("photoAlt", ""),
                "caracteristiques": donnees.get("caracteristiques", []),
                "variante_libelle": variante.get("libelle", ""),
                "variante_options": variante.get("options", []),
                "quartier_remise": donnees.get("quartier", ""),
                "point_remise": donnees.get("pointRemise", ""),
                "remise_le": donnees.get("remiseLe"),
                # `heuresRestantes` est fixe dans le jeu de démonstration, et
                # non calculé depuis une date : la maquette doit afficher
                # « RESTE 2 JOURS » sur C1 quel que soit le jour où on la
                # montre. On le reconvertit donc en date de clôture au moment
                # du chargement.
                "date_fin": timezone.now()
                + timedelta(hours=donnees["heuresRestantes"]),
            },
        )

        if not creee:
            return campagne

        for numero in range(donnees["acheteursConfirmes"]):
            acheteur, _ = Acheteur.objects.get_or_create(
                telephone=f"+2289{index:02d}{numero:05d}",
                defaults={"nom": f"Acheteur {numero + 1}"},
            )
            enregistrer_paiement(
                campagne=campagne,
                acheteur=acheteur,
                quantite=1,
                quartier=QUARTIERS[numero % len(QUARTIERS)],
                repere="repère de démonstration",
                telephone=acheteur.telephone,
                variante=(
                    variante["options"][numero % len(variante["options"])]
                    if variante.get("options")
                    else ""
                ),
                cle_idempotence=f"demo-{donnees['id']}-{numero}",
            )

        self.stdout.write(
            f"  {campagne.titre} — {donnees['acheteursConfirmes']} commandes, "
            f"{campagne.collecte_sur_les_parts} F collectés"
        )
        return campagne

    # ── Les questions publiques ─────────────────────────────────────────────

    def _charger_les_questions(self, catalogue: dict, par_identifiant: dict) -> None:
        """Les questions de l'écran 10, et celles affichées sur l'écran 3.

        Deux sources dans le JSON, et les deux comptent : ``questions`` porte
        le jeu détaillé de l'écran 10 — dont une **en vérification**, qui est
        le seul moyen de démontrer le filtre de modération — tandis que
        ``questionsRecentes`` porte les deux questions-réponses qu'affiche la
        fiche produit.

        Elles sont dédupliquées sur le texte : les deux listes se recouvrent
        par endroits, et une question affichée deux fois sur la même fiche
        donnerait l'impression d'un bug.
        """
        auteur, _ = Acheteur.objects.get_or_create(
            telephone="+22890000000", defaults={"nom": "Akosua Doe"}
        )

        deja = set()

        for brute in catalogue.get("questions", []):
            campagne = par_identifiant.get(brute["groupageId"])
            if campagne is None:
                continue
            cle = (campagne.pk, brute["texte"])
            if cle in deja:
                continue
            deja.add(cle)
            Question.objects.get_or_create(
                campagne=campagne,
                texte=brute["texte"],
                defaults={
                    "auteur": auteur,
                    "etat": brute.get("etat", "publiee"),
                    # ⚠️ **Les deux sources n'ont pas la même forme.** Ici la
                    # réponse est un objet `{auteur, texte, repondueLe}` ;
                    # dans `questionsRecentes`, c'est une chaîne. Passer
                    # l'objet tel quel l'enregistrait converti en texte Python
                    # — et le filtre de modération a refusé le charabia qui en
                    # sortait, ce qui a révélé l'erreur. Il a eu raison : du
                    # `{'auteur': ...}` affiché à un acheteur aurait été pire
                    # qu'une réponse manquante.
                    "reponse": _texte_de_la_reponse(brute.get("reponse")),
                },
            )

        for groupage in catalogue["groupages"]:
            campagne = par_identifiant.get(groupage["id"])
            if campagne is None:
                continue
            for echange in groupage.get("questionsRecentes") or []:
                cle = (campagne.pk, echange["question"])
                if cle in deja:
                    continue
                deja.add(cle)
                Question.objects.get_or_create(
                    campagne=campagne,
                    texte=echange["question"],
                    defaults={
                        "auteur": auteur,
                        "etat": "publiee",
                        "reponse": _texte_de_la_reponse(echange.get("reponse")),
                    },
                )

    # ── Les dossiers KYC en attente ─────────────────────────────────────────

    def _charger_les_dossiers_en_attente(self) -> None:
        """Les dossiers que l'administrateur trouvera dans sa file.

        ⚠️ Deux détours assumés, et commentés parce qu'ils ont l'air d'erreurs :

        - ``Groupeur.save`` refuse un titulaire Mobile Money qui ne concorde
          pas, ce qui est précisément le contrôle qu'on veut démontrer. Le
          dossier « Gros Bonnet » est donc écrit par ``update``, qui ne passe
          pas par ``save`` — comme le ferait un compte modifié hors parcours
          normal ;
        - ``cree_le`` est en ``auto_now_add`` : on le recule par ``update``
          pour que la colonne « attente » de l'écran A2 montre des dossiers de
          un à six jours. Sans cela, tous datent de l'instant du chargement et
          le tri par ancienneté ne se voit pas.
        """
        for donnees in DOSSIERS_EN_ATTENTE:
            groupeur, cree = Groupeur.objects.get_or_create(
                pseudonyme=donnees["pseudonyme"],
                defaults={
                    "nom_complet": donnees["nom_complet"],
                    "telephone": donnees["telephone"],
                    "courriel": donnees["courriel"],
                    "titulaire_mobile_money": donnees["nom_complet"],
                    "numero_mobile_money": donnees["telephone"],
                    "statut_kyc": Groupeur.StatutKyc.EN_VERIFICATION,
                },
            )
            if not cree:
                continue

            Groupeur.objects.filter(pk=groupeur.pk).update(
                titulaire_mobile_money=donnees["titulaire"],
                cree_le=timezone.now() - timedelta(days=donnees["jours"]),
            )

            PieceKyc.objects.bulk_create(
                PieceKyc(
                    groupeur=groupeur,
                    nature=nature,
                    reference=f"coffre/{groupeur.pk}/{nature}",
                )
                for nature in donnees["pieces"]
            )
