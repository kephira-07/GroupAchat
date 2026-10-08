# -*- coding: utf-8 -*-
"""Les commandes et les paiements.

**Trois champs à ne pas perdre de vue**, signalés par le §6 du PRD et tous les
trois présents ici :

- ``frais_livraison`` est **séparé** de ``montant_parts``. La part est la même
  pour tous, les frais dépendent de la position ; les fondre interdirait à
  l'acheteur de vérifier qu'on ne lui a rien glissé dans le total ;
- ``quartier`` et ``repere`` conservent la **position** sur la commande, parce
  que c'est elle qui a déterminé les frais et que le livreur en aura besoin ;
- ``cle_idempotence`` protège le paiement. Sans elle, un acheteur qui touche
  deux fois « Confirmer » sur un réseau lent paie deux fois.
"""

from __future__ import annotations

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.db import models, transaction

from .. import domaine


class Commande(models.Model):
    """Une part achetée dans une campagne."""

    class Statut(models.TextChoices):
        PAYEE = "payee", "Payée — en attente de clôture"
        CLOTUREE = "cloturee", "Groupage clôturé"
        CHEZ_LE_GROUPEUR = "chez-le-groupeur", "Commande en cours chez le groupeur"
        EN_LIVRAISON = "en-livraison", "En cours de livraison"
        LIVREE = "livree", "Livrée"
        LITIGE = "litige", "Litige"
        REMBOURSEE = "remboursee", "Remboursée"
        ANNULEE = "annulee", "Groupage annulé"

    #: Les statuts où l'acheteur a payé. Doit rester identique à
    #: ``catalogue.models.Statut_PAYANTS`` — un test le vérifie.
    STATUTS_PAYANTS = (
        Statut.PAYEE,
        Statut.CLOTUREE,
        Statut.CHEZ_LE_GROUPEUR,
        Statut.EN_LIVRAISON,
        Statut.LIVREE,
    )

    campagne = models.ForeignKey(
        "catalogue.Campagne",
        on_delete=models.PROTECT,
        related_name="commandes",
        verbose_name="campagne",
    )
    acheteur = models.ForeignKey(
        "comptes.Acheteur",
        on_delete=models.PROTECT,
        related_name="commandes",
        verbose_name="acheteur",
    )

    quantite = models.PositiveIntegerField(
        "quantité", default=1, validators=[MinValueValidator(1)]
    )
    variante = models.CharField("variante", max_length=60, blank=True)

    montant_parts = models.DecimalField(
        "montant des parts", max_digits=12, decimal_places=0
    )
    frais_livraison = models.DecimalField(
        "frais de livraison", max_digits=12, decimal_places=0
    )
    total = models.DecimalField("total payé", max_digits=12, decimal_places=0)

    #: La position, conservée sur la commande.
    #:
    #: ⚠️ Elle **ne remonte jamais au groupeur** (§1.7) : lui ne voit que le
    #: quartier. Le repère et le téléphone ne sortent qu'une fois, vers le
    #: livreur, le jour de la tournée.
    quartier = models.CharField("quartier", max_length=40)
    repere = models.CharField("repère", max_length=200)
    telephone = models.CharField("téléphone à joindre", max_length=20)

    code_livraison = models.CharField(
        "code de livraison", max_length=10, unique=True, db_index=True
    )

    #: Générée par le client **avant** l'appel de paiement : c'est tout son
    #: intérêt. Deux appuis sur « Confirmer » portent la même clé, et le
    #: serveur n'encaisse qu'une fois.
    cle_idempotence = models.CharField(
        "clé d'idempotence", max_length=80, unique=True, db_index=True
    )

    statut = models.CharField(
        "statut", max_length=20, choices=Statut.choices, default=Statut.PAYEE
    )
    passee_le = models.DateTimeField("passée le", auto_now_add=True)

    class Meta:
        verbose_name = "commande"
        verbose_name_plural = "commandes"
        ordering = ("-passee_le",)
        indexes = [models.Index(fields=["campagne", "statut"])]

    def __str__(self) -> str:
        return f"{self.code_livraison} — {self.campagne.titre}"

    def clean(self) -> None:
        """Vérifie que le total n'a pas été fabriqué par le client.

        Les montants arrivent du client pour qu'il puisse afficher un
        récapitulatif, mais **c'est le serveur qui fait foi** : on recalcule et
        on refuse si ça ne tombe pas juste. Sans ce contrôle, une requête forgée
        pourrait payer 5 000 F une commande à 50 000 F.
        """
        super().clean()

        if self.total != self.montant_parts + self.frais_livraison:
            raise ValidationError(
                "Le total doit être la somme des parts et des frais de livraison."
            )

        if self.campagne_id:
            attendu = domaine.arrondir(self.campagne.prix_part * self.quantite)
            if self.montant_parts != attendu:
                raise ValidationError(
                    "Le montant des parts ne correspond pas au prix de la "
                    "campagne multiplié par la quantité."
                )

        frais = domaine.calculer_frais_livraison(self.quartier)
        if not frais.desservi:
            raise ValidationError(
                f"Nous ne livrons pas encore à {self.quartier}."
            )
        if self.frais_livraison != frais.montant:
            raise ValidationError(
                "Les frais de livraison ne correspondent pas au tarif de la zone."
            )

        if not self.repere.strip():
            # À Lomé le repère vaut plus que la coordonnée : un livreur avec un
            # point sur une carte mais sans repère tourne quand même.
            raise ValidationError({"repere": "Le repère est obligatoire."})


