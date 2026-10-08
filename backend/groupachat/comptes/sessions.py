# -*- coding: utf-8 -*-
"""La mécanique de session : code SMS, jeton, reconnaissance de l'acheteur.

Séparé de ``api_comptes.py``, qui porte les *routes*. Ce n'est pas un découpage
esthétique : ``settings.REST_FRAMEWORK`` désigne la classe d'authentification
par son chemin, et DRF l'importe **à la première requête**. Si elle vivait dans
le module des vues, cet import tomberait au milieu du chargement de ce même
module — qui est en train d'importer DRF pour définir ses sérialiseurs — et
Python rendrait un module à moitié construit, où la classe n'existe pas encore.

Ici, ce fichier ne définit aucune vue et aucun sérialiseur : il n'importe de
DRF que ``BaseAuthentication``, et la boucle n'existe pas.
"""

from __future__ import annotations

import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import NotAuthenticated

from .models import Acheteur, CodeConnexion, SessionAcheteur


class CodeSmsNonConfigure(Exception):
    """Pas de fournisseur SMS, et on n'est pas en développement."""


def mode_demonstration() -> bool:
    """Le code est-il fixe et montré à l'écran ?

    Vrai dans deux cas, et deux seulement :

    - ``DEBUG`` — on développe ;
    - ``SMS_FOURNISSEUR=demonstration``, **écrit à la main** dans le fichier
      d'environnement.

    ## Pourquoi ce second cas existe

    Parce que sans lui, une démonstration déployée ne peut prendre aucune
    commande. Le conteneur tourne avec ``DEBUG=0`` — c'est le bon réglage, il
    évite d'exposer les traces et les variables d'environnement — et aucun
    fournisseur SMS n'est branché, donc la connexion répondrait 503. Un jury
    verrait un catalogue qu'on ne peut pas acheter.

    ⚠️ **C'est un opt-in, pas un repli.** Il faut écrire le mot
    ``demonstration`` dans ``.env``, et il reste visible dans la configuration
    de déploiement. La différence avec un défaut silencieux est toute la
    différence : un défaut part en production par oubli, une valeur écrite à
    la main y part par décision.
    """
    if settings.DEBUG:
        return True
    return getattr(settings, "SMS_FOURNISSEUR", "") == "demonstration"


def envoyer_le_code(telephone: str) -> tuple[CodeConnexion, str | None]:
    """Crée un code, et le « transmet ».

    Renvoie ``(code, valeur_en_clair)``. ``valeur_en_clair`` n'est rempli
    **qu'en mode démonstration**, pour que l'écran puisse l'afficher au lieu de
    laisser chercher.

    ⚠️ **Sans fournisseur SMS et hors démonstration, cette fonction lève.**
    C'est délibéré et c'est le point le plus important de ce fichier : un code
    fixe mis en ligne pour de vrai donnerait à n'importe qui le compte de
    n'importe quel numéro. Un réglage de développement ne doit pas pouvoir
    partir en production par simple oubli — il faut que quelque chose
    l'arrête, et c'est ici.
    """
    if not getattr(settings, "SMS_FOURNISSEUR", "") and not settings.DEBUG:
        raise CodeSmsNonConfigure

    if mode_demonstration():
        # Fixe, et l'écran le dit. Un code aléatoire qu'on ne recevrait nulle
        # part rendrait l'application inutilisable.
        clair = getattr(settings, "CODE_SMS_DEMONSTRATION", "1234")
    else:
        # `secrets` et non `random` : ce nombre garde un compte.
        clair = f"{secrets.randbelow(10_000):04d}"

    # Les codes précédents de ce numéro meurent : sinon, en redemander un
    # laisserait les anciens valables, et multiplierait les codes en vol.
    CodeConnexion.objects.filter(telephone=telephone, consomme=False).update(
        consomme=True
    )

    code = CodeConnexion.objects.create(
        telephone=telephone,
        code_hache=make_password(clair),
        expire_le=timezone.now() + timedelta(minutes=CodeConnexion.DUREE_MINUTES),
    )

    # ⚠️ C'est ici que partira le SMS, le jour où un fournisseur est branché.
    # Rien n'est envoyé aujourd'hui, et l'API le dit à l'appelant plutôt que de
    # laisser croire le contraire.

    return code, clair if mode_demonstration() else None


