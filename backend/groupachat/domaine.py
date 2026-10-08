# -*- coding: utf-8 -*-
"""Les règles d'argent et d'anonymat de Group Achat.

**Ce module ne connaît ni Django ni la base de données.** C'est délibéré : ce
sont les règles que le cahier des charges verrouille, et elles doivent pouvoir
se lire et se tester sans monter une application. Les modèles les appellent,
ils ne les réécrivent pas.

Le pendant côté React vit dans ``frontend/src/domaine/``. Quand une règle
change ici, elle change là-bas — et l'inverse. Les deux implémentations sont
volontairement redondantes : le client calcule pour afficher, le serveur
calcule pour encaisser, et **c'est le serveur qui fait foi**.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

# ── L'argent ────────────────────────────────────────────────────────────────

#: Commission de la plateforme, à la charge du groupeur, retenue à la clôture.
TAUX_COMMISSION = Decimal("0.05")

#: Frais de livraison, en francs CFA.
#:
#: Le calcul réel selon la position n'existe pas encore : la fonction renvoie
#: 1 000 F pour toute position desservie. C'est écrit tel quel dans le cahier
#: des charges, et c'est **la seule constante à changer** le jour du vrai
#: calcul.
FRAIS_LIVRAISON_PROVISOIRES = Decimal("1000")

#: Les quartiers desservis. Hors de cette liste, la zone n'est pas couverte.
QUARTIERS_DESSERVIS = (
    "agoe",
    "be",
    "tokoin",
    "adidogome",
    "nyekonakpoe",
    "hedzranawoe",
)


def arrondir(montant: Decimal) -> Decimal:
    """Arrondit au franc. Il n'existe pas de centime de franc CFA."""
    return Decimal(montant).quantize(Decimal("1"), rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class Versement:
    """Ce qui revient au groupeur à la clôture d'une campagne."""

    collecte: Decimal
    commission: Decimal
    verse: Decimal


def calculer_versement(collecte_sur_les_parts: Decimal) -> Versement:
    """Applique la commission de 5 %.

    ⚠️ **La commission ne porte jamais sur les frais de livraison.** Ceux-ci
    sont payés par l'acheteur et vont au transporteur ; les inclure ferait
    payer au groupeur une commission sur de l'argent qui ne passe pas par lui.
    L'argument de cette fonction est donc la collecte **sur les parts**, et son
    nom le dit pour qu'on ne s'y trompe pas à l'appel.

    Aucune commission n'est prélevée sur une campagne annulée : dans ce cas, la
    fonction n'est simplement pas appelée.
    """
    collecte = arrondir(Decimal(collecte_sur_les_parts))
    commission = arrondir(collecte * TAUX_COMMISSION)
    return Versement(
        collecte=collecte,
        commission=commission,
        verse=collecte - commission,
    )


@dataclass(frozen=True)
class ResultatFrais:
    """Le résultat du calcul de frais pour une position."""

    desservi: bool
    montant: Decimal | None = None


def calculer_frais_livraison(quartier: str) -> ResultatFrais:
    """Les frais pour une position.

    **Deux réponses possibles, et deux seulement** : un montant, ou « zone non
    desservie ». Il n'y a pas de troisième cas « tarif calculé plus tard » —
    on ne demande jamais à quelqu'un de payer un total qu'on complétera après.
    """
    if (quartier or "").strip().lower() not in QUARTIERS_DESSERVIS:
        return ResultatFrais(desservi=False)
    return ResultatFrais(desservi=True, montant=FRAIS_LIVRAISON_PROVISOIRES)


def calculer_total_commande(
    prix_part: Decimal, quantite: int, quartier: str
) -> tuple[Decimal, Decimal, Decimal]:
    """Renvoie ``(montant_parts, frais_livraison, total)``.

    Les frais restent **une ligne distincte** de la part : la part est la même
    pour tous, les frais dépendent de la position, et l'acheteur doit pouvoir
    vérifier qu'on ne lui a rien glissé dans le total.
    """
    if quantite < 1:
        raise ValueError("La quantité doit valoir au moins 1.")

    frais = calculer_frais_livraison(quartier)
    if not frais.desservi or frais.montant is None:
        raise ZoneNonDesservie(quartier)

    montant_parts = arrondir(Decimal(prix_part) * quantite)
    return montant_parts, frais.montant, montant_parts + frais.montant


class ZoneNonDesservie(Exception):
    """Levée quand aucun transporteur ne couvre le quartier demandé."""

    def __init__(self, quartier: str) -> None:
        super().__init__(f"Nous ne livrons pas encore à {quartier}.")
        self.quartier = quartier


# ── Le code de livraison ────────────────────────────────────────────────────

#: Alphabet sans les caractères qu'on confond en les dictant : I/1, O/0.
_ALPHABET_CODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generer_code_livraison() -> str:
    """Un code de la forme ``K7M-4PQ``.

    Il se dicte au téléphone et se tape sur un clavier de livreur, d'où
    l'alphabet réduit. Il est tiré avec ``secrets`` et non ``random`` : c'est
    la preuve de livraison, donc il ne doit pas être devinable.
    """
    tirage = "".join(secrets.choice(_ALPHABET_CODE) for _ in range(6))
    return f"{tirage[:3]}-{tirage[3:]}"


# ── Le KYC des groupeurs ────────────────────────────────────────────────────

#: Plafond de collecte par campagne, selon le niveau de vérification (§10.5).
#:
#: ``None`` pour le niveau Établi : il se décide au cas par cas, et inventer
#: une valeur serait pire que de ne pas en donner.
PLAFONDS_KYC: dict[str, Decimal | None] = {
    "entree": Decimal("150000"),
    "confirme": Decimal("600000"),
    "etabli": None,
}


def normaliser_nom(nom: str) -> str:
    """Prépare un nom pour la comparaison du contrôle KYC n° 2."""
    import unicodedata

    sans_accents = "".join(
        caractere
        for caractere in unicodedata.normalize("NFD", nom or "")
        if unicodedata.category(caractere) != "Mn"
    )
    mots = [mot for mot in sans_accents.lower().replace("-", " ").split() if len(mot) > 1]
    return " ".join(sorted(mots))


class NumeroInvalide(ValueError):
    """Un numéro qui n'est pas un numéro togolais à huit chiffres."""


def normaliser_telephone(numero: str) -> str:
    """Ramène un numéro à **une seule forme** : ``+228XXXXXXXX``.

    ## Pourquoi c'est important, et pas cosmétique

    Le même numéro arrivait sous deux formes selon la porte d'entrée : le
    formulaire d'inscription du groupeur envoyait ``+22890777888``, la feuille
    de connexion de l'acheteur ``90777888``. Comme le téléphone **est**
    l'identifiant de compte dans ce MVP — il n'y a ni mot de passe ni session —
    les deux formes créaient **deux comptes pour la même personne**.

    Les conséquences se voyaient à l'usage, et chacune ressemblait à autre
    chose qu'à un problème de format :

    - un acheteur qui se reconnecte avec l'autre forme ne retrouve plus ses
      commandes, et conclut qu'elles ont disparu ;
    - un groupeur ne retrouve plus l'état de son dossier KYC, et redépose —
      ce qui échoue, puisque ``telephone`` est unique ;
    - la contrainte d'unicité ne protège plus de rien, puisqu'elle porte sur
      la chaîne et non sur le numéro.

    ## Ce qui est accepté

    ``90 12 34 56``, ``+228 90 12 34 56``, ``00228-90123456``, ``90123456`` :
    tous donnent ``+22890123456``. On est tolérant à l'entrée et strict en
    base, ce qui est le bon sens dans les deux cas — personne ne doit se
    demander comment écrire son numéro, et le code ne doit jamais avoir à
    deviner laquelle des cinq formes il a sous la main.

    Lève ``NumeroInvalide`` si, une fois nettoyé, il ne reste pas huit
    chiffres. **On ne complète pas, on ne tronque pas** : un numéro à sept
    chiffres est une faute de frappe, et l'accepter en l'état ferait échouer
    l'appel du livreur le jour de la livraison.
    """
    chiffres = "".join(c for c in numero if c.isdigit())

    # L'indicatif, sous ses deux écritures courantes.
    if chiffres.startswith("00228"):
        chiffres = chiffres[5:]
    elif chiffres.startswith("228") and len(chiffres) > 8:
        chiffres = chiffres[3:]

    if len(chiffres) != 8:
        raise NumeroInvalide(
            "Un numéro togolais compte huit chiffres, par exemple 90 12 34 56."
        )

    return f"+228{chiffres}"


def noms_concordent(piece_identite: str, mobile_money: str) -> bool:
    """Contrôle KYC n° 2 — §10.5 du cahier des charges.

    ⚠️ **Si le nom du compte Mobile Money ne correspond pas à la pièce
    d'identité, la procédure s'arrête.** Il n'y a pas de bonne raison de
    recevoir l'argent des acheteurs sur le compte de quelqu'un d'autre. C'est
    le contrôle le plus rentable du dispositif : gratuit, immédiat, et c'est
    sur ce compte que partira l'argent.

    La comparaison est **tolérante sur la forme** — accents, casse, ordre des
    mots, tirets — et stricte sur le fond. Refuser un dossier parce que
    quelqu'un a écrit « MENSAH Akossiwa » au lieu de « Akossiwa Mensah » serait
    une perte de temps pour tout le monde, et ne protégerait de rien.
    """
    a = normaliser_nom(piece_identite)
    b = normaliser_nom(mobile_money)
    return a != "" and a == b
