# -*- coding: utf-8 -*-
"""L'API de l'administration : l'état du service, et ce qui attend une décision.

**Derrière le jeton d'administration**, comme ``api_kyc.py`` — ces routes
voient tout : les montants détenus, les groupeurs, les campagnes échouées.

## Ce que l'écran A1 doit répondre, et dans quel ordre

Un administrateur qui ouvre cette page le matin a **une** question : qu'est-ce
qui attend une décision ? Pas « comment ça s'est passé ». Les routes suivent
cet ordre :

1. **ce qui bloque de l'argent** — les versements en attente d'un devis, parce
   que le groupeur, lui, attend d'être payé pour pouvoir acheter ;
2. **ce qui bloque un recrutement** — les dossiers KYC (``api_kyc.py``) ;
3. **ce qui a échoué** — groupages annulés, non aboutis : à comprendre, pas à
   décider ;
4. **les chiffres** — en dernier, parce qu'ils ne demandent rien.

⚠️ **Aucune route ne déplace d'argent sans trace.** Libérer un versement écrit
qui, quand et sur quelle campagne (§18.3). C'est la contrepartie du fait qu'un
jeton partagé ne distingue pas deux administrateurs : si on ne sait pas *qui*
au sens fort, on sait au moins *ce qui a été fait et sous quel nom*.
"""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response

from .api_kyc import JetonAdmin
from .catalogue.models import Campagne
from .commandes.models import (
    Commande,
    Justificatif,
    Versement,
    liberer_le_versement,
)
from .comptes.models import Groupeur
from .echanges.models import Question


class JustificatifSerializer(serializers.ModelSerializer):
    class Meta:
        model = Justificatif
        fields = (
            "id",
            "nature",
            "fournisseur",
            "montant",
            "reference",
            "etat",
            "motif_refus",
            "depose_le",
        )


class VersementSerializer(serializers.ModelSerializer):
    """Un versement, avec de quoi décider s'il peut partir.

    Il porte **le pseudonyme du groupeur et son vrai nom** : l'administration
    est le seul endroit où les deux se voient ensemble, et c'est nécessaire —
    on ne vire pas de l'argent à un pseudonyme.
    """

    campagne_titre = serializers.CharField(source="campagne.titre", read_only=True)
    groupeur = serializers.CharField(
        source="campagne.groupeur.pseudonyme", read_only=True
    )
    groupeur_nom = serializers.CharField(
        source="campagne.groupeur.nom_complet", read_only=True
    )
    groupeur_mobile_money = serializers.CharField(
        source="campagne.groupeur.numero_mobile_money", read_only=True
    )
    devis = JustificatifSerializer(read_only=True)
    liberable = serializers.BooleanField(read_only=True)
    jours_d_attente = serializers.SerializerMethodField()

    class Meta:
        model = Versement
        fields = (
            "id",
            "campagne",
            "campagne_titre",
            "groupeur",
            "groupeur_nom",
            "groupeur_mobile_money",
            "collecte",
            "commission",
            "verse",
            "frais_livraison_collectes",
            "etat",
            "libere_le",
            "libere_par",
            "effectue_le",
            "devis",
            "liberable",
            "jours_d_attente",
        )

    def get_jours_d_attente(self, versement: Versement) -> int:
        """Depuis combien de jours le groupeur attend son argent.

        ⚠️ **C'est le chiffre qui doit faire agir**, pas le montant. Un
        groupeur qui attend depuis cinq jours ne peut pas acheter la
        marchandise qu'il a vendue — et ce sont ses acheteurs qui attendront
        ensuite.
        """
        return max(0, (timezone.now() - versement.effectue_le).days)


