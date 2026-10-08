# -*- coding: utf-8 -*-
"""L'API du groupeur — ses campagnes, son portefeuille, ses questions.

Un troisième module, et le découpage suit **la règle d'anonymat** plutôt que
la taille des fichiers :

| Module | Ce qu'il laisse sortir |
|---|---|
| ``api.py`` | Le catalogue public. **Aucun nom**, le pseudonyme du groupeur |
| ``api_kyc.py`` | Les identités, derrière le jeton d'administration |
| ``api_groupeur.py`` | Ce qu'un groupeur voit : **des codes et des quartiers** |

Chaque fichier porte une règle unique, énoncée dès sa première ligne. Les
mélanger obligerait à relire, à chaque modification, un fichier où la moitié
des sérialiseurs doivent cacher ce que l'autre moitié doit montrer.

## ⚠️ La règle de ce fichier-ci

**Un groupeur ne voit jamais un nom, un numéro ni une adresse d'acheteur.** Il
voit un code de livraison et un quartier — de quoi emballer et compter, rien
de plus. Ce n'est pas une précaution de confort : c'est ce qui protège la
commission contre la désintermédiation. Un groupeur qui connaîtrait ses gros
acheteurs pourrait leur proposer la même marchandise hors plateforme, au même
prix, sans commission.

``CommandeGroupeurSerializer`` dans ``api.py`` porte déjà cette règle pour la
liste des commandes d'une campagne, et un test la vérifie champ par champ.

## ⚠️ Et sa faiblesse, qui est la même que partout

Le groupeur est identifié par **son numéro de téléphone**, passé en paramètre.
Qui connaît le numéro voit le portefeuille et les campagnes. C'est acceptable
le temps d'une démonstration sur données fictives, et **plus du tout ensuite** :
c'est l'authentification qui réglera ça, pas un correctif ici.
"""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Case, Count, IntegerField, Sum, Value, When
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response

from . import domaine
from .catalogue.models import Campagne
from .commandes.models import Commande, Versement, cloturer_campagne
from .comptes.models import Groupeur
from .echanges.models import Demande, Question


def groupeur_depuis_la_requete(request) -> Groupeur:
    """Retrouve le groupeur par son numéro, ou refuse.

    Centralisé pour que toutes les routes de ce module appliquent la **même**
    normalisation. Un numéro écrit autrement ferait sinon un 404 incompréhensible
    sur une partie des routes seulement — le genre de panne qu'on met longtemps
    à reproduire.
    """
    brut = request.query_params.get("telephone") or request.data.get("telephone")
    if not brut:
        raise ValidationError({"telephone": "Numéro manquant."})
    try:
        telephone = domaine.normaliser_telephone(str(brut))
    except domaine.NumeroInvalide as erreur:
        raise ValidationError({"telephone": str(erreur)}) from erreur

    groupeur = Groupeur.objects.filter(telephone=telephone).first()
    if groupeur is None:
        raise NotFound("Aucun groupeur à ce numéro.")
    return groupeur


# ── Les campagnes du groupeur ──────────────────────────────────────────────


class CampagneDuGroupeurSerializer(serializers.ModelSerializer):
    """Une campagne, vue par celui qui l'a lancée.

    Elle porte **plus** que la version acheteur — la collecte, le nombre de
    commandes — parce que ce sont ses chiffres à lui. Elle ne porte en
    revanche **aucune identité d'acheteur**, et c'est toute la règle de ce
    fichier.
    """

    produit = serializers.CharField(source="titre", read_only=True)
    prix_part = serializers.DecimalField(
        max_digits=12, decimal_places=0, read_only=True
    )
    commandes = serializers.IntegerField(
        source="acheteurs_confirmes", read_only=True
    )
    collecte = serializers.DecimalField(
        source="collecte_sur_les_parts",
        max_digits=12,
        decimal_places=0,
        read_only=True,
    )
    heures_restantes = serializers.IntegerField(read_only=True)
    photo = serializers.CharField(source="media", read_only=True)

    class Meta:
        model = Campagne
        fields = (
            "id",
            "produit",
            "categorie",
            "prix_part",
            "commandes",
            "collecte",
            "heures_restantes",
            "statut",
            "photo",
        )


