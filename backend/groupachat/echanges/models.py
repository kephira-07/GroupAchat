# -*- coding: utf-8 -*-
"""Questions publiques et demandes de produit.

**Il n'y a pas de messagerie privée dans ce produit.** Une question est
publique, filtrée avant publication, et son auteur n'apparaît que par un prénom
et une initiale. Le groupeur répond sous son pseudonyme. Ni l'un ni l'autre ne
peut joindre l'autre autrement — et c'est ce canal, justement parce qu'il est le
seul, qui rend l'anonymat supportable des deux côtés.
"""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models

from .. import moderation


class Question(models.Model):
    """Une question publique posée sur une campagne."""

    class Etat(models.TextChoices):
        PUBLIEE = "publiee", "Publiée"
        #: Visible de son seul auteur, en attente du classifieur (écran 10, b).
        EN_VERIFICATION = "en-verification", "En vérification"
        REFUSEE = "refusee", "Refusée"

    campagne = models.ForeignKey(
        "catalogue.Campagne",
        on_delete=models.CASCADE,
        related_name="questions",
        verbose_name="campagne",
    )
    auteur = models.ForeignKey(
        "comptes.Acheteur",
        on_delete=models.CASCADE,
        related_name="questions",
        verbose_name="auteur",
    )
    texte = models.TextField("question")
    etat = models.CharField(
        "état", max_length=20, choices=Etat.choices, default=Etat.PUBLIEE
    )
    posee_le = models.DateTimeField("posée le", auto_now_add=True)

    reponse = models.TextField("réponse", blank=True)
    repondue_le = models.DateTimeField("répondue le", null=True, blank=True)

    class Meta:
        verbose_name = "question"
        verbose_name_plural = "questions"
        ordering = ("-posee_le",)

    def __str__(self) -> str:
        return self.texte[:60]

    @property
    def auteur_affiche(self) -> str:
        """« Akosua D. » — prénom et initiale, jamais un nom complet (§1.7)."""
        morceaux = (self.auteur.nom or "").split()
        if not morceaux:
            return "Acheteur vérifié"
        if len(morceaux) == 1:
            return morceaux[0]
        return f"{morceaux[0]} {morceaux[-1][0]}."

    def clean(self) -> None:
        """Repasse le message au filtre, côté serveur.

        ⚠️ **Le client a déjà fait ce contrôle, et ça ne suffit pas.** Le
        filtre côté React prévient l'utilisateur avant l'envoi ; celui-ci
        protège la base. Un client modifié ou un appel direct à l'API
        contournent le premier, aucun ne contourne le second.
        """
        super().clean()

        verdict = moderation.verifier(self.texte)
        if not verdict.publiable:
            explication = moderation.expliquer(verdict.motif or "", role="acheteur")
            raise ValidationError({"texte": explication["corps"]})

        if self.reponse:
            verdict_reponse = moderation.verifier(self.reponse)
            if not verdict_reponse.publiable:
                explication = moderation.expliquer(
                    verdict_reponse.motif or "", role="groupeur"
                )
                raise ValidationError({"reponse": explication["corps"]})

    def save(self, *args, **kwargs):
        self.full_clean(validate_unique=False)
        return super().save(*args, **kwargs)


class Demande(models.Model):
    """Une demande de produit — la demande crée l'offre.

    Un échec de recherche n'est jamais un cul-de-sac : il mène ici, et le fil
    des demandes du groupeur (écran 19) les lui montre **agrégées**.
    """

    class Statut(models.TextChoices):
        EN_ATTENTE = "en-attente", "En attente"
        PRISE_EN_CHARGE = "prise-en-charge", "Prise en charge"
        CAMPAGNE_LANCEE = "campagne-lancee", "Groupage lancé"
        #: Doit exister et doit être montré : une demande peut ne rien donner,
        #: et l'acheteur doit l'apprendre plutôt que d'attendre indéfiniment.
        NON_ABOUTIE = "non-aboutie", "Non aboutie"

    acheteur = models.ForeignKey(
        "comptes.Acheteur",
        on_delete=models.CASCADE,
        related_name="demandes",
        verbose_name="acheteur",
    )
    produit = models.CharField("produit", max_length=160)
    #: Texte libre et court : « 20 litres », « 2 paires ».
    quantite = models.CharField("quantité", max_length=60)
    quartier = models.CharField("quartier", max_length=40)
    budget_maximum = models.DecimalField(
        "budget maximum", max_digits=12, decimal_places=0, null=True, blank=True
    )
    precisions = models.TextField("précisions", blank=True)

    statut = models.CharField(
        "statut", max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE
    )
    campagne = models.ForeignKey(
        "catalogue.Campagne",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="demandes_satisfaites",
        verbose_name="campagne lancée",
    )
    deposee_le = models.DateTimeField("déposée le", auto_now_add=True)

    class Meta:
        verbose_name = "demande"
        verbose_name_plural = "demandes"
        ordering = ("-deposee_le",)

    def __str__(self) -> str:
        return f"{self.produit} — {self.quartier}"
