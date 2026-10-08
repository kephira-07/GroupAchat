/**
 * Le jeton d'administration : ou il vit, et surtout ou il ne vit pas.
 *
 * ## ⚠️ Il n'est **pas** dans le paquet construit, et ce n'est pas negociable
 *
 * La solution evidente aurait ete une variable `VITE_JETON_ADMIN` lue a la
 * construction. **Elle est fausse**, et d'une facon qui ne se voit pas :
 * tout ce que Vite remplace dans le code se retrouve **en clair dans le
 * JavaScript livre**. N'importe qui ouvrant la page d'administration — ou
 * simplement son fichier `.js` — lirait le jeton, puis pourrait appeler
 * `/api/dossiers/` depuis n'importe ou et lire des noms, des numeros de
 * telephone et des references de pieces d'identite.
 *
 * Mettre un secret dans un paquet front, c'est le publier. Le fait que la page
 * soit servie sur un autre port n'y change rien : elle est servie a qui la
 * demande.
 *
 * ## Ce qui est fait a la place
 *
 * L'administrateur **saisit le jeton a l'ouverture**, et il est garde dans le
 * `sessionStorage` — pas le `localStorage` :
 *
 * | | `sessionStorage` | `localStorage` |
 * |---|---|---|
 * | Ferme l'onglet | oublie | **garde pour toujours** |
 * | Poste partage | sur | le suivant est administrateur |
 *
 * Sur un poste partage, et plus encore sur un portable qu'on emporte, un jeton
 * qui survit a la fermeture de l'onglet est un jeton qu'on a oublie avoir
 * laisse.
 *
 * ## Et ce que ca ne remplace pas
 *
 * **Ce n'est toujours pas de l'authentification.** Un jeton partage ne
 * distingue pas deux administrateurs, ne se revoque pas individuellement, et
 * le champ « decide par » des decisions repose sur la bonne foi de celui qui
 * le remplit. C'est un verrou sur une porte, pas un controle d'identite — et
 * c'est tout de meme mieux que la porte ouverte qu'etait le `AllowAny` du
 * §1.5 sur ces routes-la.
 *
 * Le jour ou les comptes existent, ce fichier disparait au profit d'une
 * session.
 */

const CLE = "groupachat.jeton-admin";

/** Le jeton de la session, s'il a ete saisi. */
export function lireLeJeton(): string {
  try {
    return sessionStorage.getItem(CLE) ?? "";
  } catch {
    /* Navigation privee, stockage bloque par une politique d'entreprise : on
       redemande le jeton plutot que de planter. L'administrateur le ressaisira
       a chaque ouverture, ce qui est penible mais pas bloquant. */
    return "";
  }
}

export function retenirLeJeton(jeton: string): void {
  try {
    sessionStorage.setItem(CLE, jeton);
  } catch {
    /* Sans stockage, le jeton vit dans l'etat React de la page : il marche
       jusqu'au rechargement. */
  }
}

/** Oublie le jeton — le « Fermer la session » de l'administration. */
export function oublierLeJeton(): void {
  try {
    sessionStorage.removeItem(CLE);
  } catch {
    /* Rien a oublier s'il n'a jamais pu etre ecrit. */
  }
}