class CampagneAdminSerializer(serializers.ModelSerializer):
    """Une campagne, vue de l'administration. Tout est visible ici."""

    groupeur = serializers.CharField(
        source="groupeur.pseudonyme", read_only=True
    )
    acheteurs_confirmes = serializers.IntegerField(read_only=True)
    collecte = serializers.DecimalField(
        source="collecte_sur_les_parts",
        max_digits=12,
        decimal_places=0,
        read_only=True,
    )
    heures_restantes = serializers.IntegerField(read_only=True)
    versement_etat = serializers.SerializerMethodField()
    rembourses = serializers.SerializerMethodField()

    class Meta:
        model = Campagne
        fields = (
            "id",
            "titre",
            "categorie",
            "prix_part",
            "statut",
            "groupeur",
            "acheteurs_confirmes",
            "collecte",
            "heures_restantes",
            "date_fin",
            "cree_le",
            "versement_etat",
            "rembourses",
        )

    def get_versement_etat(self, campagne: Campagne) -> str | None:
        versement = getattr(campagne, "versement", None)
        return versement.etat if versement else None

    def get_rembourses(self, campagne: Campagne) -> dict | None:
        """Les dégâts d'un groupage annulé : combien de gens, pour combien.

        ⚠️ **Sans ça, un groupage annulé affiche « 0 acheteur, 0 F ».**
        C'est exact — plus personne n'a payé, les commandes sont passées à
        « remboursée » — et c'est l'information la moins utile qu'on puisse
        donner à quelqu'un qui regarde précisément les échecs.

        Ce que l'administration veut savoir d'un groupage qui n'a pas abouti,
        c'est **combien de personnes ont été déçues**. C'est ce chiffre qui dit
        si l'annulation était bénigne ou coûteuse, et c'est lui qui pèsera sur
        le plafond du groupeur (§10.4).
        """
        if campagne.statut != Campagne.Statut.ANNULEE:
            return None

        remboursees = campagne.commandes.filter(statut="remboursee")
        total = remboursees.aggregate(
            parts=Sum("montant_parts"), frais=Sum("frais_livraison")
        )
        return {
            "acheteurs": remboursees.count(),
            "montant": int(
                (total["parts"] or 0) + (total["frais"] or 0)
            ),
        }


