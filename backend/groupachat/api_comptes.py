# -*- coding: utf-8 -*-
"""Le compte acheteur : code SMS, session, profil.

**C'est le seul endroit du projet qui délivre une identité.** Tout ce qui lit
les commandes, les demandes et les questions d'un acheteur passe désormais par
le jeton qu'il produit, et non plus par un numéro de téléphone en paramètre
d'URL.

## Le parcours, et où il s'insère

    Il navigue librement — aucun compte (§1.5)
      │
      ├─ il choisit sa quantité, sa taille, son adresse
      │
      └─ il appuie sur « Payer »
            │
            ├─ POST /api/comptes/code/      { telephone }
            ├─ POST /api/comptes/session/   { telephone, code, nom, adresse }
            │        └─▶ { jeton }  ─── gardé par le navigateur
            │
            └─ le paiement **reprend tout seul**, avec le jeton

À la visite suivante, `GET /api/comptes/moi/` avec le jeton rend le profil :
plus de code SMS, plus de saisie d'adresse.

## ⚠️ Ce qui a été retiré, et pourquoi il ne faut pas le remettre

``?telephone=`` **n'identifie plus personne.** Les routes qui l'acceptaient —
commandes, demandes — exigent maintenant le jeton. Le laisser « pour
compatibilité » laisserait la porte ouverte juste à côté de la serrure qu'on
vient de poser : il suffisait de connaître un numéro, et huit chiffres se
devinent.

Le côté groupeur garde ce fonctionnement pour l'instant (``api_groupeur.py``),
et c'est un reste à traiter — pas un choix.

## Où est quoi

Ce fichier ne porte que **les routes**. La mécanique — génération du code,
jeton, reconnaissance de l'acheteur, classe d'authentification DRF — vit dans
``comptes/sessions.py``, et la séparation n'est pas esthétique : DRF importe la
classe d'authentification à la première requête, et si elle habitait ici, cet
import tomberait au milieu du chargement de ce module.
"""

from __future__ import annotations

from django.contrib.auth.hashers import check_password
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from . import domaine
from .comptes.models import Acheteur, CodeConnexion
from .comptes.sessions import (
    AuthentificationSession,
    CodeSmsNonConfigure,
    acheteur_de_la_requete,
    envoyer_le_code,
    ouvrir_une_session,
    session_de_la_requete,
)


# ── Les sérialiseurs ────────────────────────────────────────────────────────


class ChampTelephone(serializers.CharField):
    """Un numéro ramené à ``+228XXXXXXXX``. Voir ``domaine.normaliser_telephone``."""

    def to_internal_value(self, data):
        brut = super().to_internal_value(data)
        try:
            return domaine.normaliser_telephone(brut)
        except domaine.NumeroInvalide as erreur:
            raise ValidationError(str(erreur)) from erreur


class DemandeDeCodeSerializer(serializers.Serializer):
    telephone = ChampTelephone(max_length=20)


class OuvertureDeSessionSerializer(serializers.Serializer):
    telephone = ChampTelephone(max_length=20)
    code = serializers.CharField(min_length=4, max_length=4)
    #: Demandé seulement à la création du compte — l'écran le sait.
    nom = serializers.CharField(max_length=120, required=False, allow_blank=True)
    #: L'adresse que l'acheteur vient de saisir à l'écran de commande.
    quartier = serializers.CharField(
        max_length=40, required=False, allow_blank=True
    )
    repere = serializers.CharField(
        max_length=200, required=False, allow_blank=True
    )


class ProfilSerializer(serializers.ModelSerializer):
    """Ce que l'acheteur sait de lui-même.

    Il porte son numéro — c'est le sien, et l'écran 6 le pré-remplit pour le
    paiement Mobile Money (§6 point 5).
    """

    class Meta:
        model = Acheteur
        fields = ("id", "telephone", "nom", "quartier", "repere")


# ── La vue ──────────────────────────────────────────────────────────────────


