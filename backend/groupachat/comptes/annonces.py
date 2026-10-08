# -*- coding: utf-8 -*-
"""Envoyer une décision KYC au groupeur — la couche qui parle à Django.

``notifications.py`` compose le texte sans rien connaître de Django ; ce module
le fait sortir. La séparation permet de relire et de tester chaque formulation
sans base de données ni serveur de messagerie, et c'est utile : ces messages
sont la seule parole de Group Achat qui quitte la plateforme.

## Pourquoi l'appel n'est pas traité comme un envoi raté

Les deux canaux sont de rang égal (§10.5 confie la décision à un humain, pas à
un automate), mais ils ne se terminent pas au même moment :

| Canal | Ce que fait ce module | Quand le groupeur sait |
|---|---|---|
| **Courriel** | Il part, et la décision est marquée annoncée | Dans la seconde |
| **Appel** | Il rend **le script à lire** ; rien n'est marqué | Quand un humain a décroché |

⚠️ **Un appel n'est donc pas « annoncé » à la sortie de ce module.** C'est
l'administrateur qui l'acte, après avoir réellement téléphoné. Cocher la case
sans appeler produirait un journal qui dit le contraire de ce qui s'est passé —
et c'est ce journal qu'on produit le jour d'un litige (§18.3).
"""

from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import send_mail

from .models import DecisionKyc


@dataclass(frozen=True)
class Annonce:
    """Le résultat d'une tentative d'annonce.

    ``script`` n'est rempli que pour un appel : c'est ce que l'administrateur
    doit lire. ``annonce`` dit si le groupeur est déjà au courant — faux après
    un appel, qui reste à passer.
    """

    canal: str
    annonce: bool
    script: str = ""
    sujet: str = ""
    corps: str = ""


def annoncer(decision: DecisionKyc) -> Annonce:
    """Fait sortir la décision par le canal choisi.

    Lève une ``ValidationError`` si le canal est le courriel et que le dossier
    n'en porte pas. Le téléphone étant obligatoire à l'inscription, l'appel
    reste toujours possible : il n'existe donc pas de décision impossible à
    annoncer, seulement des décisions à annoncer autrement.
    """
    if decision.canal == DecisionKyc.Canal.APPEL:
        script = decision.composer()
        assert isinstance(script, str)
        return Annonce(canal=decision.canal, annonce=False, script=script)

    destinataire = decision.groupeur.courriel
    if not destinataire:
        raise ValidationError(
            "Ce groupeur n'a pas déposé de courriel : annoncez-lui la décision "
            "par téléphone."
        )

    compose = decision.composer()
    assert isinstance(compose, tuple)
    sujet, corps = compose

    send_mail(
        subject=sujet,
        message=corps,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[destinataire],
        # On ne masque pas l'échec : si le courriel ne part pas, la décision
        # ne doit **pas** être marquée annoncée. Un dossier tranché dont le
        # groupeur ne sait rien est pire qu'un dossier non tranché — il n'est
        # plus dans la file de l'administrateur, donc plus personne ne le
        # reprend.
        fail_silently=False,
    )

    decision.marquer_notifie()
    return Annonce(
        canal=decision.canal, annonce=True, sujet=sujet, corps=corps
    )
