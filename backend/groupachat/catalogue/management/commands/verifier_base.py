# -*- coding: utf-8 -*-
"""Dit sur quelle base on travaille, et si elle répond.

    python manage.py verifier_base

**Cette commande existe pour une raison précise** : SQLite est le secours, et
un secours silencieux est un piège. Sans elle, on peut lancer la suite de tests
pendant des semaines en croyant valider PostgreSQL alors qu'un ``.env`` mal
nommé fait tout tourner sur un fichier local — et découvrir les différences de
moteur en production.
"""

from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import OperationalError, connection


class Command(BaseCommand):
    help = "Affiche le moteur de base de données utilisé et teste la connexion."

    def handle(self, *args, **options):
        reglages = settings.DATABASES["default"]
        moteur = getattr(settings, "MOTEUR_UTILISE", "inconnu")

        self.stdout.write(f"Moteur     : {moteur}")
        self.stdout.write(f"Base       : {reglages.get('NAME')}")
        if moteur == "postgresql":
            self.stdout.write(
                f"Serveur    : {reglages.get('HOST')}:{reglages.get('PORT')}"
            )
            self.stdout.write(f"Utilisateur: {reglages.get('USER')}")

        try:
            with connection.cursor() as curseur:
                curseur.execute("SELECT 1")
                curseur.fetchone()
                if moteur == "postgresql":
                    curseur.execute("SELECT version()")
                    version = curseur.fetchone()[0]
                    self.stdout.write(f"Version    : {version.split(',')[0]}")
        except OperationalError as erreur:
            self.stderr.write(self.style.ERROR(f"Connexion impossible : {erreur}"))
            raise SystemExit(1) from erreur

        if moteur == "sqlite":
            self.stdout.write(
                self.style.WARNING(
                    "\nSQLite est le secours, pas la configuration de référence. "
                    "Le cahier des charges impose PostgreSQL : renseignez "
                    "DATABASE_URL dans le .env de la racine avant de conclure quoi "
                    "que "
                    "ce soit d'une suite verte."
                )
            )
        else:
            self.stdout.write(self.style.SUCCESS("\nConnexion établie."))
