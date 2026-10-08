# -*- coding: utf-8 -*-
"""Petits outils partagés par les tests.

Un seul pour l'instant, mais il est employé par quatre fichiers : **ouvrir une
session acheteur**. Depuis que l'API identifie l'acheteur par un jeton et non
plus par un numéro en paramètre d'URL, chaque test qui lit des commandes ou
pose une question doit d'abord se connecter.

Le refaire à la main dans chaque test ferait quatre lignes de cérémonie avant
la première ligne utile, et on finirait par les copier sans les lire.
"""

from __future__ import annotations

from django.test import override_settings
from rest_framework.test import APIClient


def connecter(client: APIClient, telephone: str, **profil) -> str:
    """Ouvre une session et arme le client avec le jeton. Renvoie le jeton.

    Passe par **les vraies routes** — demande de code, puis vérification —
    plutôt que de créer une ``SessionAcheteur`` directement. C'est plus lent
    de deux requêtes, et ça vaut largement : le parcours de connexion est ainsi
    exercé par tous les tests qui en dépendent, et une régression dedans fait
    tomber beaucoup de choses au lieu de passer inaperçue.

    ``DEBUG=True`` est forcé le temps de la demande de code : c'est la seule
    condition dans laquelle le serveur accepte de servir un code fixe, et
    c'est voulu — voir ``api_comptes.envoyer_le_code``.
    """
    with override_settings(DEBUG=True):
        demande = client.post(
            "/api/comptes/code/", {"telephone": telephone}, format="json"
        )
        assert demande.status_code == 200, demande.data
        code = demande.data["code_de_demonstration"]

        ouverture = client.post(
            "/api/comptes/session/",
            {"telephone": telephone, "code": code, **profil},
            format="json",
        )
    assert ouverture.status_code == 201, ouverture.data

    jeton = ouverture.data["jeton"]
    client.credentials(HTTP_AUTHORIZATION=f"Jeton {jeton}")
    return jeton
