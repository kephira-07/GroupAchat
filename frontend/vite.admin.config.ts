import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * La configuration de **l'administration** — ecran A1, port 5174.
 *
 * Elle est separee de `vite.config.ts` pour une raison que Vite impose : un
 * serveur de developpement, un port. Plusieurs pages dans une meme
 * configuration se partagent le meme port, et c'est precisement ce qu'on ne
 * veut pas ici — voir l'en-tete de `src/admin/main.tsx` pour les trois raisons
 * de separer l'outil interne de la boutique.
 *
 * | | Boutique | Administration |
 * |---|---|---|
 * | Configuration | `vite.config.ts` | **ce fichier** |
 * | Port | 5173 | **5174** |
 * | Page | `index.html` | `admin.html` |
 * | Construction | `dist/` | **`dist-admin/`** |
 * | Publics | Acheteur, groupeur, livreur | Administrateur |
 *
 * ⚠️ **Un port different n'authentifie personne.** Cette page s'ouvre encore
 * sans mot de passe, et elle le fera jusqu'a ce que l'authentification soit
 * branchee. La separation reduit la surface exposee et permet deux regles de
 * pare-feu distinctes ; elle ne remplace pas un controle d'acces. Le vrai
 * controle est celui de l'admin Django (§13.6), qui demande un compte.
 */

/**
 * Sert `admin.html` a la racine du port 5174.
 *
 * **Sans ce reecriveur, `http://localhost:5174/` affichait la boutique.** La
 * racine du projet reste `frontend/` — il le faut, pour que `/src/...`,
 * `src/index.css` et les logos partages se resolvent — et Vite y trouve
 * `index.html` avant `admin.html`. Le port de l'administration servait donc la
 * page du public, ce qui vidait la separation de son sens.
 *
 * Le middleware est installe **avant** ceux de Vite (c'est l'effet d'un
 * `use()` appele directement dans `configureServer`, sans renvoyer de
 * fonction) : la reecriture a lieu pendant que la requete vaut encore `/`.
 */
function servirAdminALaRacine(): Plugin {
  /* `Connect.NextHandleFunction` est le type que Vite expose pour ses propres
     middlewares : il evite d'ajouter `@types/node` au projet pour une
     signature. Le meme reecriveur sert au serveur de developpement et a celui
     de `preview`, qui sert `dist-admin/` ou le fichier s'appelle toujours
     `admin.html`. */
  const reecriveur: Connect.NextHandleFunction = (requete, _reponse, suivant) => {
    const chemin = requete.url?.split("?")[0] ?? "/";

    /*
     * ⚠️ **Toute demande de PAGE va sur `admin.html`, pas seulement `/`.**
     *
     * La premiere version ne reecrivait que `/` et `/index.html`. Le reste
     * tombait dans le repli SPA de Vite, qui sert `index.html` — et
     * `frontend/index.html` **est la boutique**. Resultat mesure :
     * `http://localhost:5174/nimportequoi` affichait l'application publique
     * depuis le port de l'administration, ce qui defait la separation que ce
     * fichier est cense etablir.
     *
     * Le test « ce chemin a-t-il une extension ? » distingue une page d'un
     * fichier : `/dossiers` est une page, `/assets/admin-x.js` un fichier.
     * C'est grossier mais suffisant ici — l'administration n'a aucune adresse
     * profonde (voir `src/admin/main.tsx`), donc la seule page legitime est
     * `admin.html` elle-meme.
     */
    const dernierSegment = chemin.slice(chemin.lastIndexOf("/") + 1);
    const estUnFichier = dernierSegment.includes(".");
    if (!estUnFichier || chemin === "/index.html") {
      requete.url = "/admin.html";
    }
    suivant();
  };

  return {
    name: "groupachat-admin-a-la-racine",
    configureServer(serveur) {
      serveur.middlewares.use(reecriveur);
    },
    configurePreviewServer(serveur) {
      serveur.middlewares.use(reecriveur);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), servirAdminALaRacine()],

  /**
   * Un dossier public **a part**, et c'est necessaire depuis que le site de
   * presentation vit dans `public/presentation/`.
   *
   * Vite recopie tout `publicDir` tel quel a la racine du paquet. Avec le
   * `public/` par defaut, l'administration embarquerait donc le site de
   * presentation en entier — pres de 100 ko de pages marketing dans un outil
   * interne, et `http://localhost:5174/presentation/` servirait la vitrine
   * depuis le port de l'administration.
   *
   * `public-admin/` ne contient que ce dont `admin.html` a reellement
   * besoin : le favicon.
   */
  publicDir: "public-admin",

  build: {
    /**
     * Le paquet de l'administration, a part. Sans cette ligne, `vite build`
     * construirait `index.html` et l'administration se retrouverait melee a la
     * boutique — ce que la separation cherche justement a eviter.
     */
    rollupOptions: { input: "admin.html" },
    outDir: "dist-admin",

    /* Meme raison que dans `vite.config.ts` : les SVG du logo pesent environ
       10 ko, au-dessus de la limite par defaut de 4 ko. */
    assetsInlineLimit: 12 * 1024,
  },

  server: {
    /**
     * 5174 — le port suivant celui de la boutique. Fixe, et non laisse au
     * hasard du premier port libre : un administrateur qui ouvre son ecran
     * chaque matin doit pouvoir mettre l'adresse dans ses favoris, et un port
     * qui glisse d'un lancement a l'autre rend ce favori faux.
     */
    port: 5174,
    /**
     * `strictPort` : s'arreter plutot que de glisser silencieusement sur 5175.
     * Sans lui, lancer deux fois l'administration par distraction donne deux
     * serveurs sur deux ports, et on passe un moment a se demander lequel on
     * regarde.
     */
    strictPort: true,
  },

  preview: { port: 5174, strictPort: true },
});
