# -*- coding: utf-8 -*-
"""L'API REST — sérialiseurs et vues.

⚠️ **C'est ici que la règle d'anonymat est tenue ou perdue** (§1.7). Deux
sérialiseurs décrivent la même commande :

- ``CommandeAcheteurSerializer`` — tout, c'est la sienne ;
- ``CommandeGroupeurSerializer`` — **un code et un quartier, rien d'autre**.

Aucun ``fields = "__all__"`` dans ce fichier, et c'est délibéré : c'est par là
que la fuite arrive. Un champ ajouté au modèle doit être ajouté explicitement
ici pour sortir, et les tests vérifient qu'aucune identité ne passe du côté
groupeur.
"""

from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Prefetch, Q
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from . import domaine
from .catalogue.models import Campagne
from .commandes.models import (
    Commande,
    PlafondAtteint,
    enregistrer_paiement,
)
from .comptes.sessions import AuthentificationSession, acheteur_de_la_requete
from .comptes.models import Groupeur
from .echanges.models import Demande, Question


# ── Catalogue ───────────────────────────────────────────────────────────────


class CampagneSerializer(serializers.ModelSerializer):
    """Ce que l'acheteur voit d'une campagne.

    **Le groupeur n'y apparaît que par son pseudonyme** : ni son nom, ni son
    téléphone, ni son numéro Mobile Money ne sortent par cette API.
    """

    groupeur = serializers.CharField(source="groupeur.pseudonyme", read_only=True)
    acheteurs_confirmes = serializers.IntegerField(read_only=True)
    heures_restantes = serializers.IntegerField(read_only=True)
    #: Les questions **publiées** seulement : celles qui attendent la
    #: modération ne sont visibles que de leur auteur (§1.5), et une question
    #: qui finira refusée ne doit pas gonfler le compteur public.
    nombre_de_questions = serializers.IntegerField(read_only=True)
    #: La variante, regroupée pour l'interface : `null` quand il n'y en a pas.
    #:
    #: Deux champs plats (`variante_libelle`, `variante_options`) obligeraient
    #: chaque écran à retester lequel des deux fait foi. Un objet ou `null`
    #: ne laisse qu'une seule question à poser.
    variante = serializers.SerializerMethodField()
    #: Les deux dernieres questions **repondues**, affichees sur l'ecran 3.
    #:
    #: ⚠️ Repondues seulement : une question sans reponse, posee sur la fiche
    #: d'un produit qu'on hesite a acheter, inquiete plutot qu'elle ne
    #: rassure — elle dit que le groupeur ne repond pas.
    questions_recentes = serializers.SerializerMethodField()
    #: Annoncés « à partir de », jamais comme un tarif unique : à ce stade
    #: l'acheteur n'a pas dit où il est.
    frais_livraison_a_partir_de = serializers.SerializerMethodField()

    class Meta:
        model = Campagne
        fields = (
            "id",
            "titre",
            "description",
            "contenu_part",
            "categorie",
            "prix_part",
            "media",
            "media_alt",
            "date_fin",
            "statut",
            "groupeur",
            "acheteurs_confirmes",
            "heures_restantes",
            "frais_livraison_a_partir_de",
            "caracteristiques",
            "variante",
            "quartier_remise",
            "point_remise",
            "remise_le",
            "nombre_de_questions",
            "questions_recentes",
        )

    def get_frais_livraison_a_partir_de(self, _obj) -> str:
        return str(domaine.FRAIS_LIVRAISON_PROVISOIRES)

    def get_questions_recentes(self, campagne: Campagne) -> list[dict]:
        """Les deux dernieres questions-reponses publiques.

        ⚠️ Lit `campagne.recentes`, **pose par le `Prefetch` de la vue** — et
        non `campagne.questions.filter(...)`, qui relancerait une requete par
        ligne du catalogue. Sur une page de 24 campagnes, la difference est de
        24 requetes a zero.
        """
        return [
            {"question": question.texte, "reponse": question.reponse}
            for question in getattr(campagne, "recentes", [])[:2]
        ]

    def get_variante(self, campagne: Campagne) -> dict | None:
        """`{"libelle": …, "options": [...]}`, ou `null`.

        `null` et non un objet vide : l'écran 5 n'affiche le sélecteur que
        s'il y a une variante, et « absent » se teste mieux que « présent mais
        vide ».
        """
        if not campagne.variante_libelle:
            return None
        return {
            "libelle": campagne.variante_libelle,
            "options": campagne.variante_options,
        }