class CompteViewSet(viewsets.GenericViewSet):
    """Code SMS, session, profil, déconnexion."""

    serializer_class = ProfilSerializer
    queryset = Acheteur.objects.none()

    #: ⚠️ Les routes ``moi/`` et ``deconnexion/`` en ont besoin ; ``code/`` et
    #: ``session/`` sont forcement anonymes — c'est leur raison d'etre. La
    #: classe **reconnait sans exiger**, donc la declarer pour tout le jeu de
    #: routes ne ferme rien : ce sont les vues qui appellent
    #: ``acheteur_de_la_requete`` qui exigent une session.
    authentication_classes = [AuthentificationSession]

    @action(detail=False, methods=["post"], url_path="code")
    def code(self, request):
        """Envoie un code de connexion.

        Renvoie ``compte_existe`` pour que l'écran sache s'il devra demander le
        nom à l'étape suivante. **Ce n'est pas une fuite d'information
        exploitable** : savoir qu'un numéro a déjà commandé chez nous n'apprend
        rien qu'on puisse monnayer, et l'alternative — demander son nom à
        quelqu'un qui l'a déjà donné — est une friction gratuite au pire moment.
        """
        entree = DemandeDeCodeSerializer(data=request.data)
        entree.is_valid(raise_exception=True)
        telephone = entree.validated_data["telephone"]

        try:
            _, clair = envoyer_le_code(telephone)
        except CodeSmsNonConfigure:
            return Response(
                {
                    "detail": (
                        "L'envoi de SMS n'est pas configuré sur ce serveur. "
                        "La connexion est impossible pour l'instant."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "envoye": True,
                "compte_existe": Acheteur.objects.filter(
                    telephone=telephone
                ).exists(),
                # ⚠️ Rempli **uniquement en mode démonstration** — `DEBUG`,
                # ou `SMS_FOURNISSEUR=demonstration` écrit à la main. Hors de
                # là, `envoyer_le_code` a déjà levé si rien ne peut l'envoyer.
                "code_de_demonstration": clair,
            }
        )

    @action(detail=False, methods=["post"], url_path="session")
    def session(self, request):
        """Vérifie le code et délivre un jeton. **Crée le compte s'il manque.**

        ⚠️ **Aucun second bouton « Créer un compte ».** Si le numéro est
        inconnu, le compte se crée ici, et l'écran demande le nom — rien
        d'autre. Faire choisir entre « se connecter » et « s'inscrire » à
        quelqu'un qui veut juste payer est une question dont il n'a pas la
        réponse : il ne sait pas s'il a déjà un compte chez nous.
        """
        entree = OuvertureDeSessionSerializer(data=request.data)
        entree.is_valid(raise_exception=True)
        donnees = entree.validated_data

        code = (
            CodeConnexion.objects.filter(
                telephone=donnees["telephone"], consomme=False
            )
            .order_by("-cree_le")
            .first()
        )
        if code is None or not code.utilisable:
            raise ValidationError(
                {"code": "Ce code n'est plus valable. Demandez-en un nouveau."}
            )

        if not check_password(donnees["code"], code.code_hache):
            # ⚠️ Le compteur monte **avant** la réponse, et il est enregistré
            # même quand on refuse : sinon trois essais deviendraient une
            # infinité, et quatre chiffres se devinent en dix mille coups.
            code.essais += 1
            code.save(update_fields=["essais"])
            restants = max(0, CodeConnexion.ESSAIS_MAXIMUM - code.essais)
            raise ValidationError(
                {
                    "code": (
                        f"Code incorrect. {restants} essai"
                        f"{'s' if restants > 1 else ''} restant"
                        f"{'s' if restants > 1 else ''}."
                        if restants
                        else "Code incorrect. Demandez-en un nouveau."
                    )
                }
            )

        code.consomme = True
        code.save(update_fields=["consomme"])

        acheteur, cree = Acheteur.objects.get_or_create(
            telephone=donnees["telephone"],
            defaults={
                "nom": donnees.get("nom", ""),
                "quartier": donnees.get("quartier", ""),
                "repere": donnees.get("repere", ""),
            },
        )

        if not cree:
            # ⚠️ **On complète, on n'écrase pas.** Quelqu'un qui se reconnecte
            # depuis un autre appareil n'envoie ni nom ni adresse ; les
            # remplacer par du vide effacerait ce qu'il a déjà donné. Et s'il
            # fournit une nouvelle adresse, elle devient la valeur par défaut :
            # c'est la dernière utilisée qui sert à pré-remplir.
            champs = []
            for champ in ("nom", "quartier", "repere"):
                valeur = donnees.get(champ, "")
                if valeur and valeur != getattr(acheteur, champ):
                    setattr(acheteur, champ, valeur)
                    champs.append(champ)
            if champs:
                acheteur.save(update_fields=champs)

        session = ouvrir_une_session(acheteur)

        return Response(
            {
                "jeton": session.jeton,
                "expire_le": session.expire_le,
                "acheteur": ProfilSerializer(acheteur).data,
                "compte_cree": cree,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="moi")
    def moi(self, request):
        """Le profil, au lancement. **C'est la reconnexion automatique.**

        L'application appelle cette route au démarrage avec le jeton retenu :
        si elle répond, l'acheteur est connecté sans rien faire ; si elle
        répond 401, le jeton est périmé et on l'oublie.
        """
        return Response(ProfilSerializer(acheteur_de_la_requete(request)).data)

    @action(detail=False, methods=["patch"], url_path="moi/profil")
    def modifier_le_profil(self, request):
        """Complète son profil — le nom, l'adresse.

        ⚠️ **Elle existe pour une raison précise de parcours.** Le nom est
        demandé *après* le code, pas avant : prouver qu'on a le téléphone est
        la seule chose qui engage, et un formulaire posé avant cette preuve
        serait rempli par n'importe qui. Mais une fois le code validé, la
        session est déjà ouverte — et le code, consommé. Il faut donc un
        second appel, authentifié celui-là, pour poser le nom.

        **Seuls les champs fournis changent.** Un appel qui ne porte que le
        nom n'efface pas l'adresse : voir le même raisonnement à l'ouverture
        de session.
        """
        acheteur = acheteur_de_la_requete(request)

        champs = []
        for champ in ("nom", "quartier", "repere"):
            valeur = request.data.get(champ)
            if valeur is not None and valeur != getattr(acheteur, champ):
                setattr(acheteur, champ, valeur)
                champs.append(champ)
        if champs:
            acheteur.save(update_fields=champs)

        return Response(ProfilSerializer(acheteur).data)

    @action(detail=False, methods=["post"], url_path="deconnexion")
    def deconnexion(self, request):
        """Révoque **cette** session, pas toutes celles de l'acheteur.

        Se déconnecter du téléphone d'un ami ne doit pas déconnecter le sien.
        Une révocation globale aurait sa place dans un écran « mes appareils »,
        qui n'existe pas encore.
        """
        session = session_de_la_requete(request)
        if session is not None:
            session.delete()
        # 204 même sans session : se déconnecter deux fois n'est pas une erreur.
        return Response(status=status.HTTP_204_NO_CONTENT)
