# -*- coding: utf-8 -*-
"""Ce qu'on écrit à un groupeur quand son dossier KYC est tranché.

**Ce module ne connaît pas Django**, au même titre que ``domaine.py`` et
``moderation.py``. Il ne fait que composer du texte : c'est la couche Django
qui l'envoie, et c'est ce qui permet de tester chaque formulation sans base de
données ni serveur de messagerie.

## Pourquoi un module à part, et pas trois ``f``-strings dans la vue

Parce que ces messages sont **la seule parole de Group Achat qui sorte de la
plateforme**. Un groupeur refusé n'a que ce message pour comprendre ce qui
s'est passé, et il le montrera à d'autres. Les regrouper ici les rend
relisables d'un coup d'œil, et impose trois règles à chacun d'eux :

1. **dire la décision dans la première phrase**, pas au troisième paragraphe ;
2. **dire ce qu'il peut faire ensuite** — un refus sans suite est une porte
   fermée sans poignée ;
3. **ne jamais accuser.** « La pièce déposée n'est pas lisible » et « vous avez
   envoyé une pièce illisible » disent le même fait ; le second se dispute.

## Les deux canaux, et pourquoi l'appel n'est pas un pis-aller

Le §10.5 confie la décision à un humain. La transmettre par écrit seul
supposerait que tous les groupeurs lisent leurs courriels, ce qui est faux pour
une partie du cœur de cible — des commerçants de Lomé, souvent dans l'informel,
joignables au téléphone bien avant de l'être par messagerie.

D'où deux canaux de rang égal :

- **le courriel**, qui laisse une trace écrite et se relit ;
- **l'appel**, pour lequel ce module fournit un **script à lire**. Un script
  n'est pas une formalité bureaucratique : sans lui, deux administrateurs
  annoncent le même refus de deux manières différentes, et l'un des deux le dit
  mal un jour de fatigue.

⚠️ **Un refus annoncé par appel doit l'être par un humain qui appelle
vraiment.** Enregistrer le canal « appel » sans décrocher le téléphone
produirait un dossier qui dit le contraire de ce qui s'est passé — et ce
journal est opposable le jour d'un litige (§18.3).
"""

from __future__ import annotations

from typing import Literal

#: Les canaux par lesquels une décision peut être annoncée.
Canal = Literal["courriel", "appel"]

#: Le sens d'une décision d'administrateur.
#:
#: Trois issues, et non deux. « À compléter » est celle qui manquait le plus :
#: la grande majorité des dossiers refusés le sont pour une photo floue ou une
#: pièce prise de travers, et refuser définitivement pour cela ferait perdre
#: des groupeurs recrutables — alors que le recrutement est le goulot
#: d'étranglement du lancement (§10.5).
Issue = Literal["valide", "a-completer", "refuse"]


# ── Les motifs ──────────────────────────────────────────────────────────────
#
# Un motif est **obligatoire** dès que la décision n'est pas une validation.
# La liste est fermée, et c'est volontaire : un champ libre produirait au bout
# de six mois quarante formulations du même refus, impossibles à compter. Or
# savoir *pourquoi* les dossiers échouent est ce qui permet de corriger le
# formulaire d'inscription plutôt que de refuser les mêmes gens indéfiniment.
#
# Chaque motif porte trois choses : ce que l'administrateur lit dans la liste,
# ce que le groupeur reçoit, et ce qu'il doit faire. Les deux premières
# diffèrent — « doute sur l'identité » est une note interne, pas une phrase à
# envoyer à quelqu'un.
#
# ⚠️ Deux contraintes de rédaction, apprises en relisant la sortie réelle :
#
# 1. **``public`` se lit comme une raison, pas comme un verdict**, parce qu'il
#    est inséré après « Votre dossier n'a pas été validé : ». Un motif qui
#    répète le verdict produit une tautologie ;
# 2. **``suite`` doit se dire autant que s'écrire.** Le même texte part en
#    courriel et se lit au téléphone (``script_appel``). « Répondez à ce
#    message » est donc interdit : il n'y a pas de message dans un appel. On
#    écrit « recontactez-nous », qui vaut dans les deux canaux. Un test le
#    vérifie.