class CampagneViewSet(viewsets.ReadOnlyModelViewSet):
    """Le catalogue. **Lisible sans compte** (§1.5)."""

    serializer_class = CampagneSerializer

    def get_queryset(self):
        # ⚠️ Les deux `annotate` evitent une requete par ligne a l'affichage
        # d'une liste de 24 campagnes — soit 48 requetes au lieu de 1. Sur la
        # connexion visee par le §5, ce n'est pas une optimisation de confort.
        #
        # `distinct=True` est **indispensable** des qu'il y a deux agregats sur
        # des relations differentes : sans lui, la jointure multiplie les
        # lignes et chaque compteur est gonfle par le cardinal de l'autre.
        queryset = (
            Campagne.objects.select_related("groupeur")
            .prefetch_related(
                # Les questions deja repondues, les plus recentes d'abord, pour
                # l'encart de la fiche produit. Un `Prefetch` nomme plutot
                # qu'un acces direct : il porte **son propre filtre et son
                # propre tri**, que le `related_name` par defaut ne saurait pas
                # exprimer.
                Prefetch(
                    "questions",
                    queryset=Question.objects.filter(
                        etat=Question.Etat.PUBLIEE
                    )
                    .exclude(reponse="")
                    .order_by("-posee_le"),
                    to_attr="recentes",
                )
            )
            .annotate(
                nb_acheteurs=Count(
                    "commandes",
                    filter=Q(commandes__statut__in=Commande.STATUTS_PAYANTS),
                    distinct=True,
                ),
                nb_questions=Count(
                    "questions",
                    filter=Q(questions__etat="publiee"),
                    distinct=True,
                ),
            )
            .order_by("date_fin")
        )

        categorie = self.request.query_params.get("categorie")
        if categorie:
            queryset = queryset.filter(categorie=categorie)

        statut = self.request.query_params.get("statut")
        if statut:
            queryset = queryset.filter(statut=statut)

        recherche = self.request.query_params.get("q")
        if recherche:
            queryset = queryset.filter(
                Q(titre__icontains=recherche) | Q(contenu_part__icontains=recherche)
            )

        return queryset

    @action(detail=True, methods=["get"], url_path="commandes")
    def commandes_du_groupeur(self, request, pk=None):
        """La liste des commandes **telle que le groupeur la voit**.

        ⚠️ Ni nom, ni numéro, ni adresse : un code et un quartier. L'écran 4
        promet à l'acheteur que ses coordonnées ne sont pas communiquées au
        groupeur, et c'est ce point d'entrée qui tient la promesse.
        """
        campagne = self.get_object()
        commandes = campagne.commandes.filter(statut__in=Commande.STATUTS_PAYANTS)
        return Response(CommandeGroupeurSerializer(commandes, many=True).data)


# ── Commandes ───────────────────────────────────────────────────────────────


class CommandeAcheteurSerializer(serializers.ModelSerializer):
    """La commande vue par celui qui l'a passée. Il a droit à tout."""

    campagne_titre = serializers.CharField(source="campagne.titre", read_only=True)
    groupeur = serializers.CharField(
        source="campagne.groupeur.pseudonyme", read_only=True
    )

    class Meta:
        model = Commande
        fields = (
            "id",
            "campagne",
            "campagne_titre",
            "groupeur",
            "quantite",
            "variante",
            "montant_parts",
            "frais_livraison",
            "total",
            "quartier",
            "repere",
            "telephone",
            "code_livraison",
            "statut",
            "passee_le",
        )


