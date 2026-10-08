# syntax=docker/dockerfile:1

# ╭──────────────────────────────────────────────────────────────────────────╮
# │ Le front — deux applications, deux cibles, une seule construction        │
# ╰──────────────────────────────────────────────────────────────────────────╯
#
# `npm run build` produit les deux paquets d'un coup : `dist/` pour la boutique
# et `dist-admin/` pour l'administration (voir `vite.config.ts` et
# `vite.admin.config.ts`). Ce fichier les emballe dans deux images distinctes,
# choisies par `--target` :
#
#   docker build --target boutique .
#   docker build --target admin .
#
# Une seule construction Node pour les deux : les dependances ne s'installent
# qu'une fois, et les deux images sortent du meme arbre de fichiers — donc la
# boutique et l'administration ne peuvent pas diverger par accident.
#
# ⚠️ **Node n'est pas dans les images finales.** Ce sont des fichiers statiques
# servis par nginx. Embarquer le constructeur dans l'image servie, c'est
# multiplier sa taille par dix et exposer un interpreteur qui n'a plus rien a
# faire.


# ── Etape 1 : construire les deux paquets ──────────────────────────────────
FROM node:22-alpine AS construction

WORKDIR /app

# `package-lock.json` est copie avec `package.json`, et c'est `npm ci` — non
# `npm install` — qui s'en sert : `ci` installe **exactement** les versions du
# verrou et echoue si les deux fichiers ne concordent pas. Une image doit se
# reconstruire a l'identique dans six mois.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# ⚠️⚠️ **`VITE_API_URL` est une variable de CONSTRUCTION, pas d'execution.**
#
# C'est le point le plus facile a manquer de tout ce fichier. Vite **inscrit la
# valeur en clair dans le JavaScript produit** : il n'y a pas de serveur Node
# pour la relire au demarrage, rien que des fichiers deja ecrits. Changer
# l'adresse de l'API demande donc de **reconstruire l'image** ; la passer dans
# `environment:` au lancement n'aurait aucun effet, et c'est un piege d'autant
# plus sournois que rien ne proteste.
#
# ⚠️ **Et c'est une adresse vue depuis le NAVIGATEUR, pas depuis le reseau
# Docker.** `http://api:8000/api` fonctionne entre conteneurs et echoue dans le
# navigateur, qui ne resout pas `api`. Il faut `http://localhost:8000/api` en
# local, ou le vrai nom de domaine public au deploiement.
#
# Le defaut vise le `runserver` local, comme `frontend/.env.exemple`.
ARG VITE_API_URL="http://127.0.0.1:8000/api"
ENV VITE_API_URL=$VITE_API_URL

# `npm run build` enchaine `tsc -b` puis les deux `vite build`. Le typage est
# donc verifie ici : **une erreur de type arrete la construction de l'image**,
# ce qui est exactement ou l'on veut l'apprendre.
RUN npm run build


# ── Etape 2a : la boutique — acheteur, groupeur, livreur ───────────────────
FROM nginx:1.29-alpine AS boutique

COPY --from=construction /app/dist /usr/share/nginx/html
COPY nginx.boutique.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Verification de sante : nginx repond-il vraiment ? Un conteneur « demarre »
# dont le serveur a renonce ressemble, pour Compose, a un conteneur en bonne
# sante — jusqu'a ce qu'un visiteur s'en apercoive.
#
# `wget` est present dans l'image Alpine de nginx ; `curl` ne l'est pas.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1


# ── Etape 2b : l'administration — ecrans A1 et A2 ──────────────────────────
FROM nginx:1.29-alpine AS admin

# ⚠️ **`dist-admin/`, et la page s'appelle `admin.html`, pas `index.html`.**
# La configuration nginx ci-dessous doit donc nommer `admin.html` comme page
# d'index, sinon la racine du site renvoie 403 — nginx cherchant un
# `index.html` qui n'existe pas dans ce paquet.
COPY --from=construction /app/dist-admin /usr/share/nginx/html
COPY nginx.admin.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
