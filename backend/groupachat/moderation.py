# -*- coding: utf-8 -*-
"""Le filtre des messages publics — §14.2 du cahier des charges.

**Pourquoi ce filtre existe.** Un groupeur qui récupère les numéros de ses
acheteurs peut leur proposer la même marchandise hors plateforme, au même prix,
sans commission. L'anonymat des deux côtés est ce qui protège le modèle
économique, et les questions publiques sont le dernier endroit par où un numéro
pouvait passer.

**Ce module est le niveau 1** : des règles lexicales, qui tournent sans réseau
et sans modèle. Le niveau 2 — un classifieur — s'ajoutera derrière la même
signature, pour que les appelants n'aient pas à changer.

⚠️ **Le serveur refait le contrôle que le client a déjà fait.** Ce n'est pas
une redondance inutile : le filtre côté React prévient l'utilisateur avant
l'envoi, celui-ci protège la base. Un client modifié, une requête forgée ou un
appel direct à l'API contournent le premier ; aucun ne contourne le second.

⚠️ **La rédaction des messages de refus est contrainte** par le tableau de
l'écran 10 de la spec. Ne pas la réécrire sans l'avoir relu : chaque mot y est
justifié, et notamment l'absence de « interdit », « violation » et « tentative
de contournement » côté acheteur — la plupart des gens qui écrivent leur numéro
le font de bonne foi, pour être joints à la livraison.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

#: Un numéro togolais, écrit comme les gens l'écrivent : avec ou sans
#: indicatif, séparé par des espaces, des points ou des tirets.
_NUMERO = re.compile(r"(?:\+?228[\s.\-]*)?(?:\d[\s.\-]*){8,}")

#: Les autres façons de donner un contact.
_CONTACT = re.compile(
    r"\b(whatsapp|whats\s?app|wasap|telegram|facebook|messenger|e-?mail|gmail|"
    r"appelle[-\s]?moi|appelez[-\s]?moi|mon\s+num[ée]ro)\b",
    re.IGNORECASE,
)

#: Les propositions de vente hors plateforme.
_HORS_PLATEFORME = re.compile(
    r"\b(hors\s+(?:du\s+)?site|en\s+dehors\s+(?:du|de\s+la)\s+(?:site|plateforme)|"
    r"directement\s+avec\s+(?:toi|vous)|sans\s+passer\s+par)\b",
    re.IGNORECASE,
)

MOTIF_NUMERO = "numero"
MOTIF_CONTACT = "contact"
MOTIF_HORS_PLATEFORME = "hors-plateforme"


@dataclass(frozen=True)
class Verdict:
    """Le résultat d'un passage au filtre."""

    publiable: bool
    motif: str | None = None
    #: Le passage exact en cause, pour que l'auteur voie quoi corriger.
    passage: str | None = None


def verifier(message: str) -> Verdict:
    """Passe un message au filtre lexical."""
    texte = message or ""

    # Le numero est cherche **en premier**, et l'ordre compte. « Appelez-moi au
    # 90 12 34 56 » declenche les deux regles ; signaler « Appelez-moi » comme
    # passage en cause n'aide personne, alors que surligner le numero montre
    # exactement ce qu'il faut effacer.
    numero = _NUMERO.search(texte)
    # Au moins huit chiffres : « 20 litres » ou « 2 paires » doivent passer.
    if numero and len(re.findall(r"\d", numero.group(0))) >= 8:
        return Verdict(False, MOTIF_NUMERO, numero.group(0).strip())

    contact = _CONTACT.search(texte)
    if contact:
        return Verdict(False, MOTIF_CONTACT, contact.group(0))

    hors = _HORS_PLATEFORME.search(texte)
    if hors:
        return Verdict(False, MOTIF_HORS_PLATEFORME, hors.group(0))

    return Verdict(True)


def expliquer(motif: str, *, role: str = "acheteur") -> dict[str, str]:
    """Le texte à renvoyer au client, selon le motif et le côté du produit.

    **La copie est plus ferme côté groupeur**, parce que la bonne foi y est
    moins probable : l'acheteur n'a rien à gagner à sortir de la plateforme, le
    groupeur y gagnerait la commission. On lui dit que la tentative est
    enregistrée, ce qu'on ne dit jamais à un acheteur.
    """
    if role == "groupeur":
        return {
            "titre": "Cette réponse ne sera pas publiée.",
            "corps": (
                "Elle contient des informations permettant de vous identifier "
                "ou de vous contacter hors de Group Achat. Cette tentative est "
                "enregistrée. Les échanges de coordonnées peuvent entraîner la "
                "suspension de votre compte."
            ),
        }

    if motif == MOTIF_HORS_PLATEFORME:
        return {
            "titre": "Ce message ne sera pas publié.",
            "corps": (
                "Votre paiement n'est protégé que sur Group Achat. Une commande "
                "passée ailleurs ne l'est plus, et nous ne pourrions pas vous "
                "rembourser."
            ),
        }

    explication = {
        "titre": "Ce message ne sera pas publié.",
        "corps": (
            "Il contient des informations qui permettraient de vous identifier. "
            "Pour votre sécurité, les échanges restent anonymes sur Group Achat. "
            "Posez votre question sur le produit — le groupeur répond ici même."
        ),
    }

    if motif == MOTIF_NUMERO:
        # Le cas de bonne foi : quelqu'un qui donne son numéro veut être
        # joignable. La bonne réponse n'est pas de le bloquer et de s'arrêter
        # là, c'est de lui dire où ça va.
        explication["rassurance"] = (
            "Votre numéro est déjà enregistré pour la livraison. Le livreur "
            "l'aura le jour de sa tournée."
        )

    return explication