class AdministrationViewSet(viewsets.GenericViewSet):
    """Tout ce que l'écran A1 et ses sous-écrans interrogent."""

    permission_classes = [JetonAdmin]
    #: Pas d'authentification acheteur ici : c'est un autre mécanisme et un
    #: autre public. Voir ``api_kyc.DossierViewSet`` pour le raisonnement.
    authentication_classes: list = []
    serializer_class = CampagneAdminSerializer
    queryset = Campagne.objects.none()

    # ── L'état du service ───────────────────────────────────────────────────

    @action(detail=False, methods=["get"], url_path="tableau-de-bord")
    def tableau_de_bord(self, request):
        """Les files, les chiffres, et de quoi tracer les courbes."""
        maintenant = timezone.now()
        campagnes = Campagne.objects.all()

        ouvertes = [c for c in campagnes if c.est_ouverte]
        detenu = sum(
            (c.collecte_sur_les_parts for c in ouvertes), Decimal("0")
        )

        versements = Versement.objects.select_related(
            "campagne", "campagne__groupeur"
        )
        en_attente = [v for v in versements if v.etat == Versement.Etat.EN_ATTENTE]

        return Response(
            {
                "files": self._files(en_attente),
                "indicateurs": self._indicateurs(campagnes, detenu, versements),
                "alertes": self._alertes(en_attente),
                "serie_collecte": self._serie_collecte(),
                "repartition_statuts": self._repartition(campagnes),
                "activite": self._activite(maintenant),
            }
        )

    def _files(self, en_attente: list[Versement]) -> list[dict]:
        """Ce qui attend une décision, **du plus coûteux au moins coûteux**.

        Les versements d'abord : c'est la seule file où quelqu'un attend son
        argent pour pouvoir travailler. Un dossier KYC qui traîne coûte un
        groupeur ; un versement qui traîne coûte une livraison et la confiance
        de dizaines d'acheteurs.
        """
        sans_devis = [v for v in en_attente if v.devis is None]
        a_liberer = [v for v in en_attente if v.devis is not None]

        kyc = Groupeur.objects.filter(
            statut_kyc=Groupeur.StatutKyc.EN_VERIFICATION
        )
        questions = Question.objects.filter(
            etat=Question.Etat.PUBLIEE, reponse=""
        )
        recus_manquants = Campagne.objects.filter(
            statut=Campagne.Statut.EN_COURS
        ).exclude(justificatifs__nature=Justificatif.Nature.RECU)

        return [
            {
                "id": "versements",
                "libelle": "Virements à faire",
                "nombre": len(a_liberer),
                "detail": "Devis déposé, argent prêt à partir",
                "argent_expose": True,
                "plus_ancien_jours": max(
                    (
                        (timezone.now() - v.effectue_le).days
                        for v in a_liberer
                    ),
                    default=0,
                ),
            },
            {
                "id": "devis-attendus",
                "libelle": "Devis attendus",
                "nombre": len(sans_devis),
                "detail": "Clôturés, le groupeur n'a pas encore déposé son devis",
                "argent_expose": False,
                "plus_ancien_jours": max(
                    (
                        (timezone.now() - v.effectue_le).days
                        for v in sans_devis
                    ),
                    default=0,
                ),
            },
            {
                "id": "kyc",
                "libelle": "Dossiers KYC à valider",
                "nombre": kyc.count(),
                "detail": "Le recrutement est le goulot d'étranglement",
                "argent_expose": False,
                "plus_ancien_jours": self._anciennete(kyc, "cree_le"),
            },
            {
                "id": "recus",
                "libelle": "Reçus d'achat manquants",
                "nombre": recus_manquants.count(),
                "detail": "Payés, mais rien ne prouve qu'ils ont acheté",
                "argent_expose": True,
                "plus_ancien_jours": 0,
            },
            {
                "id": "questions",
                "libelle": "Questions sans réponse",
                "nombre": questions.count(),
                "detail": "Sur une fiche produit, elles inquiètent",
                "argent_expose": False,
                "plus_ancien_jours": self._anciennete(questions, "posee_le"),
            },
        ]

    def _anciennete(self, queryset, champ: str) -> int:
        plus_ancien = queryset.order_by(champ).first()
        if plus_ancien is None:
            return 0
        return max(0, (timezone.now() - getattr(plus_ancien, champ)).days)

    def _indicateurs(self, campagnes, detenu: Decimal, versements) -> list[dict]:
        """Quatre chiffres, et pas un de plus.

        ⚠️ **« Argent détenu en ce moment » est le premier**, et c'est lui qu'on
        rapproche du solde bancaire réel. C'est le seul chiffre de cet écran qui
        engage la responsabilité de la structure.

        ⚠️ **Le nombre d'inscrits n'y figure pas.** C'est la mesure qui flatte
        et n'engage à rien. Ce qui compte est le nombre de groupages allés
        jusqu'à la livraison.
        """
        livrees = campagnes.filter(statut=Campagne.Statut.LIVREE).count()
        annulees = campagnes.filter(statut=Campagne.Statut.ANNULEE).count()
        terminees = livrees + annulees

        commission = versements.filter(
            etat=Versement.Etat.EFFECTUE
        ).aggregate(total=Sum("commission"))["total"] or Decimal("0")

        return [
            {
                "id": "detenu",
                "libelle": "Argent détenu en ce moment",
                "valeur": int(detenu),
                "unite": "F",
                "detail": "À rapprocher du solde bancaire",
                "ton": "neutre",
            },
            {
                "id": "a-verser",
                "libelle": "En attente de virement",
                "valeur": int(
                    versements.filter(
                        etat=Versement.Etat.EN_ATTENTE
                    ).aggregate(total=Sum("verse"))["total"]
                    or 0
                ),
                "unite": "F",
                "detail": "Des groupeurs attendent pour acheter",
                "ton": "attention",
            },
            {
                "id": "aboutissement",
                "libelle": "Groupages aboutis",
                "valeur": (
                    round(livrees / terminees * 100) if terminees else 0
                ),
                "unite": "%",
                "detail": f"{livrees} livrés, {annulees} annulés",
                "ton": "succes" if terminees and livrees >= annulees else "neutre",
            },
            {
                "id": "commission",
                "libelle": "Commission encaissée",
                "valeur": int(commission),
                "unite": "F",
                "detail": "5 % sur les groupages aboutis",
                "ton": "neutre",
            },
        ]

    def _alertes(self, en_attente: list[Versement]) -> list[dict]:
        """Ce qui remonte tout seul. **Par gravité, pas par date.**"""
        alertes = []

        for versement in en_attente:
            jours = (timezone.now() - versement.effectue_le).days
            if jours >= 3 and versement.devis is not None:
                alertes.append(
                    {
                        "id": f"versement-{versement.pk}",
                        "gravite": "danger",
                        "texte": (
                            f"{versement.campagne.groupeur.pseudonyme} attend "
                            f"son virement depuis {jours} jours — "
                            f"{int(versement.verse):,} F".replace(",", " ")
                        ),
                        "destination": "versements",
                    }
                )

        # Le signal d'alerte numéro un du §10.5 : un compte de versement qui
        # n'est plus au nom du groupeur.
        from . import domaine

        for groupeur in Groupeur.objects.exclude(titulaire_mobile_money=""):
            if not domaine.noms_concordent(
                groupeur.nom_complet, groupeur.titulaire_mobile_money
            ):
                alertes.append(
                    {
                        "id": f"mobile-money-{groupeur.pk}",
                        "gravite": "danger",
                        "texte": (
                            f"{groupeur.pseudonyme} : le compte Mobile Money "
                            f"n'est pas à son nom"
                        ),
                        "destination": "dossiers",
                    }
                )

        return alertes

    def _serie_collecte(self) -> list[dict]:
        """La collecte des quatorze derniers jours, pour la courbe.

        ⚠️ **Calculée depuis les commandes payées**, pas depuis un compteur
        tenu à part : un compteur se désynchronise, et personne ne s'en aperçoit
        avant de comparer au relevé bancaire.
        """
        aujourdhui = timezone.now().date()
        debut = aujourdhui - timedelta(days=13)

        par_jour = {
            ligne["jour"]: ligne["total"]
            for ligne in Commande.objects.filter(
                statut__in=Commande.STATUTS_PAYANTS, passee_le__date__gte=debut
            )
            .annotate(jour=TruncDate("passee_le"))
            .values("jour")
            .annotate(total=Sum("montant_parts"))
        }

        return [
            {
                "jour": (debut + timedelta(days=decalage)).isoformat(),
                "montant": int(
                    par_jour.get(debut + timedelta(days=decalage), 0) or 0
                ),
            }
            for decalage in range(14)
        ]

    def _repartition(self, campagnes) -> list[dict]:
        """Combien de groupages dans chaque état. Alimente le camembert."""
        comptes = campagnes.values("statut").annotate(nombre=Count("id"))
        par_statut = {ligne["statut"]: ligne["nombre"] for ligne in comptes}
        return [
            {"statut": statut, "libelle": libelle, "nombre": par_statut.get(statut, 0)}
            for statut, libelle in Campagne.Statut.choices
        ]

    def _activite(self, maintenant) -> list[dict]:
        """Ce qui s'est passé. **En dernier, et c'est voulu** : ça n'engage rien."""
        lignes = []

        for versement in Versement.objects.select_related("campagne")[:6]:
            lignes.append(
                {
                    "date": versement.effectue_le.date().isoformat(),
                    "texte": (
                        f"{versement.campagne.titre} — clôturé, "
                        f"{int(versement.verse):,} F à verser".replace(
                            ",", " "
                        )
                    ),
                }
            )

        for campagne in Campagne.objects.filter(
            statut=Campagne.Statut.ANNULEE
        ).order_by("-cree_le")[:4]:
            lignes.append(
                {
                    "date": campagne.cree_le.date().isoformat(),
                    "texte": f"{campagne.titre} — groupage annulé, remboursements",
                }
            )

        return sorted(lignes, key=lambda ligne: ligne["date"], reverse=True)[:10]

    # ── Les groupages ───────────────────────────────────────────────────────

    @action(detail=False, methods=["get"], url_path="groupages")
    def groupages(self, request):
        """Tous les groupages, filtrables par état.

        C'est ici qu'on voit les **clôturés**, ceux qui **n'ont pas abouti** et
        ceux que les groupeurs ont **annulés** — trois choses différentes qu'un
        seul filtre ``statut`` distingue.
        """
        campagnes = (
            Campagne.objects.select_related("groupeur", "versement")
            .prefetch_related("commandes")
            .order_by("-cree_le")
        )

        statut = request.query_params.get("statut")
        if statut:
            campagnes = campagnes.filter(statut=statut)

        return Response(CampagneAdminSerializer(campagnes, many=True).data)

    # ── Les virements ───────────────────────────────────────────────────────

    @action(detail=False, methods=["get"], url_path="versements")
    def versements(self, request):
        """Les versements, du plus ancien au plus récent.

        **Du plus ancien**, parce qu'un groupeur qui attend depuis cinq jours
        ne peut pas acheter la marchandise qu'il a vendue, et que ce sont ses
        acheteurs qui attendront ensuite.
        """
        versements = Versement.objects.select_related(
            "campagne", "campagne__groupeur"
        ).order_by("effectue_le")

        etat = request.query_params.get("etat")
        if etat:
            versements = versements.filter(etat=etat)

        return Response(VersementSerializer(versements, many=True).data)

    @action(detail=True, methods=["post"], url_path="liberer")
    def liberer(self, request, pk=None):
        """Fait partir l'argent. **Refuse sans devis** (§10.3).

        ⚠️ Aucun virement réel n'est émis : le paiement est simulé jusqu'à
        l'agrément d'un agrégateur (§18.2). Cette route note que l'argent
        **doit** partir, et qui l'a décidé.
        """
        versement = Versement.objects.filter(pk=pk).first()
        if versement is None:
            raise NotFound("Versement introuvable.")

        par = (request.data.get("decide_par") or "Administration").strip()
        try:
            liberer_le_versement(versement, par=par)
        except DjangoValidationError as erreur:
            raise ValidationError({"detail": erreur.messages}) from erreur

        return Response(VersementSerializer(versement).data)