MOTIFS: dict[str, dict[str, str]] = {
    "piece-illisible": {
        "interne": "Pièce d'identité illisible",
        "public": (
            "la photo de votre pièce d'identité n'est pas assez lisible pour "
            "être vérifiée"
        ),
        "suite": (
            "Reprenez-la à plat, en pleine lumière, sans reflet du flash, et "
            "vérifiez que le numéro et la date de naissance se lisent."
        ),
    },
    "selfie-non-conforme": {
        "interne": "Selfie non conforme",
        "public": (
            "sur votre selfie, la pièce d'identité et votre visage ne sont pas "
            "visibles ensemble"
        ),
        "suite": (
            "Tenez la pièce à côté de votre visage, les deux dans le cadre, "
            "sans masquer la photo de la pièce avec vos doigts."
        ),
    },
    "dossier-incomplet": {
        "interne": "Dossier incomplet",
        "public": "votre dossier est incomplet",
        "suite": "Reprenez l'inscription : les pièces manquantes y sont indiquées.",
    },
    "noms-divergents": {
        "interne": "Contrôle n° 2 — titulaire Mobile Money différent de la pièce",
        "public": (
            "le compte Mobile Money indiqué n'est pas à votre nom, alors que "
            "c'est sur ce compte que partirait l'argent des acheteurs"
        ),
        # Pas de seconde chance par le même chemin, et ce n'est pas une
        # sévérité gratuite : le §10.5 arrête la procédure ici. Mais la cause
        # peut être un compte ouvert au nom d'un proche, qui se corrige — d'où
        # une suite qui existe, sans rouvrir le dossier automatiquement.
        "suite": (
            "Ouvrez un compte Mobile Money à votre nom, puis reprenez une "
            "inscription. Nous ne pouvons pas payer un retrait sur le compte "
            "d'un tiers."
        ),
    },
    "telephone-injoignable": {
        "interne": "Téléphone injoignable",
        "public": "nous n'avons pas réussi à vous joindre au numéro déposé",
        "suite": (
            "Reprenez l'inscription avec un numéro que vous consultez tous les "
            "jours."
        ),
    },
    "doute-identite": {
        "interne": "Doute sérieux sur l'identité",
        # Volontairement sans détail. Dire à quelqu'un *ce qui* a éveillé le
        # doute lui apprend quoi corriger pour recommencer.
        #
        # Mais sans détail ne veut pas dire sans contenu : la première version
        # disait « nous ne pouvons pas valider votre dossier », ce qui donnait
        # « Votre dossier n'a pas été validé : nous ne pouvons pas valider
        # votre dossier. » Une tautologie, et qui s'entend encore plus mal au
        # téléphone qu'elle ne se lit. Un motif public doit se lire **comme
        # une raison**, puisqu'il vient après un deux-points.
        "public": (
            "les éléments de votre dossier n'ont pas permis de confirmer votre "
            "identité"
        ),
        "suite": (
            "Si vous pensez qu'il s'agit d'une erreur, recontactez-nous : un "
            "administrateur reprendra le dossier."
        ),
    },
    "autre": {
        "interne": "Autre motif",
        "public": "votre dossier n'a pas pu être retenu après examen",
        "suite": "Recontactez-nous pour en connaître le détail.",
    },
}

#: Les motifs qui laissent la porte ouverte tout de suite, sans réinscription.
#:
#: Ils déterminent l'issue proposée par défaut à l'administrateur : un dossier
#: dont la photo est floue revient « à compléter », il n'est pas refusé.
MOTIFS_RATTRAPABLES = frozenset(
    {"piece-illisible", "selfie-non-conforme", "dossier-incomplet"}
)


class MotifInconnu(ValueError):
    """Un motif hors de la liste fermée."""


class MotifRequis(ValueError):
    """Une décision autre qu'une validation sans motif.

    Levée plutôt que tolérée : un refus sans motif est inexplicable au
    groupeur, et il est aussi illisible dans le journal six mois plus tard,
    quand on cherche pourquoi un groupeur a été écarté.
    """


def libelle_interne(motif: str) -> str:
    """Ce que l'administrateur lit dans sa liste."""
    if motif not in MOTIFS:
        raise MotifInconnu(motif)
    return MOTIFS[motif]["interne"]


def verifier(issue: Issue, motif: str | None) -> None:
    """Contrôle la cohérence d'une décision **avant** de l'enregistrer.

    Appelée par la couche Django et par l'interface d'administration, pour que
    la règle « pas de refus sans motif » ne dépende pas de l'écran utilisé.
    """
    if issue == "valide":
        return
    if not motif:
        raise MotifRequis(issue)
    if motif not in MOTIFS:
        raise MotifInconnu(motif)


# ── Les messages ────────────────────────────────────────────────────────────


