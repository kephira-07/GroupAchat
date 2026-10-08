# -*- coding: utf-8 -*-
from django.apps import AppConfig


class CatalogueConfig(AppConfig):
    """Les campagnes de groupage."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "groupachat.catalogue"
    # Label court : les tables s'appellent `comptes_acheteur` et non
    # `groupachat_comptes_acheteur`.
    label = "catalogue"
