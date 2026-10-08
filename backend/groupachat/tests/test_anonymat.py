# -*- coding: utf-8 -*-
"""L'anonymat dans les deux sens — §1.7 de la spec des écrans.

**C'est ce qui protège la commission contre la désintermédiation.** Un groupeur
qui connaît les gros acheteurs et leurs numéros peut leur proposer la même
marchandise hors plateforme, au même prix, sans commission.

Ces tests sont volontairement **méfiants** : ils ne vérifient pas que l'API
renvoie les bons champs, ils vérifient qu'elle ne renvoie **aucun** des champs
interdits — y compris ceux qui n'existent pas encore. Un ``fields = "__all__"``
ajouté par distraction les fait tomber, ce qui est exactement le but.
"""

from __future__ import annotations

import json
from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from groupachat.catalogue.models import Campagne
from groupachat.commandes.models import enregistrer_paiement
from groupachat.comptes.models import Acheteur, Groupeur
from groupachat.tests.aides import connecter


class SocleTest(TestCase):
    """Le jeu de démonstration du §3, monté une fois pour toutes."""

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
            description="Écouteurs intra-auriculaires avec micro.",
            contenu_part="1 écouteur filaire avec micro, garantie 3 mois",
            categorie=Campagne.Categorie.ELECTRONIQUE,
            prix_part=Decimal("4000"),
            date_fin=timezone.now() + timedelta(days=2),
        )

        self.acheteuse = Acheteur.objects.create(
            telephone="+22890123456", nom="Akosua Doe"
        )

        self.commande, _ = enregistrer_paiement(
            campagne=self.campagne,
            acheteur=self.acheteuse,
            quantite=1,
            quartier="Tokoin",
            repere="rue des Cocotiers, près de la pharmacie Sodji",
            telephone="+22890123456",
            cle_idempotence="idem-test-0001",
        )


class CeQueLeGroupeurVoitTest(SocleTest):
    """Le groupeur voit des codes et des quartiers. Rien d'autre."""

    #: Tout ce qui permettrait de reconnaître ou de joindre un acheteur.
    INTERDITS = (
        "Akosua",
        "Doe",
        "90123456",
        "+22890123456",
        "Cocotiers",
        "pharmacie",
        "repere",
        "repère",
        "telephone",
        "téléphone",
        "acheteur",
    )

    def test_la_liste_des_commandes_ne_porte_aucune_identite(self):
        """L'écran 15 doit tenir la promesse faite à l'écran 4."""
        reponse = self.client.get(f"/api/campagnes/{self.campagne.pk}/commandes/")
        self.assertEqual(reponse.status_code, 200)

        brut = json.dumps(reponse.json(), ensure_ascii=False)
        for interdit in self.INTERDITS:
            self.assertNotIn(
                interdit,
                brut,
                f"« {interdit} » ne doit jamais sortir vers le groupeur (§1.7).",
            )

    def test_la_liste_des_commandes_porte_bien_le_code_et_le_quartier(self):
        """L'anonymat n'est tenable que si le groupeur a de quoi travailler."""
        reponse = self.client.get(f"/api/campagnes/{self.campagne.pk}/commandes/")
        ligne = reponse.json()[0]
        self.assertEqual(ligne["code_livraison"], self.commande.code_livraison)
        self.assertEqual(ligne["quartier"], "Tokoin")
        self.assertEqual(ligne["quantite"], 1)

    def test_le_catalogue_ne_revele_pas_le_nom_reel_du_groupeur(self):
        """L'anonymat va dans les deux sens : l'acheteur ne voit qu'un pseudonyme."""
        reponse = self.client.get("/api/campagnes/")
        brut = json.dumps(reponse.json(), ensure_ascii=False)

        self.assertIn("Mama Gro", brut)
        for interdit in ("Akossiwa", "Mensah", "+22891000001", "nom_complet"):
            self.assertNotIn(interdit, brut, interdit)