class CommandeGroupeurSerializer(serializers.ModelSerializer):
    """La commande vue par le groupeur.

    ⚠️ **Quatre champs, et pas un de plus.** Le code identifie la commande, le
    quartier sert à organiser les tournées ; c'est tout ce dont il a besoin
    pour emballer et compter. Ajouter ``acheteur``, ``repere`` ou ``telephone``
    ici lui permettrait de se constituer un fichier de clients et de les servir
    hors plateforme — autrement dit de supprimer notre commission.
    """

    class Meta:
        model = Commande
        fields = ("code_livraison", "quantite", "variante", "montant_parts", "quartier")


class ChampTelephone(serializers.CharField):
    """Un numéro, ramené à ``+228XXXXXXXX`` **dès la validation**.

    ⚠️ **Le faire ici et nulle part ailleurs.** Si la normalisation vivait
    dans les vues, il suffirait d'oublier un appel pour recréer deux comptes
    pour la même personne — et ça ne se verrait qu'au moment où quelqu'un ne
    retrouve plus ses commandes, soit longtemps après. Rattachée au champ,
    elle s'applique partout où le champ est employé.
    """

    def to_internal_value(self, data):
        brut = super().to_internal_value(data)
        try:
            return domaine.normaliser_telephone(brut)
        except domaine.NumeroInvalide as erreur:
            raise ValidationError(str(erreur)) from erreur


class PaiementSerializer(serializers.Serializer):
    """Ce que le client envoie pour payer."""

    campagne = serializers.PrimaryKeyRelatedField(queryset=Campagne.objects.all())
    #: Le numéro **de livraison**, facultatif : celui du compte par défaut.
    #: Ce n'est pas lui qui identifie l'acheteur — c'est la session.
    telephone = ChampTelephone(max_length=20, required=False, allow_blank=True)
    quantite = serializers.IntegerField(min_value=1)
    variante = serializers.CharField(max_length=60, required=False, allow_blank=True)
    quartier = serializers.CharField(max_length=40)
    repere = serializers.CharField(max_length=200)
    #: Générée par le client **avant** l'appel : deux appuis portent la même
    #: clé, et le serveur n'encaisse qu'une fois.
    cle_idempotence = serializers.CharField(max_length=80)