@transaction.atomic
def enregistrer_paiement(
    *,
    campagne,
    acheteur,
    quantite: int,
    quartier: str,
    repere: str,
    telephone: str,
    cle_idempotence: str,
    variante: str = "",
) -> tuple[Commande, bool]:
    """Encaisse une commande, une seule fois par clé d'idempotence.

    Renvoie ``(commande, creee)``. Si la clé a déjà servi, la commande
    existante est renvoyée avec ``creee=False`` et **rien n'est débité une
    seconde fois** — c'est exactement le cas d'un acheteur qui touche deux fois
    « Confirmer » sur un réseau lent, et c'est le cas le plus fréquent.

    ⚠️ Le paiement lui-même est **simulé** jusqu'à l'agrément d'un agrégateur
    (§18.2 du cahier des charges). Cette fonction enregistre la commande comme
    si l'encaissement avait réussi ; l'appel à l'agrégateur viendra ici, entre
    la vérification de la clé et la création.
    """

    # ⚠️ **Le plafond de collecte, contrôlé ici et nulle part ailleurs**
    # (§10.4).
    #
    # Il ne protège pas de la fraude, il **borne le montant maximal d'un
    # sinistre** — ce qui, pour une jeune structure, est la différence entre un
    # incident et une fermeture. Ce rôle n'a de sens qu'au moment où l'argent
    # entre : le contrôler à la création de la campagne, quand la collecte vaut
    # zéro, revenait à ne rien contrôler.
    #
    # Le message s'adresse à l'acheteur, qui n'a rien fait de mal et n'a pas à
    # comprendre nos règles internes : on lui dit que le groupage est complet,
    # pas que le groupeur a atteint son plafond.
    plafond = campagne.groupeur.plafond
    if plafond is not None:
        apres = campagne.collecte_sur_les_parts + (campagne.prix_part * quantite)
        if apres > plafond:
            raise PlafondAtteint(
                "Ce groupage est complet. Il se clôture bientôt — revenez "
                "voir le prochain."
            )

    existante = Commande.objects.filter(cle_idempotence=cle_idempotence).first()
    if existante is not None:
        return existante, False

    if not campagne.est_ouverte:
        raise ValidationError("Ce groupage n'est plus ouvert.")

    montant_parts, frais, total = domaine.calculer_total_commande(
        campagne.prix_part, quantite, quartier
    )

    commande = Commande(
        campagne=campagne,
        acheteur=acheteur,
        quantite=quantite,
        variante=variante,
        montant_parts=montant_parts,
        frais_livraison=frais,
        total=total,
        quartier=quartier,
        repere=repere,
        telephone=telephone,
        cle_idempotence=cle_idempotence,
        code_livraison=domaine.generer_code_livraison(),
        statut=Commande.Statut.PAYEE,
    )
    commande.full_clean(validate_unique=False)
    commande.save()
    return commande, True


class PlafondAtteint(Exception):
    """Un paiement qui ferait dépasser le plafond de collecte du groupeur.

    Une exception à part, et non une ``ValidationError`` : ce n'est pas une
    saisie fautive. L'acheteur n'a rien fait de mal, et l'interface doit le
    traiter comme « ce groupage est complet », pas comme « votre formulaire est
    invalide ».
    """


