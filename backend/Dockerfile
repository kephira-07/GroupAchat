# syntax=docker/dockerfile:1

# ╭──────────────────────────────────────────────────────────────────────────╮
# │ L'API — Django 5.2 + DRF, servie par Gunicorn                            │
# ╰──────────────────────────────────────────────────────────────────────────╯
#
# Construction en deux etapes. La premiere compile les dependances, la seconde
# ne recoit que le resultat : l'image finale n'embarque ni compilateur, ni
# en-tetes de developpement, ni cache de pip.
#
# ⚠️ **`runserver` n'apparait nulle part dans ce fichier**, et ce n'est pas un
# detail de style. C'est un serveur de developpement mono-processus qui, hors
# `DEBUG`, **renvoie 404 sur tous les fichiers statiques** : l'admin Django
# s'afficherait sans feuille de style ni script. C'est Gunicorn qui sert, et
# WhiteNoise qui porte les statiques (voir `config/settings.py`).


# ── Etape 1 : les dependances ──────────────────────────────────────────────
FROM python:3.13-slim AS dependances

# `PIP_NO_CACHE_DIR` : le cache de pip ne sert a rien dans une image jetable,
# et il y pese plusieurs dizaines de mega-octets.
ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Les dependances sont copiees **seules et en premier**. Docker met en cache
# chaque etape et la rejoue tant que les fichiers qu'elle copie n'ont pas
# change : tant que `requirements.txt` est identique, modifier du code Python
# ne redeclenche pas l'installation. C'est la difference entre une
# reconstruction de trois secondes et une de deux minutes.
COPY requirements.txt .

# L'environnement virtuel est dans l'image, pas dans le systeme : il se copie
# alors d'un bloc vers l'etape suivante.
#
# `psycopg-binary` est dans `requirements.txt`, donc le pilote PostgreSQL
# arrive **deja compile** et aucun paquet de compilation n'est necessaire ici.
# Si cette ligne tombait un jour, il faudrait `gcc`, `libpq-dev` et
# `python3-dev` — a installer dans cette etape-ci uniquement, jamais dans la
# finale.
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install -r requirements.txt


# ── Etape 2 : l'image servie ───────────────────────────────────────────────
FROM python:3.13-slim AS finale

# `PYTHONUNBUFFERED` : sans lui, Python tamponne sa sortie et les journaux
# n'apparaissent dans `docker logs` que par blocs, souvent apres l'erreur
# qu'on cherchait a lire.
#
# `PYTHONDONTWRITEBYTECODE` : les `.pyc` d'un conteneur jetable ne sont jamais
# relus par un second demarrage.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=config.settings

COPY --from=dependances /opt/venv /opt/venv

WORKDIR /app

# ⚠️ **Un utilisateur non privilegie.** Par defaut un conteneur tourne en
# `root`, et une faille d'execution de code arbitraire y devient une faille
# `root` dans le conteneur — avec tout ce que les volumes montes exposent. Ce
# compte est cree avant la copie pour que les fichiers lui appartiennent sans
# un `chown -R` supplementaire.
RUN useradd --create-home --uid 10001 groupachat

COPY --chown=groupachat:groupachat . .

# ⚠️ **Le bit d'execution ne survit pas a un contexte de construction
# Windows** : NTFS ne le porte pas, et `COPY` recopie le mode tel qu'il le
# trouve. Sans ce `chmod`, le conteneur s'arrete aussitot sur
# `exec /app/entrypoint.sh: permission denied` — une erreur qui ne dit pas
# qu'elle vient du systeme de fichiers de la machine qui a construit l'image.
RUN chmod +x /app/entrypoint.sh

# `collectstatic` au moment de **construire**, pas de demarrer.
#
# Deux raisons. D'abord, le resultat est identique a chaque demarrage : le
# refaire chaque fois ne fait que retarder la mise en service. Ensuite, et
# surtout, `CompressedManifestStaticFilesStorage` ecrit un manifeste que
# WhiteNoise **lit au demarrage** ; s'il manque, l'application leve une
# exception au premier gabarit qui appelle `{% static %}`. Le produire ici
# garantit qu'une image qui se construit est une image qui demarre.
#
# Les variables donnees ici ne servent qu'a cette commande : `collectstatic`
# importe les reglages, donc il lui faut une cle, et il ne doit pas essayer de
# joindre la base. `DJANGO_FORCER_SQLITE=1` l'en empeche — aucune base n'est
# disponible pendant une construction.
RUN DJANGO_SECRET_KEY=construction-seulement \
    DJANGO_FORCER_SQLITE=1 \
    python manage.py collectstatic --noinput --clear

USER groupachat

EXPOSE 8000

# Le point d'entree attend la base, applique les migrations, puis remet la main
# a la commande ci-dessous. Voir `entrypoint.sh` pour le detail.
ENTRYPOINT ["/app/entrypoint.sh"]

# ⚠️ **`--workers 3` est une valeur de depart, pas un reglage.** La regle
# usuelle est `2 × coeurs + 1` ; trois conviennent a un petit VPS a un coeur.
# A relire quand la machine sera connue.
#
# `--access-logfile -` envoie le journal d'acces sur la sortie standard, pour
# que `docker logs` le voie. Sans lui, Gunicorn ne journalise que les erreurs,
# et on ne sait pas si une requete est arrivee.
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
