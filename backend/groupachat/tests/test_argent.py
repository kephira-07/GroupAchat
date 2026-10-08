# -*- coding: utf-8 -*-
"""Les règles d'argent — celles qu'un jury vérifie et qu'un litige oppose.

Chaque test porte le nom de la règle qu'il protège plutôt que celui de la
fonction qu'il appelle : quand l'un d'eux casse, on doit savoir **ce qui ne
tient plus**, pas seulement où.
"""

from decimal import Decimal

from django.test import TestCase

from groupachat import domaine


class CommissionTest(TestCase):
    """La commission de 5 %, à la charge du groupeur, retenue à la clôture."""

    def test_le_jeu_de_demonstration_tombe_juste(self):
        """128 000 − 6 400 = 121 600. Un jury refait ce calcul."""
        resultat = domaine.calculer_versement(Decimal("128000"))
        self.assertEqual(resultat.collecte, Decimal("128000"))
        self.assertEqual(resultat.commission, Decimal("6400"))
        self.assertEqual(resultat.verse, Decimal("121600"))

    def test_les_baskets_tombent_juste_aussi(self):
        """41 × 9 800 = 401 800, moins 5 % = 381 710 (écran 18)."""
        resultat = domaine.calculer_versement(Decimal("41") * Decimal("9800"))
        self.assertEqual(resultat.collecte, Decimal("401800"))
        self.assertEqual(resultat.commission, Decimal("20090"))
        self.assertEqual(resultat.verse, Decimal("381710"))

    def test_la_commission_ne_porte_pas_sur_les_frais_de_livraison(self):
        """La règle la plus facile à casser par distraction.

        Les frais sont payés par l'acheteur et vont au transporteur. Les
        inclure ferait payer au groupeur une commission sur de l'argent qui ne
        passe pas par lui.
        """
        parts = Decimal("128000")
        frais = Decimal("32000")  # 32 commandes × 1 000 F

        sur_les_parts = domaine.calculer_versement(parts)
        avec_les_frais = domaine.calculer_versement(parts + frais)

        self.assertEqual(sur_les_parts.commission, Decimal("6400"))
        self.assertNotEqual(avec_les_frais.commission, sur_les_parts.commission)
        # Si quelqu'un passe un jour le total au lieu des parts, le groupeur
        # perd 1 600 F sans que rien ne le signale. D'où ce test.
        self.assertEqual(avec_les_frais.commission - sur_les_parts.commission,
                         Decimal("1600"))

    def test_aucun_centime_de_franc(self):
        """Le franc CFA n'a pas de subdivision : tout est arrondi au franc."""
        resultat = domaine.calculer_versement(Decimal("1333"))
        self.assertEqual(resultat.commission, Decimal("67"))
        self.assertEqual(resultat.verse, Decimal("1266"))
        self.assertEqual(resultat.commission + resultat.verse, resultat.collecte)


class FraisDeLivraisonTest(TestCase):
    """Les frais selon la position — §11.1 du cahier des charges."""

    def test_mille_francs_dans_lome(self):
        resultat = domaine.calculer_frais_livraison("Tokoin")
        self.assertTrue(resultat.desservi)
        self.assertEqual(resultat.montant, Decimal("1000"))

    def test_insensible_a_la_casse_et_aux_accents(self):
        for ecriture in ("tokoin", "TOKOIN", "Tokoin "):
            self.assertTrue(domaine.calculer_frais_livraison(ecriture).desservi)

    def test_zone_non_desservie(self):
        """Deux réponses possibles, et deux seulement.

        Pas de troisième cas « tarif calculé plus tard » : on ne demande jamais
        à quelqu'un de payer un total qu'on complétera après.
        """
        resultat = domaine.calculer_frais_livraison("Kpalimé")
        self.assertFalse(resultat.desservi)
        self.assertIsNone(resultat.montant)

    def test_le_fil_rouge_fait_bien_cinq_mille(self):
        """4 000 de part + 1 000 de livraison = 5 000 F payés.

        C'est l'erreur la plus facile à commettre dans ce produit : afficher
        4 000 F là où l'acheteur paie 5 000 F.
        """
        parts, frais, total = domaine.calculer_total_commande(
            Decimal("4000"), 1, "Tokoin"
        )
        self.assertEqual(parts, Decimal("4000"))
        self.assertEqual(frais, Decimal("1000"))
        self.assertEqual(total, Decimal("5000"))

    def test_les_frais_ne_sont_pas_multiplies_par_la_quantite(self):
        """Un colis, des frais. Deux parts ne font pas deux livraisons."""
        parts, frais, total = domaine.calculer_total_commande(
            Decimal("4000"), 3, "Tokoin"
        )
        self.assertEqual(parts, Decimal("12000"))
        self.assertEqual(frais, Decimal("1000"))
        self.assertEqual(total, Decimal("13000"))

    def test_zone_non_desservie_leve_une_erreur(self):
        with self.assertRaises(domaine.ZoneNonDesservie):
            domaine.calculer_total_commande(Decimal("4000"), 1, "Kpalimé")


class CodeLivraisonTest(TestCase):
    """Le code à montrer au livreur."""

    def test_la_forme_est_celle_qu_on_dicte(self):
        code = domaine.generer_code_livraison()
        self.assertRegex(code, r"^[A-Z2-9]{3}-[A-Z2-9]{3}$")

    def test_sans_les_caracteres_qu_on_confond(self):
        """Ni I ni 1, ni O ni 0 : le code se dicte au téléphone."""
        codes = "".join(domaine.generer_code_livraison() for _ in range(200))
        for confusion in "IO01":
            self.assertNotIn(confusion, codes)

    def test_les_codes_ne_se_repetent_pas(self):
        """C'est la preuve de livraison : il ne doit pas être devinable."""
        codes = {domaine.generer_code_livraison() for _ in range(500)}
        self.assertGreater(len(codes), 495)


class KycTest(TestCase):
    """Le contrôle n° 2 — §10.5 du cahier des charges."""

    def test_les_noms_identiques_concordent(self):
        self.assertTrue(domaine.noms_concordent("Akossiwa Mensah", "Akossiwa Mensah"))

    def test_l_ordre_la_casse_et_les_accents_sont_tolerés(self):
        """Refuser « MENSAH Akossiwa » serait une perte de temps pour tous."""
        for ecriture in ("MENSAH Akossiwa", "mensah akossiwa", "Akossiwa  MENSAH"):
            self.assertTrue(
                domaine.noms_concordent("Akossiwa Mensah", ecriture), ecriture
            )

    def test_un_nom_different_ne_concorde_pas(self):
        """Le prête-nom : la procédure doit s'arrêter là."""
        self.assertFalse(domaine.noms_concordent("Akossiwa Mensah", "Kodjo Amegan"))

    def test_un_nom_partiel_ne_concorde_pas(self):
        self.assertFalse(domaine.noms_concordent("Akossiwa Mensah", "Mensah"))

    def test_un_nom_vide_ne_concorde_jamais(self):
        """Sinon deux champs vides se « valideraient » mutuellement."""
        self.assertFalse(domaine.noms_concordent("", ""))
        self.assertFalse(domaine.noms_concordent("Akossiwa Mensah", ""))

    def test_les_plafonds_suivent_les_niveaux(self):
        self.assertEqual(domaine.PLAFONDS_KYC["entree"], Decimal("150000"))
        self.assertEqual(domaine.PLAFONDS_KYC["confirme"], Decimal("600000"))
        # Au cas par cas : pas de valeur inventée.
        self.assertIsNone(domaine.PLAFONDS_KYC["etabli"])
