import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * La configuration de **la boutique** — acheteur, groupeur, livreur, port 5173.
 *
 * L'administration a la sienne, `vite.admin.config.ts`, sur le port 5174. Vite
 * n'ouvre qu'un port par serveur de developpement, donc deux ports demandent
 * deux configurations : ce n'est pas une duplication gratuite.
 *
 * | | Boutique | Administration |
 * |---|---|---|
 * | Configuration | **ce fichier** | `vite.admin.config.ts` |
 * | Port | **5173** | 5174 |
 * | Page | `index.html` | `admin.html` |
 * | Construction | **`dist/`** | `dist-admin/` |
 */

/**
 * Refuse `/admin.html` sur le port de la boutique.
 *
 * La racine du projet contient les deux pages, et le serveur de Vite sert tout
 * ce qu'il y trouve : **sans ce garde, `http://localhost:5173/admin.html`
 * affichait l'administration.** La separation des ports n'aurait alors rien
 * separe du tout en developpement — il aurait suffi de connaitre le nom du
 * fichier.
 *
 * Ce n'est toujours **pas une mesure de securite** : l'administration reste
 * ouverte sans mot de passe sur son propre port. Ce garde sert a ce que la
 * frontiere soit vraie la ou on l'a dessinee, pour qu'on ne se fie pas a une
 * separation qui n'existe pas.
 */
/**
 * Sert `public/presentation/index.html` pour `/presentation` et
 * `/presentation/`.
 *
 * ⚠️ **Sans ce reecriveur, `/presentation/` affichait la boutique.** Vite sert
 * bien les fichiers de `publicDir` un par un — `/presentation/styles.css`
 * fonctionne — mais il **ne resout pas l'index d'un repertoire** : la demande
 * tombe alors dans le repli SPA, qui renvoie `index.html`, c'est-a-dire
 * l'application. Seul `/presentation/index.html`, ecrit en entier, marchait.
 *
 * Ce defaut n'existe qu'en developpement : en production, le
 * `try_files $uri $uri/` de `nginx.boutique.conf` resout l'index tout seul.
 */
function servirLaPresentation(): Plugin {
  const reecriveur: Connect.NextHandleFunction = (requete, _reponse, suivant) => {
    const chemin = requete.url?.split("?")[0];
    if (chemin === "/presentation" || chemin === "/presentation/") {
      requete.url = "/presentation/index.html";
    }
    suivant();
  };

  return {
    name: "groupachat-servir-la-presentation",
    configureServer(serveur) {
      serveur.middlewares.use(reecriveur);
    },
    configurePreviewServer(serveur) {
      serveur.middlewares.use(reecriveur);
    },
  };
}

function masquerAdmin(): Plugin {
  const MESSAGE =
    "Introuvable. L'administration est servie sur le port 5174 : npm run dev:admin\n";

  /* `Connect.NextHandleFunction` est le type que Vite expose pour ses propres
     middlewares : il evite d'ajouter `@types/node` au projet pour deux
     signatures, et le meme garde sert au serveur de developpement comme a
     celui de `preview`. */
  const garde: Connect.NextHandleFunction = (requete, reponse, suivant) => {
    /* `split("?")` : `/admin.html?v=3` doit etre refuse comme `/admin.html`. */
    if (requete.url?.split("?")[0] === "/admin.html") {
      reponse.statusCode = 404;
      reponse.end(MESSAGE);
      return;
    }
    suivant();
  };

  return {
    name: "groupachat-masquer-admin",
    configureServer(serveur) {
      serveur.middlewares.use(garde);
    },
    configurePreviewServer(serveur) {
      serveur.middlewares.use(garde);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), masquerAdmin(), servirLaPresentation()],

  build: {
    /**
     * **Explicite, et c'est le point de toute la separation.** Sans cette
     * ligne, `vite build` ramasserait aussi `admin.html` present a la racine,
     * et le code d'administration — montants detenus, files de travail,
     * libelles d'alertes — partirait dans la construction publique. Nommer
     * l'entree garantit que le paquet telecharge par un acheteur de Lome, sur
     * un forfait de donnees limite, n'en contient pas une ligne.
     */
    rollupOptions: { input: "index.html" },

    /**
     * Les quatre SVG du logo pesent environ 10 ko chacun, au-dessus de la
     * limite par defaut de 4 ko. On la releve pour qu'ils soient integres au
     * paquet sous forme de donnees plutot que servis comme fichiers : le logo
     * s'affiche alors avec la page, sans requete supplementaire.
     *
     * C'est ce qui compte pour la page de demarrage — un ecran de lancement
     * qui attend une requete reseau pour montrer le logo est un ecran vide.
     * Du SVG en base64 se compresse tres bien, donc le cout reel est faible.
     */
    assetsInlineLimit: 12 * 1024,
  },

  server: {
    port: 5173,
    /* S'arreter plutot que de glisser silencieusement sur 5174 — ou vit
       l'administration. Sans `strictPort`, un 5173 deja occupe ferait demarrer
       la boutique sur le port de l'administration, et on passerait un moment a
       se demander pourquoi les deux se marchent dessus. */
    strictPort: true,
  },

  preview: { port: 5173, strictPort: true },
});