def message_validation(pseudonyme: str, plafond: int | None) -> tuple[str, str]:
    """Le courriel de validation. Renvoie ``(sujet, corps)``.

    Le plafond est dit **dans le message**, et dès cette première phrase
    utile. Le découvrir au moment de créer sa campagne, bloqué par une erreur,
    est la pire façon de l'apprendre.

    ``plafond`` vaut ``None`` au niveau Établi, où il se décide au cas par cas
    (§10.4) : on écrit alors qu'il est fixé avec lui, on n'invente pas un
    chiffre.
    """
    sujet = "Votre dossier Group Achat est validé"

    if plafond is None:
        ligne_plafond = (
            "Votre plafond de collecte est fixé avec vous, groupage par "
            "groupage."
        )
    else:
        ligne_plafond = (
            f"Vous pouvez collecter jusqu'à {_francs(plafond)} par groupage."
        )

    # Le plafond a son propre paragraphe, et ce n'est pas une question de
    # goût : interpolé en tête d'un paragraphe déjà replié à 76 colonnes, il
    # en décalait toutes les lignes suivantes selon sa longueur. Un message en
    # texte brut se replie à la main, donc chaque morceau de longueur variable
    # doit être seul sur sa ligne.
    corps = f"""Bonjour {pseudonyme},

Votre dossier est validé : vous pouvez lancer votre premier groupage.

{ligne_plafond}

Après trois groupages livrés sans litige, ce plafond augmente — nous vous
demanderons alors une photo de votre lieu d'activité et deux références.

Trois choses à savoir avant de commencer :

- les acheteurs ne voient que votre pseudonyme, {pseudonyme}. Votre nom, votre
  numéro et votre adresse ne leur sont jamais montrés ;
- l'argent de vos acheteurs est à vous dès leur paiement. Il est détenu
  jusqu'à la clôture du groupage, puis vous le retirez en entier ;
- Group Achat retient 1 500 F par groupage abouti, au moment du retrait. Jamais
  sur les frais de livraison, et jamais sur un groupage annulé ;
- vous déposez votre devis fournisseur, puis votre reçu de paiement.

Ouvrez votre tableau de bord pour créer votre premier groupage.

L'équipe Group Achat
"""
    return sujet, corps


def message_decision_negative(
    pseudonyme: str, issue: Issue, motif: str
) -> tuple[str, str]:
    """Le courriel d'un dossier à compléter ou refusé.

    Un seul générateur pour les deux issues, parce que la différence ne tient
    qu'à une phrase : « reprenez » ou « nous ne pouvons pas aller plus loin ».
    Deux fonctions auraient fini par diverger sur le reste du texte, et c'est
    précisément le reste qui doit rester identique.
    """
    verifier(issue, motif)
    if issue == "valide":  # pragma: no cover - garde-fou d'appel
        raise ValueError("message_decision_negative appelée pour une validation")

    detail = MOTIFS[motif]

    if issue == "a-completer":
        sujet = "Votre dossier Group Achat : une pièce à reprendre"
        premiere = (
            f"Votre dossier n'est pas encore validé : {detail['public']}."
        )
        fermeture = (
            "Dès que c'est corrigé, nous le réexaminons sous 48 h ouvrées. "
            "Rien d'autre n'est à refaire."
        )
    else:
        sujet = "Votre dossier Group Achat n'a pas été validé"
        premiere = f"Votre dossier n'a pas été validé : {detail['public']}."
        fermeture = (
            "Nous savons que ce n'est pas la réponse attendue, et nous "
            "préférons vous le dire clairement plutôt que de laisser votre "
            "dossier sans réponse."
        )

    corps = f"""Bonjour {pseudonyme},

{premiere}

Ce qu'il faut faire : {detail["suite"]}

{fermeture}

L'équipe Group Achat
"""
    return sujet, corps


def script_appel(
    pseudonyme: str, issue: Issue, motif: str | None, plafond: int | None = None
) -> str:
    """Ce que l'administrateur lit au téléphone.

    **Au présent, en phrases courtes, et à la deuxième personne** — c'est fait
    pour être prononcé, pas lu. Les indications entre crochets ne se disent
    pas : elles conduisent l'appel.
    """
    verifier(issue, motif)

    if issue == "valide":
        plaf = (
            "votre plafond se fixe avec nous, groupage par groupage"
            if plafond is None
            else f"vous pouvez collecter jusqu'à {_francs(plafond)} par groupage"
        )
        return f"""[Se présenter : Group Achat, au sujet du dossier de groupeur.]

Bonjour, votre dossier est validé. Vous pouvez lancer votre premier groupage
dès aujourd'hui, et {plaf}.

Trois choses : les acheteurs ne voient que votre pseudonyme, {pseudonyme} —
jamais votre nom ni votre numéro. L'argent de vos acheteurs est à vous dès
leur paiement : vous le retirez en entier à la clôture, moins 1 500 F par
groupage. Et vous nous envoyez le devis de votre fournisseur.

[Demander s'il a des questions. Ne pas raccrocher avant qu'il ait dit qu'il
sait où créer son groupage.]"""

    detail = MOTIFS[motif or "autre"]
    annonce = (
        "Votre dossier n'est pas encore validé"
        if issue == "a-completer"
        else "Votre dossier n'a pas été validé"
    )
    suite = (
        "Vous reprenez cette pièce, et nous réexaminons sous deux jours "
        "ouvrés. Le reste de votre dossier est conservé."
        if issue == "a-completer"
        else detail["suite"]
    )

    return f"""[Se présenter : Group Achat, au sujet du dossier de groupeur.]

Bonjour. {annonce} : {detail["public"]}.

{suite}

[Laisser parler. Ne pas discuter le motif, ne pas en inventer un autre. Si la
personne apporte un élément nouveau, le noter et rouvrir le dossier plutôt que
de trancher au téléphone.]"""


def _francs(montant: int) -> str:
    """« 150 000 F » — espace insécable, comme partout dans le produit."""
    return f"{montant:,}".replace(",", " ") + " F"