class Versement(models.Model):
    """Le versement d'une campagne à son groupeur, à la clôture.

    **Le groupeur est payé intégralement à la clôture**, pas à la livraison. Il
    n'y a donc pas de solde retenu après livraison, et aucun écran ne doit
    écrire « votre argent est bloqué jusqu'à la livraison » : la formulation
    exacte est « détenu jusqu'à la clôture ».

    ## ⚠️ « Payé à la clôture » et « libéré après le devis » ne se contredisent pas

    Les deux viennent du cahier des charges, et il faut les lire ensemble :

    - le **montant** est arrêté à la clôture. Rien n'est retenu « en attendant
      de voir », rien ne dépend de la livraison. C'est la règle du §7, et c'est
      elle qui interdit la formulation « bloqué jusqu'à la livraison » ;
    - le **décaissement** suit le devis fournisseur. Le §10.3 est explicite :
      « il dépose son devis fournisseur **avant tout versement** ».

    Autrement dit : le groupeur sait **le jour de la clôture** combien il
    touche, et il le touche dès qu'il a montré chez qui il achète. Ce n'est pas
    une retenue de garantie, c'est le contrôle qui se joue **avant** que
    l'argent ne sorte — le seul moment où il protège encore de quelque chose.

    D'où ``etat`` : un versement existe dès la clôture, avec son montant, et il
    passe à ``effectue`` quand un administrateur le libère.
    """

    class Etat(models.TextChoices):
        #: Montant arrêté, en attente du devis fournisseur (§10.3).
        EN_ATTENTE = "en-attente", "En attente du devis"
        EFFECTUE = "effectue", "Effectué"
        #: Le groupage a échoué après la clôture : rien ne part.
        ANNULE = "annule", "Annulé"

    campagne = models.OneToOneField(
        "catalogue.Campagne",
        on_delete=models.PROTECT,
        related_name="versement",
        verbose_name="campagne",
    )
    collecte = models.DecimalField("collecté sur les parts", max_digits=12, decimal_places=0)
    commission = models.DecimalField("commission", max_digits=12, decimal_places=0)
    verse = models.DecimalField("versé au groupeur", max_digits=12, decimal_places=0)
    #: Collectés auprès des acheteurs, reversés au transporteur.
    #: ⚠️ **Hors commission** : ce n'est pas l'argent du groupeur.
    frais_livraison_collectes = models.DecimalField(
        "frais de livraison collectés", max_digits=12, decimal_places=0
    )
    etat = models.CharField(
        "état", max_length=20, choices=Etat.choices, default=Etat.EN_ATTENTE
    )

    #: Quand l'argent est réellement parti. ``None`` tant qu'il n'est pas libéré.
    libere_le = models.DateTimeField("libéré le", null=True, blank=True)
    #: Qui l'a libéré. ⚠️ Un nom en clair faute d'authentification côté
    #: administration — voir ``api_kyc.JetonAdmin``. Le jour où les comptes
    #: existent, ce champ devient une clé étrangère.
    libere_par = models.CharField("libéré par", max_length=120, blank=True)

    effectue_le = models.DateTimeField("calculé le", auto_now_add=True)

    class Meta:
        verbose_name = "versement"
        verbose_name_plural = "versements"
        ordering = ("-effectue_le",)

    def __str__(self) -> str:
        return f"{self.campagne.titre} — {self.verse} F"

    @property
    def devis(self):
        """Le devis fournisseur déposé pour cette campagne, s'il y en a un.

        C'est lui que l'administrateur regarde avant de libérer : chez qui le
        groupeur achète, et pour combien.
        """
        return self.campagne.justificatifs.filter(
            nature=Justificatif.Nature.DEVIS
        ).first()

    @property
    def liberable(self) -> bool:
        """Peut-on faire partir l'argent ?

        ⚠️ **Non sans devis.** C'est le seul contrôle qui s'exerce encore à ce
        stade : une fois l'argent parti, il n'y a plus de levier sur le
        groupeur. Le §10.3 construit tout le dispositif autour de ce moment.
        """
        return self.etat == self.Etat.EN_ATTENTE and self.devis is not None


@transaction.atomic
def cloturer_campagne(campagne) -> Versement:
    """Clôture une campagne et calcule le versement du groupeur.

    La commission porte sur les parts seules ; les frais de livraison sont
    comptés à part et ne sont **jamais** amputés de 5 %.
    """
    collecte = campagne.collecte_sur_les_parts
    resultat = domaine.calculer_versement(collecte)

    frais_collectes = campagne.commandes.filter(
        statut__in=Commande.STATUTS_PAYANTS
    ).aggregate(total=models.Sum("frais_livraison"))["total"] or Decimal("0")

    campagne.statut = campagne.Statut.EN_COURS
    campagne.save(update_fields=["statut"])
    campagne.commandes.filter(statut=Commande.Statut.PAYEE).update(
        statut=Commande.Statut.CLOTUREE
    )

    return Versement.objects.create(
        campagne=campagne,
        collecte=resultat.collecte,
        commission=resultat.commission,
        verse=resultat.verse,
        frais_livraison_collectes=domaine.arrondir(frais_collectes),
    )


