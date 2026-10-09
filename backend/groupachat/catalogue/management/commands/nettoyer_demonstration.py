# -*- coding: utf-8 -*-
"""Range le catalogue : efface les groupeurs nés d'une démonstration.

Chaque passage dans l'inscription en mode démonstration crée un groupeur et
**six groupages publics**. Après quelques démonstrations, l'acheteur voit
plusieurs fois le même produit, et le catalogue ne ressemble plus à rien.

⚠️ **Cette commande ne tourne jamais toute seule**, et c'est voulu. Elle l'a
fait un moment, à chaque nouvelle inscription : elle vidait alors l'espace de
quelqu'un qui était en train de s'en servir, sans rien dire. Un catalogue
encombré se range en une commande ; une session effacée sous les yeux de son
utilisateur ne se rattrape pas.

Les groupeurs du jeu de données (`charger_demo`) ne sont **pas** concernés :
ils n'ont pas de décision signée « Mode démonstration », et leurs chiffres
sont ceux que le fil rouge (§3) promet à un jury.

    python manage.py nettoyer_demonstration
"""

from django.core.management.base import BaseCommand

from groupachat.demonstration import oublier_les_precedentes


class Command(BaseCommand):
    help = "Efface les groupeurs créés par le mode démonstration."

    def handle(self, *args, **options):
        oublies = oublier_les_precedentes()

        if oublies == 0:
            self.stdout.write("Aucun groupeur de démonstration à effacer.")
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"{oublies} groupeur{'s' if oublies > 1 else ''} de "
                f"démonstration effacé{'s' if oublies > 1 else ''}, avec "
                f"leurs groupages, commandes et questions."
            )
        )
