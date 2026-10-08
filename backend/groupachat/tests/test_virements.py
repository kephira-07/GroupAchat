# -*- coding: utf-8 -*-
"""Le devis, le virement, et ce qui les sépare — §10.3.

**C'est le dernier moment où un contrôle sert encore à quelque chose.** Une
fois l'argent parti chez le groupeur, il n'y a plus aucun levier sur lui : ni
caution — le §10.6 l'a écartée — ni solde retenu, puisqu'il est payé
intégralement à la clôture. Tout le dispositif de sécurité se joue donc *avant*
le décaissement, et c'est ce que ces tests protègent.

⚠️ **Deux règles qui ont l'air de se contredire, et qui ne se contredisent
pas :**

- le §7 : « le groupeur est payé intégralement à la clôture » — le **montant**
  est arrêté ce jour-là, rien ne dépend de la livraison ;
- le §10.3 : « il dépose son devis fournisseur **avant tout versement** » — le
  **décaissement** suit le devis.

Il sait dès la clôture combien il touche, et il le touche dès qu'il a montré
chez qui il achète.
"""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from groupachat.catalogue.models import Campagne
from groupachat.commandes.models import (
    Justificatif,
    PlafondAtteint,
    Versement,
    cloturer_campagne,
    enregistrer_paiement,
)
from groupachat.comptes.models import Acheteur, Groupeur

#: Le jeton d'administration employé par ces tests.
#:
#: ⚠️ Posé par ``override_settings``, **et non dans ``os.environ``** : la
#: permission le lit dans ``settings.JETON_ADMIN``, qui est résolu une seule
#: fois au chargement des réglages. Écrire dans l'environnement après ce
#: moment-là n'a aucun effet — et le symptôme est un 403 incompréhensible,
#: avec une variable qui porte pourtant la bonne valeur.
JETON = "jeton-de-test"


