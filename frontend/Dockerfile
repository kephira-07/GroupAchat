# syntax=docker/dockerfile:1

# ╭──────────────────────────────────────────────────────────────────────────╮
# │ Le front — deux applications, une seule construction                     │
# ╰──────────────────────────────────────────────────────────────────────────╯
#
# `npm run build` produit les deux paquets d'un coup : `dist/` pour la boutique
# et `dist-admin/` pour l'administration (voir `vite.config.ts` et
# `vite.admin.config.ts`).
#
# Une seule construction Node pour les deux : les dependances ne s'installent
# qu'une fois, et les deux paquets sortent du meme arbre de fichiers — donc la
# boutique et l'administration ne peuvent pas diverger par accident.
#
# ⚠️ **Ce fichier ne sert plus que les paquets.** Les deux etapes nginx qui les
# servaient ont ete retirees : le serveur sera choisi autrement. Il n'y a donc
# plus de cible `boutique` ni `admin`, et plus rien ici n'ecoute sur un port.
#
# Pour recuperer les paquets construits sans lancer de serveur :
#
#   docker build --target construction -t groupachat-front:construction .
#   docker create --name extraction groupachat-front:construction
#   docker cp extraction:/app/dist ./dist
#   docker cp extraction:/app/dist-admin ./dist-admin
#   docker rm extraction


# ── Construire les deux paquets ────────────────────────────────────────────
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
