#!/bin/sh
#
# Ce qui doit arriver entre le demarrage du conteneur et la premiere requete
# servie : attendre la base, appliquer les migrations, et seulement ensuite
# rendre la main a Gunicorn.
#
# `set -e` : la moindre commande en echec arrete le script. Sans lui, une
# migration qui echoue laisserait Gunicorn demarrer sur un schema incomplet, et
# le probleme se manifesterait bien plus loin, sous la forme d'erreurs 500
# incomprehensibles.
set -e

# ── Attendre PostgreSQL ────────────────────────────────────────────────────
#
# ⚠️ **Le `depends_on` de Compose ne suffit pas.** Meme avec une verification
# de sante, un conteneur declare « sain » peut etre en train de rejouer son
# journal de transactions. Et sur un VPS lent, le premier demarrage de
# PostgreSQL — qui initialise son repertoire de donnees — prend plusieurs
# secondes de plus que la verification ne le laisse croire.
#
# On interroge donc la base **par le code qui va s'en servir** : si Django
# arrive a ouvrir une connexion, la base est prete pour Django. Un `pg_isready`
# repondrait sur le serveur sans rien dire du role ni de la base nommee dans
# `DATABASE_URL`.
if [ -n "$DATABASE_URL" ] && [ "$DJANGO_FORCER_SQLITE" != "1" ]; then
  echo "→ attente de PostgreSQL…"
  tentative=0
  until python -c "
import django, sys
django.setup()
from django.db import connections
try:
    connections['default'].cursor()
except Exception as erreur:
    print(erreur, file=sys.stderr)
    sys.exit(1)
" 2>/dev/null; do
    tentative=$((tentative + 1))
    # 60 tentatives d'une seconde. Au-dela, ce n'est plus un demarrage lent,
    # c'est une erreur de configuration — un mot de passe faux, un nom d'hote
    # qui ne resout pas — et une boucle infinie la cacherait indefiniment.
    if [ "$tentative" -ge 60 ]; then
      echo "✗ PostgreSQL injoignable apres 60 s. Verifiez DATABASE_URL." >&2
      # On relance une derniere fois **sans** masquer la sortie : le message
      # d'erreur de psycopg dit precisement ce qui ne va pas, et c'est
      # exactement ce qu'on veut dans `docker logs`.
      python -c "
import django
django.setup()
from django.db import connections
connections['default'].cursor()
"
      exit 1
    fi
    sleep 1
  done
  echo "→ PostgreSQL repond."
fi

# ── Les migrations ─────────────────────────────────────────────────────────
#
# Elles tournent a chaque demarrage, et c'est voulu : `migrate` est idempotent,
# il ne fait rien quand il n'y a rien a faire. Le cout est d'une fraction de
# seconde, et le benefice est qu'un deploiement ne peut pas oublier cette
# etape.
#
# ⚠️ **Cela ne tient que parce qu'il n'y a qu'un seul conteneur d'API.** Avec
# plusieurs repliques demarrant ensemble, deux `migrate` concurrents se
# marcheraient dessus : il faudrait alors une tache de migration distincte,
# executee une fois avant la mise en service.
echo "→ migrations…"
python manage.py migrate --noinput

# ── Le jeu de demonstration, sur demande seulement ─────────────────────────
#
# `CHARGER_DEMO=1` charge le jeu du §3. Il est **hors du chemin par defaut** :
# une commande qui ecrit des donnees ne doit pas s'executer a chaque
# redemarrage sans qu'on l'ait demande.
if [ "$CHARGER_DEMO" = "1" ]; then
  echo "→ jeu de demonstration (§3)…"
  python manage.py charger_demo
fi

# ── Le superutilisateur, sur demande seulement ─────────────────────────────
#
# L'admin Django (§13.6) est inutilisable sans compte, et le creer demande un
# terminal interactif — qu'un conteneur qui demarre n'a pas. Ces trois
# variables permettent de le creer une fois, sans invite.
#
# `createsuperuser --noinput` ne fait rien si l'utilisateur existe deja : il
# sort en erreur, et le `|| true` absorbe ce cas precis pour qu'un
# redemarrage ne tombe pas la-dessus.
#
# ⚠️ **Un mot de passe passe par l'environnement se retrouve dans
# `docker inspect` et dans l'historique du shell.** C'est acceptable pour une
# demonstration, pas pour de la production : la, il faut creer le compte une
# fois avec `docker compose exec api python manage.py createsuperuser`, qui
# demande le mot de passe sans l'ecrire nulle part.
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  echo "→ superutilisateur « $DJANGO_SUPERUSER_USERNAME »…"
  python manage.py createsuperuser --noinput || true
fi

echo "→ demarrage : $*"

# `exec` remplace le shell par Gunicorn au lieu de le lancer comme enfant.
# C'est ce qui fait que Gunicorn devient le processus 1 et recoit directement
# le `SIGTERM` de `docker stop` : sans `exec`, le signal irait au shell, qui ne
# le transmettrait pas, et Docker tuerait le conteneur de force au bout de dix
# secondes — en coupant les requetes en cours.
exec "$@"