def ouvrir_une_session(acheteur: Acheteur) -> SessionAcheteur:
    """Délivre un jeton.

    ``token_urlsafe(32)`` : 256 bits tirés par ``secrets``. Ce n'est pas de la
    coquetterie — c'est précisément ce qui le distingue du numéro de téléphone
    qu'il remplace, lequel se devine en huit chiffres.
    """
    return SessionAcheteur.objects.create(
        acheteur=acheteur,
        jeton=secrets.token_urlsafe(32),
        expire_le=timezone.now() + timedelta(days=SessionAcheteur.DUREE_JOURS),
    )


def session_de_la_requete(request) -> SessionAcheteur | None:
    """Lit l'en-tête ``Authorization: Jeton <…>`` et retrouve la session.

    Renvoie ``None`` plutôt que de lever : on navigue sans compte (§1.5), et
    c'est à chaque point d'entrée de décider s'il l'exige.
    """
    entete = request.headers.get("Authorization", "")
    if not entete.startswith("Jeton "):
        return None

    jeton = entete[len("Jeton ") :].strip()
    if not jeton:
        return None

    session = (
        SessionAcheteur.objects.select_related("acheteur").filter(jeton=jeton).first()
    )
    if session is None or not session.valide:
        return None

    session.prolonger()
    return session


class AuthentificationSession(BaseAuthentication):
    """Reconnaît l'acheteur à son jeton. Déclarée dans ``REST_FRAMEWORK``.

    ## Pourquoi une classe DRF plutôt qu'un simple appel dans chaque vue

    Pour une raison précise : **sans elle, DRF répond 403 au lieu de 401.** Il
    ne sait émettre un 401 que si une classe d'authentification lui fournit
    l'en-tête ``WWW-Authenticate``, et à défaut il suppose que l'appelant est
    identifié mais sans droits.

    La différence n'est pas théorique, l'interface fait deux choses
    différentes :

    | | Ce que l'écran doit faire |
    |---|---|
    | **401** — je ne sais pas qui vous êtes | Rouvrir la feuille de connexion |
    | **403** — je sais, et c'est non | Afficher un refus |

    Un acheteur dont la session a expiré doit retomber sur la feuille, pas sur
    « accès refusé » — sinon il n'a aucun moyen de revenir, et il croit avoir
    perdu son compte.

    ⚠️ **Elle n'exige rien par elle-même.** Un jeton absent laisse passer la
    requête en anonyme, parce que le catalogue se lit sans compte (§1.5). Ce
    sont les points d'entrée qui engagent quelque chose — payer, poser une
    question, lire ses commandes — qui appellent ``acheteur_de_la_requete``.
    """

    #: Le schéma annoncé dans ``WWW-Authenticate``. C'est lui qui transforme le
    #: 403 de DRF en 401.
    mot_cle = "Jeton"

    def authenticate(self, request):
        session = session_de_la_requete(request)
        if session is None:
            return None
        return (session.acheteur, session)

    def authenticate_header(self, request) -> str:
        return self.mot_cle


def acheteur_de_la_requete(request) -> Acheteur:
    """L'acheteur connecté, ou un 401.

    Lit ``request.user``, que ``AuthentificationSession`` a rempli. Le relire
    ici plutôt que de refaire le travail évite une seconde requête en base par
    appel — DRF a déjà résolu la session.
    """
    acheteur = getattr(request, "user", None)
    if not isinstance(acheteur, Acheteur):
        raise NotAuthenticated(
            "Votre session a expiré. Reconnectez-vous avec votre numéro."
        )
    return acheteur