class CommandeViewSet(viewsets.GenericViewSet):
    """Les commandes de l'acheteur, identifié par **sa session**.

    ⚠️ **``?telephone=`` n'identifie plus personne, et ne doit pas revenir.**
    C'était commode et c'était un trou : huit chiffres se devinent, donc
    n'importe qui pouvait lire les commandes de n'importe qui. Le jeton de
    session le remplace — voir ``api_comptes.py`` pour ce que ça change
    exactement.

    Le laisser « pour compatibilité » laisserait la porte ouverte juste à côté
    de la serrure qu'on vient de poser.
    """

    serializer_class = CommandeAcheteurSerializer
    #: ⚠️ **Declaree ici, et non dans ``REST_FRAMEWORK``.**
    #:
    #: Un reglage global aurait ete plus court d'une ligne par vue, et moins
    #: lisible : rien, en ouvrant ce fichier, ne dirait que ces routes
    #: exigent une session. Ici, la dependance se voit a l'endroit ou elle
    #: s'applique.
    #:
    #: Elle sert a deux choses. Elle **reconnait** l'acheteur a son jeton, et
    #: surtout elle fait repondre DRF **401 — et non 403** quand il n'y en a
    #: pas : l'ecran doit rouvrir la feuille de connexion, pas afficher
    #: « acces refuse » a quelqu'un dont la session a simplement expire.
    authentication_classes = [AuthentificationSession]

    def get_queryset(self):
        return (
            Commande.objects.filter(
                acheteur=acheteur_de_la_requete(self.request)
            )
            .select_related("campagne", "campagne__groupeur")
            .order_by("-passee_le")
        )

    def list(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="payer")
    def payer(self, request):
        """Encaisse une commande.

        **C'est le seul point d'entrée qui exige un compte** (§1.5), et il le
        crée lui-même : un numéro suffit, pas d'inscription séparée. Choisir
        une quantité et saisir une adresse n'engagent rien ; payer engage.

        ⚠️ Le paiement est **simulé** jusqu'à l'agrément d'un agrégateur
        (§18.2). La commande est enregistrée comme si l'encaissement avait
        réussi.
        """
        entree = PaiementSerializer(data=request.data)
        entree.is_valid(raise_exception=True)
        donnees = entree.validated_data

        # ⚠️ **L'acheteur vient de la session, jamais du corps de la requête.**
        # Accepter un numéro ici laisserait payer au nom d'un autre — et donc
        # faire livrer chez soi une commande inscrite au compte de quelqu'un
        # d'autre.
        acheteur = acheteur_de_la_requete(request)

        # L'adresse qu'il vient de saisir devient son adresse par défaut, pour
        # pré-remplir la prochaine commande. On ne lui a rien demandé de plus :
        # elle était déjà dans le formulaire.
        if (
            donnees["quartier"] != acheteur.quartier
            or donnees["repere"] != acheteur.repere
        ):
            acheteur.quartier = donnees["quartier"]
            acheteur.repere = donnees["repere"]
            acheteur.save(update_fields=["quartier", "repere"])

        try:
            commande, creee = enregistrer_paiement(
                campagne=donnees["campagne"],
                acheteur=acheteur,
                quantite=donnees["quantite"],
                quartier=donnees["quartier"],
                repere=donnees["repere"],
                # Le numéro **de livraison**, qui peut différer de celui du
                # compte : on se fait livrer chez sa sœur sans changer de
                # compte. Par défaut c'est celui du compte.
                telephone=donnees.get("telephone") or acheteur.telephone,
                variante=donnees.get("variante", ""),
                cle_idempotence=donnees["cle_idempotence"],
            )
        except domaine.ZoneNonDesservie as erreur:
            raise ValidationError({"quartier": str(erreur)}) from erreur
        except PlafondAtteint as erreur:
            # ⚠️ Sur `campagne`, et non `detail` : le refus porte sur le
            # groupage, pas sur la saisie de l'acheteur — qui n'a rien fait de
            # mal. L'écran l'affiche à côté du produit, pas sous un champ.
            raise ValidationError({"campagne": str(erreur)}) from erreur
        except DjangoValidationError as erreur:
            raise ValidationError(erreur.message_dict or erreur.messages) from erreur

        return Response(
            CommandeAcheteurSerializer(commande).data,
            # 200 et non 201 sur un rejeu : rien n'a été créé cette fois-ci.
            status=status.HTTP_201_CREATED if creee else status.HTTP_200_OK,
        )


# ── Échanges ────────────────────────────────────────────────────────────────


class QuestionSerializer(serializers.ModelSerializer):
    """Une question publique.

    L'auteur n'apparaît que par son prénom et son initiale : « Akosua D. ».
    """

    auteur = serializers.CharField(source="auteur_affiche", read_only=True)

    class Meta:
        model = Question
        fields = ("id", "campagne", "texte", "auteur", "etat", "posee_le", "reponse")
        read_only_fields = ("etat", "posee_le", "reponse")