class Justificatif(models.Model):
    """Le devis fournisseur, puis le reçu de paiement — §10.3.

    Deux pièces, deux moments, et elles ne jouent pas le même rôle :

    | | Quand | Ce qu'elle sert à faire |
    |---|---|---|
    | **Devis** | Après la clôture, avant le versement | Savoir **chez qui** il achète, et pour combien. C'est ce qui débloque l'argent |
    | **Reçu** | Après l'achat | Vérifier qu'il a bien acheté. Son absence entraîne l'annulation de la campagne |

    ⚠️ **Aucun fichier n'est stocké ici**, pour la même raison que les pièces
    d'identité : ``reference`` est une clé dans un stockage à accès restreint,
    qui reste à monter au déploiement. Ce qui est en base, c'est le
    **fournisseur et le montant** — c'est-à-dire ce que l'administrateur lit
    pour décider, et ce qu'on peut recouper plus tard avec le relevé bancaire.
    """

    class Nature(models.TextChoices):
        DEVIS = "devis", "Devis fournisseur"
        RECU = "recu", "Reçu de paiement"

    class Etat(models.TextChoices):
        EN_ATTENTE = "en-attente", "À contrôler"
        VALIDE = "valide", "Validé"
        REFUSE = "refuse", "Refusé"

    campagne = models.ForeignKey(
        "catalogue.Campagne",
        on_delete=models.CASCADE,
        related_name="justificatifs",
        verbose_name="campagne",
    )
    nature = models.CharField("nature", max_length=10, choices=Nature.choices)

    fournisseur = models.CharField("fournisseur", max_length=160)
    montant = models.DecimalField("montant", max_digits=12, decimal_places=0)

    #: La clé dans le stockage à accès restreint. Jamais une URL publique.
    reference = models.CharField("référence de stockage", max_length=200, blank=True)

    etat = models.CharField(
        "état", max_length=20, choices=Etat.choices, default=Etat.EN_ATTENTE
    )
    motif_refus = models.CharField("motif du refus", max_length=240, blank=True)

    depose_le = models.DateTimeField("déposé le", auto_now_add=True)

    class Meta:
        verbose_name = "justificatif"
        verbose_name_plural = "justificatifs"
        ordering = ("-depose_le",)
        constraints = [
            # Un devis et un reçu par campagne. En redéposer un remplace le
            # précédent : sinon l'administrateur examine une pile et ne sait
            # plus lequel fait foi.
            models.UniqueConstraint(
                fields=["campagne", "nature"], name="un_justificatif_par_nature"
            )
        ]

    def __str__(self) -> str:
        return f"{self.get_nature_display()} — {self.campagne.titre}"


@transaction.atomic
def liberer_le_versement(versement: Versement, par: str) -> Versement:
    """Fait partir l'argent vers le groupeur.

    ⚠️ **Refuse sans devis.** C'est le dernier moment où un contrôle sert
    encore à quelque chose : après, il n'y a plus de levier. Le §10.3 construit
    tout le dispositif autour de ce point.
    """
    if versement.etat != Versement.Etat.EN_ATTENTE:
        raise ValidationError("Ce versement a déjà été traité.")
    if versement.devis is None:
        raise ValidationError(
            "Aucun devis fournisseur n'a été déposé pour cette campagne : "
            "l'argent ne peut pas être libéré."
        )

    versement.etat = Versement.Etat.EFFECTUE
    versement.libere_le = timezone.now()
    versement.libere_par = par
    versement.save(update_fields=["etat", "libere_le", "libere_par"])

    # ⚠️ **Aucun virement réel n'est émis.** Le paiement est simulé jusqu'à
    # l'agrément d'un agrégateur (§18.2) : cette ligne note que l'argent *doit*
    # partir, elle ne le fait pas partir. C'est ici que l'appel au prestataire
    # viendra.
    return versement


@transaction.atomic
def annuler_campagne(campagne) -> None:
    """Annule une campagne et rembourse les acheteurs.

    **Aucune commission n'est prélevée sur une campagne annulée** (§7 du cahier
    des charges) : la fonction ne crée donc aucun ``Versement``, et c'est
    volontaire — pas de ligne à zéro à expliquer plus tard.
    """
    campagne.statut = campagne.Statut.ANNULEE
    campagne.save(update_fields=["statut"])
    campagne.commandes.filter(statut__in=Commande.STATUTS_PAYANTS).update(
        statut=Commande.Statut.REMBOURSEE
    )

    # Si la campagne avait déjà été clôturée, son versement est annulé avec
    # elle — mais **seulement s'il n'est pas déjà parti**. De l'argent versé ne
    # se reprend pas d'un `update` : ce serait un remboursement à réclamer, et
    # il doit se voir dans le journal plutôt que de disparaître.
    Versement.objects.filter(
        campagne=campagne, etat=Versement.Etat.EN_ATTENTE
    ).update(etat=Versement.Etat.ANNULE)
