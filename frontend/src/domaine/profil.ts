/**
 * Le profil retenu d'une visite a l'autre.
 *
 * L'ecran de choix de profil **ne doit venir qu'une fois**. C'est l'une des
 * trois conditions qui l'empechent de devenir le mur que le §1.5 interdit
 * (voir l'en-tete de `pages/ChoixProfil.tsx`) : un aiguillage qu'on repose a
 * chaque lancement n'est plus un aiguillage, c'est un peage.
 *
 * Tenir cette promesse demande de se souvenir du choix en dehors de React,
 * puisque l'etat d'un composant meurt avec l'onglet. D'ou ce module, et son
 * unique responsabilite.
 *
 * ## Pourquoi `localStorage`, et ce que ca coute
 *
 * C'est le seul stockage disponible sans serveur ni compte, et le choix de
 * profil n'est **ni une donnee personnelle ni un secret** : c'est une
 * preference d'affichage. Le cout est connu et accepte :
 *
 * - il est **par navigateur et par appareil.** Le meme utilisateur qui ouvre
 *   le site sur son telephone puis sur un ordinateur reverra l'ecran de
 *   choix. C'est le comportement correct tant qu'il n'y a pas de compte ;
 * - il **disparait** en navigation privee, si l'utilisateur vide ses donnees
 *   de site, ou si son navigateur les bloque. L'ecran de choix revient alors,
 *   ce qui est degrade mais jamais casse.
 *
 * ⚠️ **Chaque acces est dans un `try`, et ce n'est pas de la prudence
 * decorative.** En navigation privee sur certains navigateurs, et avec les
 * cookies tiers bloques dans une iframe, le simple fait de *lire*
 * `window.localStorage` **leve une exception** au lieu de renvoyer `null`.
 * Sans ces gardes, l'application ne s'afficherait pas du tout pour ces
 * visiteurs — un ecran blanc, pas un ecran degrade.
 *
 * Quand l'authentification sera branchee, ce module disparait : le profil
 * viendra du compte, et il suivra l'utilisateur d'un appareil a l'autre.
 */

/**
 * Les deux profils que l'ecran de choix departage.
 *
 * **Le livreur et l'administrateur n'en font pas partie**, et c'est
 * delibere : on ne « choisit » pas d'etre livreur — on ouvre un lien recu le
 * matin, qui ne couvre que la tournee du jour (ecran 22). Quant a
 * l'administration, elle vit sur **un autre port**, hors de cette
 * application.
 */
export type Profil = "acheteur" | "groupeur";

/**
 * Prefixe par le nom du produit : `localStorage` est partage par toute
 * l'origine, donc par le port en developpement. Une cle nue comme `profil`
 * entrerait en collision avec n'importe quoi d'autre servi depuis la meme
 * origine.
 */
const CLE = "groupachat.profil";

/** Garde-fou : une valeur ecrite par une version precedente peut etre n'importe quoi. */
function estProfil(valeur: string | null): valeur is Profil {
  return valeur === "acheteur" || valeur === "groupeur";
}

/**
 * Le profil de la derniere visite, ou `null` s'il n'y en a pas.
 *
 * Renvoie `null` **aussi** quand le stockage est inaccessible : pour
 * l'appelant, « je ne sais pas » et « il n'a jamais choisi » demandent la meme
 * chose — montrer l'ecran de choix.
 */
export function lireProfil(): Profil | null {
  try {
    const valeur = window.localStorage.getItem(CLE);
    return estProfil(valeur) ? valeur : null;
  } catch {
    return null;
  }
}

/** Retient le choix. Un echec d'ecriture n'interrompt rien. */
export function ecrireProfil(profil: Profil): void {
  try {
    window.localStorage.setItem(CLE, profil);
  } catch {
    /* Quota plein, mode prive, stockage bloque : l'ecran de choix reviendra
       au prochain lancement. C'est degrade, et ca ne justifie pas de casser
       le parcours en cours. */
  }
}

/**
 * Oublie le choix, pour que l'ecran revienne.
 *
 * Sert au selecteur de demonstration — montrer l'ecran de choix a un jury
 * demande de pouvoir le rejouer sans vider les donnees du navigateur a la
 * main.
 */
/**
 * Oublie le profil retenu : le prochain lancement reposera la question.
 *
 * **Sans appelant aujourd'hui**, et conserve volontairement. C'est la seule
 * facon de rejouer l'ecran de choix — pour une demonstration devant un jury,
 * ou depuis un futur ecran de reglages. Le supprimer obligerait a le reecrire
 * a l'identique, et personne ne retrouverait la cle employee.
 */
export function oublierProfil(): void {
  try {
    window.localStorage.removeItem(CLE);
  } catch {
    /* Rien a faire : s'il n'a pas pu etre ecrit, il n'y a rien a retirer. */
  }
}

// ── Le numero du groupeur ───────────────────────────────────────────────────

const CLE_TELEPHONE = "groupachat.telephone-groupeur";

