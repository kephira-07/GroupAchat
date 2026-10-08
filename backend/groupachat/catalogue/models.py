# -*- coding: utf-8 -*-
"""Les campagnes — ce que l'acheteur appelle « un groupage ».

Le mot diffère volontairement entre le code et l'écran : « campagne » est le
terme interne, « groupage » est celui que l'utilisateur emploie déjà. Les
sérialiseurs ne traduisent pas, c'est l'interface qui écrit le mot visible.
"""

from __future__ import annotations

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from .. import domaine


class Campagne(models.Model):
    """Une campagne de groupage.

    ⚠️ **Il n'y a ni plafond de participants ni minimum**, et c'est une
    décision de produit, pas un oubli. Le modèle n'a donc aucun champ
    ``objectif`` ou ``places`` — s'il en avait un, une jauge finirait par
    apparaître dans l'interface, et le §2.5 l'interdit faute de dénominateur
    réel.

    ⚠️ **Aucun champ « prix de détail ».** Il n'y a aucun prix barré dans
    l'application (§3), et le meilleur moyen de ne pas en afficher un est de ne
    pas le stocker.
    """

    class Statut(models.TextChoices):
        OUVERTE = "ouverte", "Ouverte"
        A_DECIDER = "a-decider", "À décider"
        EN_COURS = "en-cours", "Commande en cours"
        LIVREE = "livree", "Livrée"
        ANNULEE = "annulee", "Annulée"

    class Categorie(models.TextChoices):
        ALIMENTAIRE = "alimentaire", "Alimentaire"
        VETEMENTS = "vetements", "Vêtements"
        CHAUSSURES = "chaussures", "Chaussures"
        HYGIENE = "hygiene", "Hygiène"
        MAISON = "maison", "Maison"
        ELECTRONIQUE = "electronique", "Électronique"

    groupeur = models.ForeignKey(
        "comptes.Groupeur",
        on_delete=models.PROTECT,
        related_name="campagnes",
        verbose_name="groupeur",
    )

    titre = models.CharField("titre", max_length=160)
    description = models.TextField("description")
    contenu_part = models.CharField("ce que contient une part", max_length=240)
    categorie = models.CharField(
        "catégorie", max_length=20, choices=Categorie.choices
    )

    prix_part = models.DecimalField(
        "prix d'une part",
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(Decimal("1"))],
    )

    media = models.URLField("média", blank=True)
    media_alt = models.CharField("description du média", max_length=200, blank=True)

    # ── Ce que l'ecran 3 affiche, et que le modele ne portait pas ──────────
    #
    # Ces quatre champs existaient depuis le debut dans les constantes du
    # front, mais pas en base : l'ecran produit etait donc impossible a servir
    # par l'API. Les ajouter est ce qui permet au catalogue de quitter le
    # TypeScript.

    #: Le tableau de caracteristiques de l'ecran 3 : `[{"cle": …, "valeur": …}]`.
    #:
    #: Du JSON plutot qu'une table liee, et c'est un choix : ces lignes ne sont
    #: **jamais interrogees ni filtrees**, seulement affichees avec leur
    #: campagne. Une table imposerait une jointure et une page
    #: d'administration de plus pour un gain nul.
    caracteristiques = models.JSONField(
        "caractéristiques", default=list, blank=True
    )

    #: La variante **obligatoire avant de commander** — « Taille » pour C2.
    #:
    #: Vide quand il n'y en a pas, ce qui est le cas de la plupart des
    #: groupages. L'ecran 5 ne montre le selecteur que si `variante_libelle`
    #: est rempli.
    variante_libelle = models.CharField(
        "libellé de la variante", max_length=60, blank=True
    )
    variante_options = models.JSONField(
        "options de la variante", default=list, blank=True
    )

    #: Le point de remise. **Un repere public, jamais une adresse d'acheteur.**
    #:
    #: ⚠️ `blank=True` en base, **obligatoire a l'ecran**. Les deux ne disent
    #: pas la meme chose et la difference est voulue : une campagne creee par
    #: l'ecran 14 porte toujours un point de remise — le formulaire l'exige —
    #: mais le modele doit pouvoir representer les lignes qui existaient avant
    #: ces champs, et celles qu'un script d'import cree en deux temps.
    #:
    #: Le refuser en base aurait oblige a inventer une valeur de repli du genre
    #: « a preciser », qui aurait fini affichee a un acheteur.
    quartier_remise = models.CharField(
        "quartier de remise", max_length=40, blank=True
    )
    point_remise = models.CharField("point de remise", max_length=200, blank=True)
    remise_le = models.DateField("remise prévue le", null=True, blank=True)

    date_fin = models.DateTimeField("date de clôture")
    statut = models.CharField(
        "statut", max_length=20, choices=Statut.choices, default=Statut.OUVERTE
    )

    cree_le = models.DateTimeField("créée le", auto_now_add=True)

    class Meta:
        verbose_name = "campagne"
        verbose_name_plural = "campagnes"
        ordering = ("date_fin",)
        indexes = [models.Index(fields=["statut", "date_fin"])]

    def __str__(self) -> str:
        return self.titre

    # ── Ce que l'interface affiche ──────────────────────────────────────────

    @property
    def acheteurs_confirmes(self) -> int:
        """Le nombre d'acheteurs ayant payé.

        « Acheteurs confirmés », jamais « participants » ni « commandes » :
        « confirmés » dit que ces gens ont payé, c'est rassurant, et c'est vrai.
        """
        return self.commandes.filter(statut__in=Statut_PAYANTS).count()

    @property
    def collecte_sur_les_parts(self) -> Decimal:
        """La collecte **hors frais de livraison**.

        C'est l'assiette de la commission, et c'est pour ça qu'elle exclut les
        frais : ceux-ci vont au transporteur et ne passent pas par le groupeur.
        """
        total = self.commandes.filter(statut__in=Statut_PAYANTS).aggregate(
            total=models.Sum("montant_parts")
        )["total"]
        return domaine.arrondir(total or Decimal("0"))

    @property
    def heures_restantes(self) -> int:
        """Le temps restant, en heures, jamais négatif.

        **C'est le seul élément de pression de l'application** (§2.4) : il n'y
        a ni minimum ni places limitées, donc c'est lui qui crée l'urgence.
        """
        delta = self.date_fin - timezone.now()
        return max(0, int(delta.total_seconds() // 3600))

    @property
    def nombre_de_questions(self) -> int:
        """Les questions **publiees**, celles que tout le monde voit.

        ⚠️ Pas `questions.count()` : les questions en verification ne sont
        visibles que de leur auteur (§1.5, ecran 10), et une en attente de
        moderation ne doit pas gonfler le compteur public — surtout si elle
        finit refusee.
        """
        return self.questions.filter(etat="publiee").count()

    @property
    def est_ouverte(self) -> bool:
        return self.statut == self.Statut.OUVERTE and self.heures_restantes > 0

    def clean(self) -> None:
        super().clean()
        if self.groupeur_id and not self.groupeur.peut_lancer_une_campagne:
            raise ValidationError(
                "Ce groupeur n'a pas de dossier KYC validé : il ne peut pas "
                "lancer de campagne."
            )

    # ⚠️ **Le plafond de collecte n'est plus contrôlé ici**, et c'est une
    # correction, pas un relâchement.
    #
    # Il l'était, et ça produisait deux défauts opposés :
    #
    # - **il ne bornait rien.** À la création, la collecte vaut zéro : le
    #   contrôle passait toujours. Or le §10.4 lui donne un rôle précis —
    #   « borner le montant maximal d'un sinistre » — qui ne vaut qu'au moment
    #   où l'argent entre ;
    # - **il rendait la campagne immodifiable** dès qu'elle dépassait le
    #   plafond. `clean` s'exécute à chaque `save`, donc clôturer une campagne
    #   qui avait bien marché échouait avec « dépasserait le plafond » — un
    #   message qui n'a aucun sens au moment de clôturer. C'est le même piège
    #   que le contrôle n° 2 sur le groupeur (voir `Groupeur.save`) : une règle
    #   de saisie appliquée à toute écriture.
    #
    # Le contrôle vit désormais dans `enregistrer_paiement`, là où il borne
    # réellement l'exposition : **un paiement qui ferait dépasser le plafond
    # est refusé.**

    def collecte_prevue(self) -> Decimal:
        """La collecte déjà réalisée. Lue par le contrôle de plafond (§10.4)."""
        return self.collecte_sur_les_parts if self.pk else Decimal("0")

    def save(self, *args, **kwargs):
        """⚠️ **``full_clean`` est appelé ici, et il ne doit pas en partir.**

        Django **n'appelle pas** ``clean`` depuis ``save`` : seuls les
        formulaires et les sérialiseurs le font. Sans cette ligne, les deux
        contrôles de ``clean`` ne s'appliquent qu'aux chemins qui passent par
        un formulaire, et ``Campagne.objects.create(...)`` les traverse sans
        rien déclencher — c'est-à-dire que :

        - un groupeur **dont le dossier KYC n'est pas validé** peut lancer un
          groupage, ce qui vide de son sens la phrase « groupeurs sélectionnés
          par Group Achat » affichée à l'acheteur sur presque chaque écran ;
        - son **plafond de collecte** (§10.4) ne borne plus rien, alors que son
          seul rôle est de limiter le montant maximal d'un sinistre.

        Les deux règles vivent sur le modèle plutôt que dans une vue pour cette
        raison exacte : un bouton grisé dans l'interface ne protège de rien, il
        suffit d'une requête directe pour le contourner. ``Groupeur.save``
        porte la même ligne, pour le contrôle n° 2 du §10.5.

        ``validate_unique=False`` laisse la contrainte d'unicité à la base, qui
        la vérifie de toute façon et sans requête supplémentaire.
        """
        self.full_clean(exclude=None, validate_unique=False)
        return super().save(*args, **kwargs)


#: Les statuts de commande qui comptent comme « l'acheteur a payé ».
#:
#: Défini ici plutôt qu'importé depuis ``commandes`` pour éviter un import
#: circulaire ; le test ``test_statuts_payants_restent_synchronises`` garantit
#: que les deux listes ne divergent pas.
Statut_PAYANTS = (
    "payee",
    "cloturee",
    "chez-le-groupeur",
    "en-livraison",
    "livree",
)
