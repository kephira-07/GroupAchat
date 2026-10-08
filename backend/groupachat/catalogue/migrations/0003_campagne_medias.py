# -*- coding: utf-8 -*-
"""Une fiche produit porte jusqu'à quatre images et deux vidéos.

Le modèle n'avait qu'un `media` et son `media_alt` : une seule adresse, donc
une seule photo. Cette migration les remplace par une **liste ordonnée**, et
elle le fait en trois temps pour ne rien perdre en route — on ajoute, on
recopie, on retire.

⚠️ **La recopie est le cœur de la migration, pas une formalité.** Sans elle,
`RemoveField` emporterait la photo de chaque groupage déjà en base, et une
migration ne se relit pas : l'information serait perdue pour de bon. C'est
aussi pour cela que `vers_la_liste` a son inverse `vers_le_champ` — une
migration qui ne sait pas revenir en arrière interdit de revenir en arrière.
"""

from django.db import migrations, models


def vers_la_liste(apps, schema_editor):
    """`media` + `media_alt` deviennent la première entrée de `medias`."""
    Campagne = apps.get_model("catalogue", "Campagne")
    for campagne in Campagne.objects.exclude(media="").iterator():
        campagne.medias = [
            {
                "type": "image",
                "url": campagne.media,
                "alt": campagne.media_alt or "",
            }
        ]
        campagne.save(update_fields=["medias"])


def vers_le_champ(apps, schema_editor):
    """Le retour en arrière : la première image redevient `media`.

    Les médias suivants sont perdus — c'est inévitable, le champ d'avant n'en
    porte qu'un. La migration le fait donc sciemment plutôt que d'échouer.
    """
    Campagne = apps.get_model("catalogue", "Campagne")
    for campagne in Campagne.objects.iterator():
        images = [m for m in (campagne.medias or []) if m.get("type") == "image"]
        if not images:
            continue
        campagne.media = images[0].get("url", "")
        campagne.media_alt = images[0].get("alt", "")
        campagne.save(update_fields=["media", "media_alt"])


class Migration(migrations.Migration):

    dependencies = [
        (
            "catalogue",
            "0002_campagne_caracteristiques_campagne_point_remise_and_more",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="campagne",
            name="medias",
            field=models.JSONField(blank=True, default=list, verbose_name="médias"),
        ),
        migrations.RunPython(vers_la_liste, vers_le_champ),
        migrations.RemoveField(model_name="campagne", name="media"),
        migrations.RemoveField(model_name="campagne", name="media_alt"),
    ]