@override_settings(JETON_ADMIN=JETON)
class SocleArgent(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()

        self.groupeur = Groupeur.objects.create(
            pseudonyme="Mama Gro",
            nom_complet="Akossiwa Mensah",
            telephone="+22891000001",
            statut_kyc=Groupeur.StatutKyc.VALIDE,
            titulaire_mobile_money="Akossiwa Mensah",
            numero_mobile_money="+22891000001",
        )
        self.campagne = Campagne.objects.create(
            groupeur=self.groupeur,
            titre="Écouteurs filaires avec micro",
            description="Un lot de cent.",
            contenu_part="Une paire",
            categorie=Campagne.Categorie.ELECTRONIQUE,
            prix_part=Decimal("4000"),
            date_fin=timezone.now() + timedelta(days=2),
        )
        # Le fil rouge du §3 : 32 commandes à 4 000 F.
        for numero in range(32):
            acheteur = Acheteur.objects.create(telephone=f"+2289010{numero:04d}")
            enregistrer_paiement(
                campagne=self.campagne,
                acheteur=acheteur,
                quantite=1,
                quartier="Tokoin",
                repere="Pharmacie Sodji",
                telephone=acheteur.telephone,
                cle_idempotence=f"fil-rouge-{numero}",
            )

    def entete(self) -> dict:
        return {"HTTP_X_JETON_ADMIN": JETON}

    def numero(self) -> dict:
        return {"telephone": "+22891000001"}


class LeMontantEstArreteALaCloture(SocleArgent):
    def test_les_chiffres_du_fil_rouge_tombent_juste(self) -> None:
        """128 000 collectés, 6 400 de commission, 121 600 à verser.

        **Un jury vérifie ces chiffres d'un écran à l'autre.**
        """
        versement = cloturer_campagne(self.campagne)

        self.assertEqual(versement.collecte, Decimal("128000"))
        self.assertEqual(versement.commission, Decimal("6400"))
        self.assertEqual(versement.verse, Decimal("121600"))
        # 32 × 1 000 F de livraison, **hors commission** : ils vont au
        # transporteur, pas au groupeur.
        self.assertEqual(versement.frais_livraison_collectes, Decimal("32000"))

    def test_le_versement_existe_des_la_cloture_mais_n_est_pas_parti(self) -> None:
        """La nuance qui porte tout le §10.3.

        Le groupeur **sait** ce qu'il touche. L'argent, lui, attend le devis.
        """
        versement = cloturer_campagne(self.campagne)
        self.assertEqual(versement.etat, Versement.Etat.EN_ATTENTE)
        self.assertIsNone(versement.libere_le)
        self.assertFalse(versement.liberable)


class LeDevisDebloqueLArgent(SocleArgent):
    def test_sans_devis_on_ne_libere_rien(self) -> None:
        """⚠️ **Le test le plus important de ce fichier.**

        C'est le dernier contrôle avant que l'argent ne sorte. Après, il n'y a
        plus de levier.
        """
        versement = cloturer_campagne(self.campagne)
        reponse = self.client.post(
            f"/api/administration/{versement.pk}/liberer/",
            {"decide_par": "Kephira"},
            format="json",
            **self.entete(),
        )
        self.assertEqual(reponse.status_code, 400)

        versement.refresh_from_db()
        self.assertEqual(versement.etat, Versement.Etat.EN_ATTENTE)

    def test_le_depot_du_devis_est_la_demande_de_virement(self) -> None:
        cloturer_campagne(self.campagne)
        reponse = self.client.post(
            f"/api/espace-groupeur/{self.campagne.pk}/justificatif/",
            {
                **self.numero(),
                "nature": "devis",
                "fournisseur": "Importateur Lomé Électronique",
                "montant": "95000",
            },
            format="json",
        )
        self.assertEqual(reponse.status_code, 201, reponse.data)

        versement = Versement.objects.get(campagne=self.campagne)
        self.assertTrue(versement.liberable)
        self.assertEqual(
            versement.devis.fournisseur, "Importateur Lomé Électronique"
        )

    def test_avec_le_devis_l_argent_part_et_c_est_trace(self) -> None:
        """⚠️ **Toute action sur l'argent est tracée et motivée** (§18.3).

        Qui, quand, sur quelle campagne. C'est la contrepartie du fait qu'un
        jeton partagé ne distingue pas deux administrateurs : si on ne sait pas
        *qui* au sens fort, on sait au moins ce qui a été fait et sous quel nom.
        """
        cloturer_campagne(self.campagne)
        self.client.post(
            f"/api/espace-groupeur/{self.campagne.pk}/justificatif/",
            {
                **self.numero(),
                "nature": "devis",
                "fournisseur": "Importateur Lomé Électronique",
                "montant": "95000",
            },
            format="json",
        )

        versement = Versement.objects.get(campagne=self.campagne)
        reponse = self.client.post(
            f"/api/administration/{versement.pk}/liberer/",
            {"decide_par": "Kephira"},
            format="json",
            **self.entete(),
        )
        self.assertEqual(reponse.status_code, 200, reponse.data)

        versement.refresh_from_db()
        self.assertEqual(versement.etat, Versement.Etat.EFFECTUE)
        self.assertEqual(versement.libere_par, "Kephira")
        self.assertIsNotNone(versement.libere_le)

    def test_on_ne_libere_pas_deux_fois(self) -> None:
        """Un double appui ne doit pas envoyer l'argent deux fois."""
        cloturer_campagne(self.campagne)
        self.client.post(
            f"/api/espace-groupeur/{self.campagne.pk}/justificatif/",
            {**self.numero(), "nature": "devis", "fournisseur": "X", "montant": "1"},
            format="json",
        )
        versement = Versement.objects.get(campagne=self.campagne)

        premiere = self.client.post(
            f"/api/administration/{versement.pk}/liberer/",
            {"decide_par": "Kephira"},
            format="json",
            **self.entete(),
        )
        seconde = self.client.post(
            f"/api/administration/{versement.pk}/liberer/",
            {"decide_par": "Kephira"},
            format="json",
            **self.entete(),
        )
        self.assertEqual(premiere.status_code, 200)
        self.assertEqual(seconde.status_code, 400)

    def test_redeposer_un_devis_remplace_le_precedent(self) -> None:
        """Sinon l'administrateur examine une pile et ne sait plus lequel vaut."""
        cloturer_campagne(self.campagne)
        for fournisseur in ("Premier", "Second"):
            self.client.post(
                f"/api/espace-groupeur/{self.campagne.pk}/justificatif/",
                {
                    **self.numero(),
                    "nature": "devis",
                    "fournisseur": fournisseur,
                    "montant": "1000",
                },
                format="json",
            )

        devis = Justificatif.objects.filter(
            campagne=self.campagne, nature=Justificatif.Nature.DEVIS
        )
        self.assertEqual(devis.count(), 1)
        self.assertEqual(devis.get().fournisseur, "Second")

    def test_le_devis_d_un_autre_groupeur_est_refuse(self) -> None:
        autre = Groupeur.objects.create(
            pseudonyme="Chez Sika",
            nom_complet="Sika Adjo",
            telephone="+22891000002",
            statut_kyc=Groupeur.StatutKyc.VALIDE,
            titulaire_mobile_money="Sika Adjo",
            numero_mobile_money="+22891000002",
        )
        reponse = self.client.post(
            f"/api/espace-groupeur/{self.campagne.pk}/justificatif/",
            {
                "telephone": autre.telephone,
                "nature": "devis",
                "fournisseur": "X",
                "montant": "1",
            },
            format="json",
        )
        self.assertEqual(reponse.status_code, 404)


class UnGroupageAnnule(SocleArgent):
    def test_aucune_commission_sur_une_campagne_annulee(self) -> None:
        """§7 — et le versement qui attendait est annulé avec elle.

        Un groupage qui n'aboutit pas ne rapporte rien à personne. C'est ce qui
        rend « vous êtes livré, ou remboursé » tenable.
        """
        cloturer_campagne(self.campagne)
        reponse = self.client.post(
            f"/api/espace-groupeur/{self.campagne.pk}/annuler/",
            self.numero(),
            format="json",
        )
        self.assertEqual(reponse.status_code, 200, reponse.data)

        versement = Versement.objects.get(campagne=self.campagne)
        self.assertEqual(versement.etat, Versement.Etat.ANNULE)
        self.assertIsNone(versement.libere_le)

    def test_les_acheteurs_sont_rembourses(self) -> None:
        cloturer_campagne(self.campagne)
        self.client.post(
            f"/api/espace-groupeur/{self.campagne.pk}/annuler/",
            self.numero(),
            format="json",
        )
        self.assertEqual(
            self.campagne.commandes.filter(statut="remboursee").count(), 32
        )


class LeTableauDeBordAdmin(SocleArgent):
    def test_il_est_ferme_sans_jeton(self) -> None:
        """Il porte les montants détenus et les noms des groupeurs."""
        reponse = self.client.get("/api/administration/tableau-de-bord/")
        self.assertEqual(reponse.status_code, 403)

    def test_les_files_mettent_l_argent_en_tete(self) -> None:
        """**Du plus coûteux au moins coûteux.**

        Un dossier KYC qui traîne coûte un groupeur. Un virement qui traîne
        coûte une livraison et la confiance de dizaines d'acheteurs.
        """
        reponse = self.client.get(
            "/api/administration/tableau-de-bord/", **self.entete()
        )
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.data["files"][0]["id"], "versements")
        self.assertTrue(reponse.data["files"][0]["argent_expose"])

    def test_l_argent_detenu_est_le_premier_indicateur(self) -> None:
        """C'est le seul chiffre de l'écran qui engage la structure."""
        reponse = self.client.get(
            "/api/administration/tableau-de-bord/", **self.entete()
        )
        indicateurs = reponse.data["indicateurs"]
        self.assertEqual(indicateurs[0]["id"], "detenu")
        self.assertEqual(indicateurs[0]["valeur"], 128000)

    def test_le_nombre_d_inscrits_n_y_est_pas(self) -> None:
        """C'est la mesure qui flatte et n'engage à rien.

        Ce qui compte est le nombre de groupages allés jusqu'à la livraison.
        """
        reponse = self.client.get(
            "/api/administration/tableau-de-bord/", **self.entete()
        )
        identifiants = [i["id"] for i in reponse.data["indicateurs"]]
        self.assertNotIn("inscrits", identifiants)
        self.assertIn("aboutissement", identifiants)

    def test_la_courbe_couvre_quatorze_jours(self) -> None:
        """Y compris les jours sans vente — sinon la courbe ment sur le rythme."""
        reponse = self.client.get(
            "/api/administration/tableau-de-bord/", **self.entete()
        )
        serie = reponse.data["serie_collecte"]
        self.assertEqual(len(serie), 14)
        self.assertEqual(sum(point["montant"] for point in serie), 128000)

    def test_on_filtre_les_groupages_par_etat(self) -> None:
        """Clôturés, annulés, non aboutis : trois choses différentes."""
        cloturer_campagne(self.campagne)
        reponse = self.client.get(
            "/api/administration/groupages/",
            {"statut": "en-cours"},
            **self.entete(),
        )
        self.assertEqual(len(reponse.data), 1)
        self.assertEqual(reponse.data[0]["versement_etat"], "en-attente")

    def test_la_file_des_versements_part_du_plus_ancien(self) -> None:
        """Un groupeur qui attend ne peut pas acheter ce qu'il a vendu."""
        cloturer_campagne(self.campagne)
        reponse = self.client.get(
            "/api/administration/versements/", **self.entete()
        )
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(len(reponse.data), 1)
        self.assertEqual(reponse.data[0]["groupeur"], "Mama Gro")
        # L'administration voit le vrai nom : on ne vire pas à un pseudonyme.
        self.assertEqual(reponse.data[0]["groupeur_nom"], "Akossiwa Mensah")


