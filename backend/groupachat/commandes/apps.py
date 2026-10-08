# -*- coding: utf-8 -*-
from django.apps import AppConfig


class CommandesConfig(AppConfig):
    """Commandes, paiements et versements."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "groupachat.commandes"
    # Label court : les tables s'appellent `comptes_acheteur` et non
    # `groupachat_comptes_acheteur`.
    label = "commandes"
