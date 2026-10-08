# -*- coding: utf-8 -*-
from django.apps import AppConfig


class EchangesConfig(AppConfig):
    """Questions publiques et demandes de produit."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "groupachat.echanges"
    # Label court : les tables s'appellent `comptes_acheteur` et non
    # `groupachat_comptes_acheteur`.
    label = "echanges"