class LePlafondDeCollecte(TestCase):
    """§10.4 — il borne le montant maximal d'un sinistre.

    ⚠️ **Il se contrôle au paiement, pas à la création de la campagne.** Il
    l'était, et ça produisait deux défauts opposés : à la création la collecte
    vaut zéro, donc le contrôle passait toujours — et comme `clean` s'exécute
    à chaque écriture, clôturer une campagne qui avait bien marché échouait
    avec « dépasserait le plafond », un message sans aucun sens à ce moment-là.
    """

    def setUp(self) -> None:
        self.groupeur = Groupeur.objects.create(
            pseudonyme="Nouveau",
            nom_complet="Afi Kossi",
            telephone="+22891000009",
            statut_kyc=Groupeur.StatutKyc.VALIDE,
            # Niveau Entrée : 150 000 F par groupage.
            niveau=Groupeur.Niveau.ENTREE,
            titulaire_mobile_money="Afi Kossi",
            numero_mobile_money="+22891000009",
        )
        self.campagne = Campagne.objects.create(
            groupeur=self.groupeur,
            titre="Sacs de riz",
            description="Un lot.",
            contenu_part="Un sac",
            categorie=Campagne.Categorie.ALIMENTAIRE,
            prix_part=Decimal("50000"),
            date_fin=timezone.now() + timedelta(days=3),
        )

    def payer(self, numero: int):
        acheteur = Acheteur.objects.create(telephone=f"+2289020{numero:04d}")
        return enregistrer_paiement(
            campagne=self.campagne,
            acheteur=acheteur,
            quantite=1,
            quartier="Tokoin",
            repere="Pharmacie Sodji",
            telephone=acheteur.telephone,
            cle_idempotence=f"plafond-{numero}",
        )

    def test_le_paiement_qui_ferait_depasser_est_refuse(self) -> None:
        """Trois parts à 50 000 F passent, la quatrième non."""
        for numero in range(3):
            self.payer(numero)
        self.assertEqual(self.campagne.collecte_sur_les_parts, Decimal("150000"))

        with self.assertRaises(PlafondAtteint):
            self.payer(3)

        self.assertEqual(self.campagne.commandes.count(), 3)

    def test_le_message_parle_a_l_acheteur_pas_de_nos_regles(self) -> None:
        """Il n'a rien fait de mal et n'a pas à comprendre nos plafonds.

        « Ce groupage est complet » est vrai de son point de vue ; « le
        groupeur a atteint son plafond de collecte » l'inquiéterait sur le
        groupeur pour une raison qui ne le regarde pas.
        """
        for numero in range(3):
            self.payer(numero)
        with self.assertRaises(PlafondAtteint) as leve:
            self.payer(3)

        message = str(leve.exception)
        self.assertIn("complet", message.lower())
        self.assertNotIn("plafond", message.lower())
        self.assertNotIn("groupeur", message.lower())

    def test_une_campagne_qui_a_bien_marche_reste_cloturable(self) -> None:
        """⚠️ **Le défaut qui a révélé le problème.**

        La campagne a collecté jusqu'à son plafond. Clôturer écrit sur la
        ligne — et échouait, parce que `clean` revérifiait le plafond à chaque
        écriture.
        """
        for numero in range(3):
            self.payer(numero)
        versement = cloturer_campagne(self.campagne)
        self.assertEqual(versement.collecte, Decimal("150000"))

    def test_au_niveau_etabli_il_n_y_a_pas_de_plafond(self) -> None:
        """« Au cas par cas » (§10.4) : `None`, et on n'invente pas un chiffre."""
        self.groupeur.niveau = Groupeur.Niveau.ETABLI
        self.groupeur.save()
        for numero in range(5):
            self.payer(numero)
        self.assertEqual(self.campagne.commandes.count(), 5)
