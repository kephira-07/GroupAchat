# -*- coding: utf-8 -*-
"""Le ``Versement`` devient un ``Retrait``, et la commission un frais fixe.

Le modèle économique a changé : l'argent de l'acheteur est inscrit au
portefeuille du groupeur dès son paiement, la plateforme ne verse plus rien, et
elle retient **1 500 F par groupage abouti au moment du retrait** au lieu de 5 %
du collecté. Voir §9 et §9.2 du cahier des charges.

⚠️ **Les montants déjà en base sont recalculés**, et c'est volontaire. Une table
qui mélangerait des lignes à 5 % et des lignes à 1 500 F ne serait lisible par
personne : ni le groupeur dans son portefeuille, ni nous dans un rapprochement.
Comme aucun franc réel n'a circulé — le paiement est simulé jusqu'à l'agrément
d'un agrégateur (§18.2) —, recalculer ne réécrit pas d'histoire comptable : ça
remet une base de démonstration en accord avec la règle en vigueur. Le jour où
de vrais paiements existeront, cette migration-ci ne devra **pas** servir de
modèle : il faudra alors laisser les anciennes lignes telles quelles.
"""

from django.db import migrations, models


def recalculer_les_frais(apps, schema_editor):
    """1 500 F fixes à la place des 5 %, et jamais de net négatif."""
    Retrait = apps.get_model("commandes", "Retrait")
    for retrait in Retrait.objects.all():
        frais = min(1500, retrait.collecte)
        retrait.frais_plateforme = frais
        retrait.net = retrait.collecte - frais
        retrait.save(update_fields=["frais_plateforme", "net"])


def revenir_aux_cinq_pour_cent(apps, schema_editor):
    """La marche arrière, pour que la migration soit réversible."""
    Retrait = apps.get_model("commandes", "Retrait")
    for retrait in Retrait.objects.all():
        commission = round(retrait.collecte * 5 / 100)
        retrait.frais_plateforme = commission
        retrait.net = retrait.collecte - commission
        retrait.save(update_fields=["frais_plateforme", "net"])


class Migration(migrations.Migration):

    dependencies = [
        ("commandes", "0002_versement_etat_versement_libere_le_and_more"),
    ]

    operations = [
        migrations.RenameModel(old_name="Versement", new_name="Retrait"),
        migrations.AlterModelOptions(
            name="retrait",
            options={
                "ordering": ("-effectue_le",),
                "verbose_name": "retrait",
                "verbose_name_plural": "retraits",
            },
        ),
        migrations.RenameField(
            model_name="retrait", old_name="commission", new_name="frais_plateforme"
        ),
        migrations.RenameField(model_name="retrait", old_name="verse", new_name="net"),
        migrations.AlterField(
            model_name="retrait",
            name="frais_plateforme",
            field=models.DecimalField(
                decimal_places=0, max_digits=12, verbose_name="frais de plateforme"
            ),
        ),
        migrations.AlterField(
            model_name="retrait",
            name="net",
            field=models.DecimalField(
                decimal_places=0, max_digits=12, verbose_name="net pour le groupeur"
            ),
        ),
        migrations.AlterField(
            model_name="retrait",
            name="campagne",
            field=models.OneToOneField(
                on_delete=models.deletion.PROTECT,
                related_name="retrait",
                to="catalogue.campagne",
                verbose_name="campagne",
            ),
        ),
        migrations.AddField(
            model_name="retrait",
            name="demande_le",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="demandé le"
            ),
        ),
        migrations.AlterField(
            model_name="retrait",
            name="libere_le",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="exécuté le"
            ),
        ),
        migrations.AlterField(
            model_name="retrait",
            name="libere_par",
            field=models.CharField(
                blank=True, max_length=120, verbose_name="exécuté par"
            ),
        ),
        migrations.AlterField(
            model_name="retrait",
            name="effectue_le",
            field=models.DateTimeField(auto_now_add=True, verbose_name="ouvert le"),
        ),
        # ⚠️ Le renommage d'état doit précéder l'`AlterField` des `choices` :
        # « en-attente » n'est plus une valeur permise après, et une base qui en
        # contient encore ne passerait plus aucune validation de formulaire.
        migrations.RunSQL(
            sql="UPDATE commandes_retrait SET etat = 'retirable' "
            "WHERE etat = 'en-attente';",
            reverse_sql="UPDATE commandes_retrait SET etat = 'en-attente' "
            "WHERE etat IN ('retirable', 'demande');",
        ),
        migrations.AlterField(
            model_name="retrait",
            name="etat",
            field=models.CharField(
                choices=[
                    ("retirable", "Retirable"),
                    ("demande", "Retrait demandé"),
                    ("effectue", "Effectué"),
                    ("annule", "Annulé"),
                ],
                default="retirable",
                max_length=20,
                verbose_name="état",
            ),
        ),
        migrations.RunPython(recalculer_les_frais, revenir_aux_cinq_pour_cent),
    ]
