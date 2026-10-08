# -*- coding: utf-8 -*-
from django.apps import AppConfig


class ComptesConfig(AppConfig):
    """Acheteurs, groupeurs et dossiers KYC."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "groupachat.comptes"
    # Label court : les tables s'appellent `comptes_acheteur` et non
    # `groupachat_comptes_acheteur`.
    label = "comptes"