class CeQueLAcheteurVoitTest(SocleTest):
    """L'acheteur a droit à tout, sur sa propre commande."""

    def test_sa_commande_porte_son_code_et_son_adresse(self):
        connecter(self.client, "+22890123456")
        reponse = self.client.get("/api/commandes/")
        self.assertEqual(reponse.status_code, 200)

        ligne = reponse.json()[0]
        self.assertEqual(ligne["code_livraison"], self.commande.code_livraison)
        self.assertEqual(ligne["repere"], "rue des Cocotiers, près de la pharmacie Sodji")
        self.assertEqual(ligne["groupeur"], "Mama Gro")
        self.assertEqual(Decimal(ligne["total"]), Decimal("5000"))

    def test_sans_session_on_ne_voit_rien(self):
        """Pas de liste de commandes servie à qui ne s'identifie pas.

        **401 et non une liste vide**, et le changement est volontaire :
        auparavant, l'absence de numéro renvoyait `[]`, ce qui est indiscernable
        de « vous n'avez rien commandé ». L'interface ne pouvait pas savoir
        s'il fallait rouvrir la connexion ou afficher un état vide.
        """
        reponse = self.client.get("/api/commandes/")
        self.assertEqual(reponse.status_code, 401)

    def test_un_jeton_invente_ne_donne_rien(self):
        """⚠️ **Le cœur de ce que la session apporte.**

        Avant, il suffisait de connaître un numéro — huit chiffres — pour lire
        les commandes de quelqu'un. Un jeton de 256 bits ne se devine pas.
        """
        self.client.credentials(HTTP_AUTHORIZATION="Jeton pas-le-bon-jeton")
        self.assertEqual(self.client.get("/api/commandes/").status_code, 401)

    def test_le_numero_en_parametre_n_identifie_plus_personne(self):
        """L'ancienne porte est fermée, et doit le rester.

        La laisser « pour compatibilité » laisserait la porte ouverte juste à
        côté de la serrure qu'on vient de poser.
        """
        reponse = self.client.get("/api/commandes/?telephone=%2B22890123456")
        self.assertEqual(reponse.status_code, 401)

    def test_on_ne_voit_pas_les_commandes_d_un_autre(self):
        autre = Acheteur.objects.create(telephone="+22899999999", nom="Yawa T.")
        enregistrer_paiement(
            campagne=self.campagne,
            acheteur=autre,
            quantite=1,
            quartier="Agoe",
            repere="carrefour Assiyéyé",
            telephone="+22899999999",
            cle_idempotence="idem-test-0002",
        )

        connecter(self.client, "+22890123456")
        reponse = self.client.get("/api/commandes/")
        codes = [ligne["code_livraison"] for ligne in reponse.json()]
        self.assertEqual(codes, [self.commande.code_livraison])


class PasDeMurTest(SocleTest):
    """§1.5 — on navigue librement, le compte est demandé au moment de payer."""

    def test_le_catalogue_est_lisible_sans_compte(self):
        reponse = APIClient().get("/api/campagnes/")
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.json()["count"], 1)

    def test_une_campagne_est_lisible_sans_compte(self):
        reponse = APIClient().get(f"/api/campagnes/{self.campagne.pk}/")
        self.assertEqual(reponse.status_code, 200)
        self.assertEqual(reponse.json()["titre"], "Écouteurs filaires avec micro")

    def test_les_questions_sont_lisibles_sans_compte(self):
        reponse = APIClient().get("/api/questions/")
        self.assertEqual(reponse.status_code, 200)

    def test_poser_une_question_demande_un_compte(self):
        """Lire est libre, écrire engage."""
        reponse = APIClient().post(
            "/api/questions/",
            {"campagne": self.campagne.pk, "texte": "Quelle garantie ?"},
            format="json",
        )
        self.assertEqual(reponse.status_code, 401)

    def test_avec_un_compte_on_peut_poser_sa_question(self):
        client = APIClient()
        connecter(client, "+22890123456")
        reponse = client.post(
            "/api/questions/",
            {"campagne": self.campagne.pk, "texte": "Quelle garantie ?"},
            format="json",
        )
        self.assertEqual(reponse.status_code, 201, reponse.data)