class CreationCampagneSerializer(serializers.ModelSerializer):
    """Ce que l'écran 14 envoie pour lancer un groupage.

    ⚠️ ``groupeur`` n'est **pas** dans les champs, et c'est délibéré : il est
    déduit du numéro de téléphone côté serveur. L'accepter depuis le client
    laisserait n'importe qui lancer une campagne au nom d'un autre — et donc
    encaisser sur sa réputation.
    """

    #: Reçu en heures, parce que c'est ce que l'écran 14 demande : « combien de
    #: temps laissez-vous aux acheteurs ? ». Une date absolue obligerait
    #: l'interface à la calculer, et à gérer le fuseau de Lomé.
    duree_heures = serializers.IntegerField(min_value=1, max_value=24 * 30)

    class Meta:
        model = Campagne
        fields = (
            "titre",
            "description",
            "contenu_part",
            "categorie",
            "prix_part",
            "media",
            "media_alt",
            "caracteristiques",
            "variante_libelle",
            "variante_options",
            "quartier_remise",
            "point_remise",
            "remise_le",
            "duree_heures",
        )


class GroupeurViewSet(viewsets.GenericViewSet):
    """Tout ce que le groupeur consulte et fait depuis son application."""

    serializer_class = CampagneDuGroupeurSerializer

    # ── Écran 13 — le tableau de bord ───────────────────────────────────────

    @action(detail=False, methods=["get"], url_path="tableau-de-bord")
    def tableau_de_bord(self, request):
        """Les quatre chiffres du haut, et ce qui attend une décision.

        ⚠️ **« Disponible » et « en collecte » ne sont pas la même chose**, et
        les confondre serait un mensonge coûteux :

        - *en collecte* est l'argent des acheteurs sur des campagnes encore
          ouvertes. Il ne lui appartient pas, il est détenu par Group Achat
          jusqu'à la clôture ;
        - *disponible* est ce qui lui a été versé, commission retenue.

        Afficher la collecte comme un solde donnerait un chiffre flatteur et
        faux, et le premier versement détruirait la crédibilité du tableau de
        bord.
        """
        groupeur = groupeur_depuis_la_requete(request)
        campagnes = groupeur.campagnes.all()

        en_collecte = sum(
            (c.collecte_sur_les_parts for c in campagnes if c.est_ouverte),
            Decimal("0"),
        )
        verse = Versement.objects.filter(campagne__groupeur=groupeur).aggregate(
            total=Sum("verse")
        )["total"] or Decimal("0")

        return Response(
            {
                "pseudonyme": groupeur.pseudonyme,
                "niveau": groupeur.niveau,
                "plafond": (
                    int(groupeur.plafond) if groupeur.plafond is not None else None
                ),
                "campagnes_ouvertes": sum(1 for c in campagnes if c.est_ouverte),
                "commandes": Commande.objects.filter(
                    campagne__groupeur=groupeur,
                    statut__in=Commande.STATUTS_PAYANTS,
                ).count(),
                "en_collecte": int(en_collecte),
                "disponible": int(verse),
                "taches": self._taches(groupeur),
            }
        )

    def _taches(self, groupeur: Groupeur) -> list[dict]:
        """« À faire aujourd'hui » — **ce qui attend une décision**.

        Jamais ce qui s'est passé. Un tableau de bord qui raconte le passé se
        lit une fois ; un tableau de bord qui dit quoi faire s'ouvre tous les
        matins.

        L'ordre est celui de l'urgence réelle, pas celui du volume : une
        campagne à clôturer bloque l'argent de dizaines d'acheteurs, une
        question sans réponse n'en bloque aucun.
        """
        taches: list[dict] = []

        a_decider = [
            campagne
            for campagne in groupeur.campagnes.filter(statut=Campagne.Statut.OUVERTE)
            if campagne.heures_restantes == 0
        ]
        for campagne in a_decider:
            taches.append(
                {
                    "id": f"decision-{campagne.pk}",
                    "urgence": "urgent",
                    "libelle": f"{campagne.titre} — groupage clôturé, décidez",
                    "destination": "decision",
                }
            )

        sans_reponse = Question.objects.filter(
            campagne__groupeur=groupeur,
            etat=Question.Etat.PUBLIEE,
            reponse="",
        ).count()
        if sans_reponse:
            taches.append(
                {
                    "id": "questions",
                    "urgence": "normal",
                    "libelle": (
                        f"{sans_reponse} question"
                        f"{'s' if sans_reponse > 1 else ''} sans réponse"
                    ),
                    "destination": "questions",
                }
            )

        demandes = Demande.objects.filter(
            deposee_le__gte=timezone.now() - timedelta(days=7)
        ).count()
        if demandes:
            taches.append(
                {
                    "id": "demandes",
                    "urgence": "normal",
                    "libelle": (
                        f"{demandes} demande{'s' if demandes > 1 else ''} "
                        "cette semaine"
                    ),
                    "destination": "demandes",
                }
            )

        return taches

    # ── Écrans 14 et 15 — ses campagnes ─────────────────────────────────────

    @action(detail=False, methods=["get", "post"], url_path="campagnes")
    def campagnes(self, request):
        groupeur = groupeur_depuis_la_requete(request)

        if request.method == "GET":
            campagnes = groupeur.campagnes.order_by("-cree_le")
            return Response(
                CampagneDuGroupeurSerializer(campagnes, many=True).data
            )

        entree = CreationCampagneSerializer(data=request.data)
        entree.is_valid(raise_exception=True)
        donnees = dict(entree.validated_data)
        duree = donnees.pop("duree_heures")

        try:
            campagne = Campagne.objects.create(
                groupeur=groupeur,
                date_fin=timezone.now() + timedelta(hours=duree),
                **donnees,
            )
        except DjangoValidationError as erreur:
            # ⚠️ C'est ici qu'atterrit le refus d'un groupeur **non validé**
            # (§10.5) et le dépassement de plafond (§10.4) : les deux vivent
            # dans `Campagne.clean`. Le message du modèle est explicite, on le
            # laisse passer tel quel plutôt que de le remplacer par « requête
            # invalide ».
            raise ValidationError(
                getattr(erreur, "message_dict", None) or {"detail": erreur.messages}
            ) from erreur

        return Response(
            CampagneDuGroupeurSerializer(campagne).data,
            status=status.HTTP_201_CREATED,
        )

    # ── Écran 16 — clôturer ─────────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="cloturer")
    def cloturer(self, request, pk=None):
        """Le groupeur maintient le groupage : il est payé, commission retenue.

        ⚠️ **Il est payé intégralement à la clôture**, pas à la livraison
        (§7). Aucun écran ne doit donc écrire « votre argent est bloqué jusqu'à
        la livraison » : la formulation autorisée est « détenu jusqu'à la
        clôture ». C'est une règle produit, pas une tournure.
        """
        groupeur = groupeur_depuis_la_requete(request)
        campagne = groupeur.campagnes.filter(pk=pk).first()
        if campagne is None:
            raise NotFound("Cette campagne n'est pas la vôtre.")

        try:
            versement = cloturer_campagne(campagne)
        except DjangoValidationError as erreur:
            raise ValidationError({"detail": erreur.messages}) from erreur

        return Response(
            {
                "collecte": int(versement.collecte),
                "commission": int(versement.commission),
                "montant_verse": int(versement.verse),
                "frais_livraison_collectes": int(versement.frais_livraison_collectes),
            }
        )

    # ── Écran 18 — le portefeuille ──────────────────────────────────────────

    @action(detail=False, methods=["get"], url_path="portefeuille")
    def portefeuille(self, request):
        """L'historique des versements, du plus récent au plus ancien.

        Chaque ligne porte **la commission séparément**. La fondre dans le
        montant versé priverait le groupeur du moyen de vérifier les 5 %, et
        c'est exactement le genre d'opacité qui fait douter d'une plateforme
        qui tient l'argent des autres.
        """
        groupeur = groupeur_depuis_la_requete(request)
        versements = (
            Versement.objects.filter(campagne__groupeur=groupeur)
            .select_related("campagne")
            .order_by("-effectue_le")
        )

        return Response(
            {
                "disponible": int(
                    versements.aggregate(total=Sum("verse"))["total"]
                    or Decimal("0")
                ),
                "mouvements": [
                    {
                        "id": f"V{versement.pk}",
                        "date": versement.effectue_le.date().isoformat(),
                        "campagne": versement.campagne.titre,
                        "collecte": int(versement.collecte),
                        "commission": int(versement.commission),
                        "montant": int(versement.verse),
                    }
                    for versement in versements
                ],
            }
        )

    # ── Écran 19 — les demandes agrégées ────────────────────────────────────

    @action(detail=False, methods=["get"], url_path="demandes")
    def demandes(self, request):
        """Ce que les acheteurs réclament, **regroupé par produit et quartier**.

        ⚠️ **Agrégé, et jamais ligne par ligne.** Une demande individuelle
        porte le numéro de celui qui l'a déposée ; la servir au groupeur lui
        donnerait exactement le fichier de clients que l'anonymat lui refuse
        partout ailleurs. Ici il voit « 14 personnes à Agoè veulent du riz » —
        de quoi décider de lancer un groupage, et rien pour contacter qui que
        ce soit.
        """
        groupeur_depuis_la_requete(request)

        lignes = (
            Demande.objects.values("produit", "quartier")
            .annotate(
                personnes=Count("id"),
                plus_ancienne=Count("id"),
            )
            .order_by("-personnes")[:20]
        )

        agregees = []
        for index, ligne in enumerate(lignes, start=1):
            demandes = Demande.objects.filter(
                produit=ligne["produit"], quartier=ligne["quartier"]
            )
            plus_ancienne = demandes.order_by("deposee_le").first()
            budgets = [d.budget_maximum for d in demandes if d.budget_maximum]
            agregees.append(
                {
                    "id": f"D{index}",
                    "produit": ligne["produit"],
                    "quartier": ligne["quartier"],
                    "personnes": ligne["personnes"],
                    "jours_ecoules": (
                        (timezone.now() - plus_ancienne.deposee_le).days
                        if plus_ancienne
                        else 0
                    ),
                    "budget_moyen": (
                        int(sum(budgets) / len(budgets)) if budgets else 0
                    ),
                }
            )

        return Response(agregees)

    # ── Écran 20 — les questions reçues ─────────────────────────────────────

    @action(detail=False, methods=["get"], url_path="questions")
    def questions(self, request):
        """Les questions posées sur ses campagnes, **sans réponse d'abord**.

        L'ordre n'est pas chronologique : ce sont celles qui attendent qui
        demandent une action, et une question sans réponse sur une fiche
        produit inquiète l'acheteur qui hésite — elle dit que le groupeur ne
        répond pas.
        """
        groupeur = groupeur_depuis_la_requete(request)
        questions = (
            Question.objects.filter(
                campagne__groupeur=groupeur, etat=Question.Etat.PUBLIEE
            )
            .select_related("campagne")
            # ⚠️ `Q(reponse="").desc()` n'existe pas : un `Q` est un filtre,
            # pas une expression ordonnable. On annote donc un drapeau, qui a
            # en prime l'avantage de se lire — `order_by("reponse")` trierait
            # aussi les vides en tête, par hasard alphabétique, et personne ne
            # saurait dans six mois si c'était voulu.
            .annotate(
                sans_reponse=Case(
                    When(reponse="", then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            )
            .order_by("sans_reponse", "-posee_le")
        )

        return Response(
            [
                {
                    "id": question.pk,
                    "campagne": question.campagne.pk,
                    "campagne_titre": question.campagne.titre,
                    # ⚠️ Le prénom et l'initiale, jamais le nom complet (§1.7).
                    "auteur": question.auteur_affiche,
                    "texte": question.texte,
                    "reponse": question.reponse,
                    "posee_le": question.posee_le,
                }
                for question in questions
            ]
        )

    @action(detail=True, methods=["post"], url_path="repondre")
    def repondre(self, request, pk=None):
        """Répond à une question. **La réponse passe par la modération.**

        Le §15 filtre les deux sens : un groupeur qui glisse son numéro dans
        une réponse publique contourne la plateforme aussi sûrement qu'un
        acheteur qui le demande. Le filtre vit dans ``Question.save`` et
        s'applique donc ici sans qu'on ait à y penser — ce qui est le but.
        """
        groupeur = groupeur_depuis_la_requete(request)
        question = Question.objects.filter(
            pk=pk, campagne__groupeur=groupeur
        ).first()
        if question is None:
            raise NotFound("Cette question ne porte pas sur une de vos campagnes.")

        texte = (request.data.get("reponse") or "").strip()
        if not texte:
            raise ValidationError({"reponse": "La réponse est vide."})

        question.reponse = texte
        question.repondue_le = timezone.now()
        try:
            question.save()
        except DjangoValidationError as erreur:
            raise ValidationError(erreur.message_dict) from erreur

        return Response({"id": question.pk, "reponse": question.reponse})