/**
 * Retient le numero avec lequel le dossier KYC a ete depose.
 *
 * **Sans lui, un groupeur qui ferme l'onglet ne retrouve jamais sa reponse.**
 * L'etat de son dossier vit sur le serveur et se lit par
 * `GET /api/groupeurs/dossier/?telephone=...` : il faut donc savoir quel
 * numero demander. L'etat React meurt avec l'onglet, et l'attente dure deux
 * jours ouvres.
 *
 * ## ⚠️ Un numero de telephone **est** une donnee personnelle
 *
 * Contrairement au profil retenu juste au-dessus, qui n'est qu'une preference
 * d'affichage. Trois consequences assumees :
 *
 * - il reste sur **l'appareil de l'interesse**, et n'est envoye qu'au serveur
 *   qui le connait deja — c'est lui qui l'a enregistre ;
 * - il ne donne acces qu'a **l'etat du dossier** : un pseudonyme, un etat, un
 *   motif. Ni piece, ni numero de piece, ni compte Mobile Money ;
 * - **c'est tout de meme une faiblesse**, la meme que du cote acheteur : qui
 *   connait le numero lit l'etat du dossier. Elle disparait avec
 *   l'authentification, et pas avant.
 *
 * ## ⚠️ Il ne s'efface **pas** quand le dossier est valide
 *
 * C'etait l'intention de depart — « passe ce point, il n'y a plus de reponse a
 * attendre » — et **c'etait faux**. Ce numero n'identifie pas seulement le
 * dossier KYC : il identifie **tout l'espace de travail du groupeur**. Ses
 * campagnes, son portefeuille, ses questions se lisent tous par lui
 * (`/api/espace-groupeur/...`).
 *
 * L'effacer a la validation vidait donc son tableau de bord au moment precis
 * ou il devenait utile : zero campagne, zero commande, zero franc, et
 * « Bonjour » sans nom. Le defaut etait d'autant plus trompeur qu'il frappait
 * **uniquement les groupeurs valides** — c'est-a-dire tout le monde, sauf
 * pendant les deux jours ou l'on teste l'attente.
 *
 * Il disparait avec l'authentification, qui remplacera ce numero par une
 * session. Pas avant.
 */
export function lireTelephoneGroupeur(): string {
  try {
    return window.localStorage.getItem(CLE_TELEPHONE) ?? "";
  } catch {
    return "";
  }
}

export function ecrireTelephoneGroupeur(telephone: string): void {
  try {
    window.localStorage.setItem(CLE_TELEPHONE, telephone);
  } catch {
    /* Le groupeur verra l'etat de son dossier tant qu'il garde l'onglet
       ouvert, et devra se reconnecter autrement ensuite. Degrade, pas casse. */
  }
}

/**
 * Oublie le numero — pour changer de compte sur un meme navigateur.
 *
 * ⚠️ **A ne pas appeler quand le dossier est valide** : voir ci-dessus. Ce
 * numero reste la cle de lecture de tout l'espace groupeur.
 */
export function oublierTelephoneGroupeur(): void {
  try {
    window.localStorage.removeItem(CLE_TELEPHONE);
  } catch {
    /* Rien a retirer s'il n'a jamais pu etre ecrit. */
  }
}

// ── Le mode economie de donnees ─────────────────────────────────────────────

const CLE_ECONOMIE = "groupachat.economie-donnees";

/**
 * Le mode « economie de donnees » — SPEC_ECRANS_FIGMA.md §1.6 regle 4.
 *
 * La spec le reclame explicitement comme **argument produit**, et pas comme un
 * reglage de confort : le fil en defilement plein ecran est « l'ecran le plus
 * couteux en donnees, destine au public le plus sensible au cout des
 * donnees » (§1.6). Images seulement, aucune video automatique ; et au §2.14,
 * les logos du bandeau partenaires cedent la place a du texte.
 *
 * ## Pourquoi il est lu ici et pas sur le compte
 *
 * C'est une preference d'**appareil**, pas de personne. Le meme utilisateur a
 * besoin du mode sur son telephone en 3G et pas sur l'ordinateur partage du
 * cybercafe. Le rattacher au compte le suivrait d'un appareil a l'autre, ce
 * qui est exactement l'inverse de ce qu'on veut.
 *
 * **Consequence voulue : il fonctionne sans compte.** Un visiteur qui fait
 * defiler le fil sans s'etre connecte est precisement celui a qui ce mode
 * sert. Le mettre derriere un compte contredirait le §1.5 et viderait la
 * regle 4 de son interet.
 *
 * ## ⚠️ Stocke, pas encore honore
 *
 * `pages/Profil` ecrit cette preference et la relit. **Ni `pages/Fil` ni
 * `composants/BandeauPartenaires` ne la consultent encore** : la bascule est
 * donc fidele a ce qu'elle enregistre, mais le fil charge toujours ses
 * videos. Brancher les deux lecteurs est un travail distinct, et le signaler
 * ici evite de croire la fonction terminee en voyant l'interrupteur bouger.
 */
export function lireEconomieDonnees(): boolean {
  try {
    return window.localStorage.getItem(CLE_ECONOMIE) === "oui";
  } catch {
    /* Stockage inaccessible : on repart du defaut. Le mode est **desactive**
       par defaut, parce qu'un fil sans video n'est pas le produit qu'on
       presente — c'est un choix que l'utilisateur fait, pas un etat subi. */
    return false;
  }
}

export function ecrireEconomieDonnees(actif: boolean): void {
  try {
    window.localStorage.setItem(CLE_ECONOMIE, actif ? "oui" : "non");
  } catch {
    /* La bascule tiendra le temps de l'onglet et repartira a zero ensuite.
       Degrade, jamais casse — comme le reste de ce module. */
  }
}