class QuestionViewSet(viewsets.ModelViewSet):
    """Les questions publiques. **Lire est libre, écrire demande un compte.**"""

    serializer_class = QuestionSerializer
    http_method_names = ["get", "post", "head", "options"]
    #: ⚠️ **Declaree ici, et non dans ``REST_FRAMEWORK``.**
    #:
    #: Un reglage global aurait ete plus court d'une ligne par vue, et moins
    #: lisible : rien, en ouvrant ce fichier, ne dirait que ces routes
    #: exigent une session. Ici, la dependance se voit a l'endroit ou elle
    #: s'applique.
    #:
    #: Elle sert a deux choses. Elle **reconnait** l'acheteur a son jeton, et
    #: surtout elle fait repondre DRF **401 — et non 403** quand il n'y en a
    #: pas : l'ecran doit rouvrir la feuille de connexion, pas afficher
    #: « acces refuse » a quelqu'un dont la session a simplement expire.
    authentication_classes = [AuthentificationSession]

    def get_queryset(self):
        queryset = Question.objects.select_related("auteur", "campagne")
        campagne = self.request.query_params.get("campagne")
        if campagne:
            queryset = queryset.filter(campagne_id=campagne)
        # Les questions en vérification ne sont visibles que de leur auteur :
        # elles ne sortent pas de la liste publique.
        return queryset.filter(etat=Question.Etat.PUBLIEE)

    def create(self, request, *args, **kwargs):
        # Poser une question demande un compte ; la lire, non (§1.5).
        acheteur = acheteur_de_la_requete(request)

        entree = self.get_serializer(data=request.data)
        entree.is_valid(raise_exception=True)
        try:
            question = Question.objects.create(
                campagne=entree.validated_data["campagne"],
                auteur=acheteur,
                texte=entree.validated_data["texte"],
            )
        except DjangoValidationError as erreur:
            raise ValidationError(erreur.message_dict or erreur.messages) from erreur

        return Response(
            self.get_serializer(question).data, status=status.HTTP_201_CREATED
        )


class DemandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Demande
        fields = (
            "id",
            "produit",
            "quantite",
            "quartier",
            "budget_maximum",
            "precisions",
            "statut",
            "campagne",
            "deposee_le",
        )
        read_only_fields = ("statut", "campagne", "deposee_le")


class DemandeViewSet(viewsets.ModelViewSet):
    """Les demandes de produit. La demande crée l'offre."""

    serializer_class = DemandeSerializer
    http_method_names = ["get", "post", "head", "options"]
    #: ⚠️ **Declaree ici, et non dans ``REST_FRAMEWORK``.**
    #:
    #: Un reglage global aurait ete plus court d'une ligne par vue, et moins
    #: lisible : rien, en ouvrant ce fichier, ne dirait que ces routes
    #: exigent une session. Ici, la dependance se voit a l'endroit ou elle
    #: s'applique.
    #:
    #: Elle sert a deux choses. Elle **reconnait** l'acheteur a son jeton, et
    #: surtout elle fait repondre DRF **401 — et non 403** quand il n'y en a
    #: pas : l'ecran doit rouvrir la feuille de connexion, pas afficher
    #: « acces refuse » a quelqu'un dont la session a simplement expire.
    authentication_classes = [AuthentificationSession]

    def get_queryset(self):
        # Comme les commandes : la session, jamais un numéro en URL.
        return Demande.objects.filter(acheteur=acheteur_de_la_requete(self.request))

    def create(self, request, *args, **kwargs):
        acheteur = acheteur_de_la_requete(request)
        entree = self.get_serializer(data=request.data)
        entree.is_valid(raise_exception=True)
        demande = Demande.objects.create(acheteur=acheteur, **entree.validated_data)
        return Response(
            self.get_serializer(demande).data, status=status.HTTP_201_CREATED
        )


# ── Groupeurs ───────────────────────────────────────────────────────────────


class GroupeurPublicSerializer(serializers.ModelSerializer):
    """Ce que l'acheteur peut savoir d'un groupeur : son pseudonyme.

    ⚠️ Pas de nom, pas de quartier, pas de date d'inscription, pas de photo.
    Le §1.7 est explicite sur ce que cette fiche ne doit **pas** contenir, et la
    liste est courte parce que le pseudonyme suffit.
    """

    class Meta:
        model = Groupeur
        fields = ("id", "pseudonyme")
