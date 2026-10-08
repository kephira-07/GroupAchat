import { appeler } from "./client";

/**
 * Le compte acheteur : code SMS, session, reconnexion automatique.
 *
 * ## Où vit le jeton, et pourquoi là
 *
 * Dans le `localStorage`, et non le `sessionStorage` — contrairement au jeton
 * d'administration, qui lui est volontairement oublié à la fermeture de
 * l'onglet. La différence tient à ce que les deux protègent :
 *
 * | | Jeton d'administration | Jeton acheteur |
 * |---|---|---|
 * | Donne accès à | **Tous** les dossiers, noms, pièces | **Son** compte |
 * | Poste partagé | Le suivant devient administrateur | Le suivant voit ses commandes |
 * | Oublié à la fermeture | **oui** | non — c'est le but |
 *
 * Un acheteur à qui on redemanderait un code SMS à chaque visite n'aurait pas
 * de compte, il aurait une corvée. Et ce qu'il risque en cas d'appareil
 * partagé — que quelqu'un voie ses commandes — n'est pas du même ordre que de
 * donner à un inconnu l'annuaire des groupeurs.
 *
 * ⚠️ **Ce n'est toujours pas un mot de passe.** Qui a l'appareil déverrouillé
 * a le compte. C'est le compromis assumé d'un produit dont le §1.5 interdit le
 * mur d'authentification : on ne peut pas à la fois ne rien demander à
 * l'entrée et exiger un secret à chaque visite.
 */

const CLE = "groupachat.jeton-acheteur";

export function lireLeJeton(): string {
  try {
    return localStorage.getItem(CLE) ?? "";
  } catch {
    /* Navigation privée, stockage bloqué : la session vivra le temps de
       l'onglet, et il faudra refaire un code à la prochaine visite. Dégradé,
       jamais cassé. */
    return "";
  }
}

export function retenirLeJeton(jeton: string): void {
  try {
    localStorage.setItem(CLE, jeton);
  } catch {
    /* Voir ci-dessus. L'appel en mémoire prend le relais. */
  }
}

export function oublierLeJeton(): void {
  try {
    localStorage.removeItem(CLE);
  } catch {
    /* Rien à retirer s'il n'a jamais pu être écrit. */
  }
}

// ── Ce que le serveur sait de l'acheteur ───────────────────────────────────

export interface Profil {
  id: number;
  telephone: string;
  nom: string;
  /** La **dernière** adresse de livraison, pour pré-remplir la suivante. */
  quartier: string;
  repere: string;
}

export interface CodeEnvoye {
  envoye: boolean;
  /** L'écran sait alors s'il devra demander le nom à l'étape suivante. */
  compte_existe: boolean;
  /**
   * ⚠️ **Rempli uniquement en développement.** Le serveur refuse de servir un
   * code fixe en production : voir `comptes/sessions.py`. L'écran l'affiche
   * plutôt que de laisser chercher — un SMS réel suppose un fournisseur, qui
   * n'est pas branché (§18.2).
   */
  code_de_demonstration: string | null;
}

export interface SessionOuverte {
  jeton: string;
  expire_le: string;
  acheteur: Profil;
  compte_cree: boolean;
}

/** Demande l'envoi d'un code à quatre chiffres. */
export function demanderUnCode(
  telephone: string,
  signal?: AbortSignal,
): Promise<CodeEnvoye> {
  return appeler("/comptes/code/", {
    methode: "POST",
    corps: { telephone },
    signal,
  });
}

/**
 * Vérifie le code et ouvre la session. **Crée le compte s'il manque.**
 *
 * ⚠️ `quartier` et `repere` sont ceux que l'acheteur **vient de saisir** à
 * l'écran de commande. On ne les lui redemande pas : les envoyer ici les
 * enregistre sur son compte, et sa prochaine commande arrivera pré-remplie.
 * Ajouter un champ adresse à cette feuille serait un écran de formulaire de
 * plus au moment précis où il s'apprête à payer.
 */
export function ouvrirUneSession(
  entree: {
    telephone: string;
    code: string;
    nom?: string;
    quartier?: string;
    repere?: string;
  },
  signal?: AbortSignal,
): Promise<SessionOuverte> {
  return appeler("/comptes/session/", {
    methode: "POST",
    corps: entree,
    signal,
  });
}

/**
 * Le profil, avec le jeton retenu. **C'est la reconnexion automatique.**
 *
 * Appelée au lancement : si elle répond, l'acheteur est connecté sans rien
 * faire ; si elle répond 401, le jeton est périmé et on l'oublie.
 */
export function lireMonProfil(signal?: AbortSignal): Promise<Profil> {
  return appeler("/comptes/moi/", { signal });
}

/** Révoque **cette** session côté serveur, et oublie le jeton ici. */
export async function seDeconnecter(): Promise<void> {
  try {
    await appeler("/comptes/deconnexion/", { methode: "POST", corps: {} });
  } catch {
    /* Le serveur est injoignable : on oublie quand même le jeton localement.
       Mieux vaut une session orpheline côté serveur — qui expirera — qu'un
       acheteur qui croit s'être déconnecté et ne l'est pas. */
  }
  oublierLeJeton();
}

/**
 * Complete son profil — le nom, l'adresse. **Appel authentifie.**
 *
 * Elle existe parce que le nom est demande *apres* le code : prouver qu'on a
 * le telephone est la seule chose qui engage, et un formulaire pose avant
 * cette preuve serait rempli par n'importe qui. Mais une fois le code valide,
 * la session est ouverte et le code consomme — il faut donc un second appel.
 *
 * ⚠️ **Seuls les champs fournis changent.** Envoyer `{nom}` n'efface pas
 * l'adresse : quelqu'un qui se reconnecte depuis un autre appareil ne doit pas
 * decouvrir son adresse perdue au moment de commander.
 */
export function completerMonProfil(
  champs: { nom?: string; quartier?: string; repere?: string },
  signal?: AbortSignal,
): Promise<Profil> {
  return appeler("/comptes/moi/profil/", {
    methode: "PATCH",
    corps: champs,
    signal,
  });
}
